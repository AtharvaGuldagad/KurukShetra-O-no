from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.schemas.schemas import ReportCreate
from app.models.models import Zone, ZoneState, Resource, Allocation, AuditLog
from app.agents.agent_a import process_report_with_agent_a
from app.agents.agent_b import solve_allocations
from app.core.event_bus import event_bus
import uuid

router = APIRouter()

@router.post("/reports")
async def submit_report(payload: ReportCreate, db: Session = Depends(get_db)):
    report_id = f"rep_{uuid.uuid4().hex[:6]}"
    
    # ── Phase 1: Agent A — Ingestion & Prioritization ─────────────────────
    parsed = await process_report_with_agent_a(payload.raw_text, report_id)

    # Persist Zone & full ZoneState (all extracted fields)
    zone = Zone(location=parsed["location"], disaster_type=parsed["disaster_type"])
    db.add(zone)
    db.commit()
    db.refresh(zone)

    zone_state = ZoneState(
        zone_id=zone.id,
        severity_score=parsed["severity_score"],
        priority_tier=parsed["priority_tier"],
        needs=parsed["needs"],
        source_confidence=parsed["source_confidence"],
        source_refs=parsed["source_refs"],
        population_affected_est=parsed.get("population_affected_est", 0),
        casualties=parsed.get("casualties", 0),
        deterioration_delta=0.0,  # first report for this zone — no delta yet
    )
    db.add(zone_state)

    # Audit: report ingestion
    audit_report = AuditLog(
        event_type="report.submitted",
        actor=payload.reported_by,
        payload={
            "zone_id": zone.id,
            "score": parsed["severity_score"],
            "priority_tier": parsed["priority_tier"],
            "summary": f"Report ingested — zone {zone.id} scored {parsed['severity_score']}/100 ({parsed['priority_tier']})",
        }
    )
    db.add(audit_report)
    db.commit()

    # Publish zone update for WebSocket broadcast
    await event_bus.publish("zone.updated", {
        "zone_id": zone.id,
        "severity": parsed["severity_score"],
        "priority_tier": parsed["priority_tier"],
    })

    # ── Phase 2: Agent B — Automatic Resource Allocation ──────────────────
    # Gather ALL active zones with their latest state for the solver
    all_zones_raw = db.query(Zone).all()
    solver_zones = []
    for z in all_zones_raw:
        latest_state = (
            db.query(ZoneState)
            .filter(ZoneState.zone_id == z.id)
            .order_by(desc(ZoneState.created_at))
            .first()
        )
        if latest_state:
            loc = z.location if isinstance(z.location, dict) else {"name": z.id}
            solver_zones.append({
                "zone_id": z.id,
                "location": loc,
                "disaster_type": z.disaster_type or "other",
                "severity_score": latest_state.severity_score,
                "priority_tier": latest_state.priority_tier,
                "needs": latest_state.needs or [],
                "population_affected_est": latest_state.population_affected_est or 0,
                "casualties": latest_state.casualties or 0,
                "deterioration_delta": latest_state.deterioration_delta or 0.0,
            })

    # Gather all inventory
    resources = db.query(Resource).all()
    solver_inventory = [
        {
            "resource_type": r.resource_type,
            "quantity_available": r.quantity_available,
            "depot_location": r.depot_location,
            "owning_agency": r.owning_agency,
        }
        for r in resources
    ]

    # Gather existing active allocations (for OurModel duplicate-penalty)
    existing_allocs_raw = db.query(Allocation).filter(
        Allocation.status.notin_(["Rejected", "Completed"])
    ).all()
    existing_allocations = [
        {"zone_id": a.zone_id, "resource_type": a.resource_type}
        for a in existing_allocs_raw
    ]

    # Run Agent B hybrid pipeline: OurModel qualitative → greedy solver → justifications
    new_allocations = []
    if solver_zones and solver_inventory:
        new_allocations = await solve_allocations(
            solver_zones, solver_inventory, existing_allocations
        )

        # Persist allocations
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

        # Audit: allocation run
        audit_alloc = AuditLog(
            event_type="allocation.recalculated",
            actor="Agent B",
            payload={
                "trigger": "report_ingestion",
                "triggered_by_zone": zone.id,
                "zones_processed": len(solver_zones),
                "allocations_generated": len(new_allocations),
                "solver": "OurModel + Greedy Solver",
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
        db.add(audit_alloc)
        db.commit()

        # Publish allocation event for WebSocket broadcast
        await event_bus.publish("allocation.recalculated", {
            "reason": "report_ingestion",
            "triggered_by_zone": zone.id,
            "allocations_count": len(new_allocations),
        })

    print(f"✅ [Pipeline] Report {report_id} → Zone {zone.id} → {len(new_allocations)} allocations generated")

    return {
        "status": "success",
        "zone_id": zone.id,
        "state": parsed,
        "allocations_generated": len(new_allocations),
        "allocations": [
            {
                "zone_id": a["zone_id"],
                "resource_type": a["resource_type"],
                "quantity": a["quantity"],
                "assigned_agency": a["assigned_agency"],
                "reasoning": a.get("reasoning", ""),
            }
            for a in new_allocations
        ],
    }