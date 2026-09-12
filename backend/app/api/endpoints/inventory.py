from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import InventoryUpdate
from app.models.models import Resource, AuditLog
from app.core.event_bus import event_bus
from app.core.auth import get_current_official_user

router = APIRouter()


@router.get("/inventory")
def list_inventory(
    db: Session = Depends(get_db),
    official: dict = Depends(get_current_official_user)
):
    """List all resource inventory items."""
    resources = db.query(Resource).all()
    return [
        {
            "id": r.id,
            "resource_type": r.resource_type,
            "quantity_available": r.quantity_available,
            "depot_location": r.depot_location,
            "owning_agency": r.owning_agency,
        }
        for r in resources
    ]


@router.patch("/inventory/{resource_id}")
async def update_inventory(
    resource_id: str,
    updates: InventoryUpdate,
    db: Session = Depends(get_db),
    official: dict = Depends(get_current_official_user)
):
    """Update a resource's stock. Publishes inventory.changed event."""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if updates.quantity_available is not None:
        resource.quantity_available = updates.quantity_available
    if updates.depot_location is not None:
        resource.depot_location = updates.depot_location
    if updates.owning_agency is not None:
        resource.owning_agency = updates.owning_agency

    # Audit log
    audit = AuditLog(
        event_type="inventory.changed",
        actor=official["username"],
        payload={
            "resource_id": resource.id,
            "resource_type": resource.resource_type,
            "new_quantity": resource.quantity_available,
        }
    )
    db.add(audit)
    db.commit()

    # Publish event to trigger Agent B recalculation
    await event_bus.publish("inventory.changed", {
        "resource_id": resource.id,
        "resource_type": resource.resource_type,
        "quantity": resource.quantity_available,
    })

    return {
        "id": resource.id,
        "resource_type": resource.resource_type,
        "quantity_available": resource.quantity_available,
        "depot_location": resource.depot_location,
        "owning_agency": resource.owning_agency,
    }
