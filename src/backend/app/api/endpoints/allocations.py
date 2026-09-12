from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.models import Allocation, Zone, ZoneState, Resource, AuditLog, AgencyTask
from app.agents.agent_b import solve_allocations
from app.core.event_bus import event_bus
from app.core.auth import get_current_official_user
import uuid

router = APIRouter()


@router.get("/allocations")
def list_allocations(
    db: Session = Depends(get_db),
    official: dict = Depends(get_current_official_user)
):
    """List all current allocation records."""
    allocations = db.query(Allocation).order_by(desc(Allocation.created_at)).all()
    return [
        {
            "id": a.id,
            "allocation_id": a.id,  # alias for frontend compat
            "zone_id": a.zone_id,
            "resource_type": a.resource_type,
            "quantity": a.quantity,
            "source_depot": a.source_depot,
            "assigned_agency": a.assigned_agency,
            "status": a.status,
            "reasoning": a.reasoning,
            "requires_human_approval": a.requires_human_approval,
            "timestamp": a.created_at.isoformat() if a.created_at else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in allocations
    ]


@router.post("/allocations/recalculate")
async def recalculate_allocations(
    db: Session = Depends(get_db),
    official: dict = Depends(get_current_official_user)
):
    """
    Trigger Agent B recalculation.
    Assembles all active zones + inventory, runs solver, persists new allocations.
    """
    # 1. Gather all active zones with their latest state
    zones_raw = db.query(Zone).all()
    zones = []
    for zone in zones_raw:
        latest_state = (
            db.query(ZoneState)
            .filter(ZoneState.zone_id == zone.id)
            .order_by(desc(ZoneState.created_at))
            .first()
        )
        if latest_state:
            zones.append({
                "zone_id": zone.id,
                # Enrich with location + disaster_type for OurModel qualitative analysis
                "location": {"name": getattr(zone, 'location', zone.id)},
                "disaster_type": getattr(zone, 'disaster_type', 'other'),
                "severity_score": latest_state.severity_score,
                "priority_tier": latest_state.priority_tier,
                "needs": latest_state.needs or [],
                "population_affected_est": getattr(latest_state, 'population_affected_est', 0) or 0,
                "casualties": getattr(latest_state, 'casualties', 0) or 0,
            })

    # 2. Gather all inventory
    resources = db.query(Resource).all()
    inventory = [
        {
            "resource_type": r.resource_type,
            "quantity_available": r.quantity_available,
            "depot_location": r.depot_location,
            "owning_agency": r.owning_agency,
        }
        for r in resources
    ]

    # 2b. Gather existing active allocations for OurModel duplicate-penalty logic
    existing_allocs_raw = db.query(Allocation).filter(
        Allocation.status.notin_(["Rejected", "Completed"])
    ).all()
    existing_allocations = [
        {"zone_id": a.zone_id, "resource_type": a.resource_type}
        for a in existing_allocs_raw
    ]

    # 3. Run Agent B hybrid pipeline (OurModel + LP solver)
    new_allocations = await solve_allocations(zones, inventory, existing_allocations)

    # 4. Persist new allocations
    created = []
    for alloc in new_allocations:
        record = Allocation(
            id=f"alloc_{uuid.uuid4().hex[:6]}",
            zone_id=alloc["zone_id"],
            resource_type=alloc["resource_type"],
            quantity=alloc["quantity"],
            source_depot=alloc["source_depot"],
            assigned_agency=alloc["assigned_agency"],
            reasoning=alloc.get("reasoning", ""),
            requires_human_approval=alloc.get("requires_human_approval", False),
        )
        db.add(record)
        created.append(alloc)

    # 5. Audit log — include OurModel weight analysis summary
    audit = AuditLog(
        event_type="allocation.recalculated",
        actor="Agent B",
        payload={
            "zones_processed": len(zones),
            "allocations_generated": len(created),
            "solver": "OurModel + PuLP LP",
            "flags_summary": [
                {
                    "zone_id": a["zone_id"],
                    "adjusted_weight": a.get("adjusted_weight"),
                    "flags": a.get("qualitative_flags", []),
                }
                for a in new_allocations
            ],
        }
    )
    db.add(audit)
    db.commit()

    # 6. Publish event for WebSocket broadcast
    await event_bus.publish("allocation.recalculated", {
        "reason": "manual_trigger",
        "allocations_count": len(created),
    })

    return {
        "status": "success",
        "allocations_generated": len(created),
        "allocations": created,
    }


from pydantic import BaseModel
class AllocationStatusUpdate(BaseModel):
    status: str

@router.patch("/allocations/{allocation_id}/status")
async def update_allocation_status(
    allocation_id: str,
    update: AllocationStatusUpdate,
    db: Session = Depends(get_db),
    official: dict = Depends(get_current_official_user)
):
    """Approve or Reject an allocation."""
    alloc = db.query(Allocation).filter(Allocation.id == allocation_id).first()
    if not alloc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Allocation not found")
        
    valid_statuses = ["Approved", "Rejected", "Dispatched"]
    if update.status not in valid_statuses:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid status: {update.status}")
        
    alloc.status = update.status
    
    # Audit log
    audit = AuditLog(
        event_type="allocation.status_updated",
        actor=official["username"],
        payload={
            "allocation_id": alloc.id,
            "new_status": update.status
        }
    )
    db.add(audit)
    
    # If approved, create the agency task tracking record
    if update.status == "Approved":
        task = AgencyTask(
            id=f"task_{uuid.uuid4().hex[:6]}",
            allocation_id=alloc.id,
            agency_id=alloc.assigned_agency,
            status="Pending"
        )
        db.add(task)
        
    db.commit()
    
    return {"status": "success", "allocation_id": alloc.id, "new_status": alloc.status}

