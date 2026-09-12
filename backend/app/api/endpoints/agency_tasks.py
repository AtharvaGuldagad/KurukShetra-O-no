from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import TaskStatusUpdate
from app.models.models import AgencyTask, AuditLog, Allocation
from app.core.event_bus import event_bus
from app.core.auth import get_current_official_user

router = APIRouter()


@router.get("/agency-tasks")
def list_agency_tasks(
    db: Session = Depends(get_db),
    official: dict = Depends(get_current_official_user)
):
    """List all agency task assignments."""
    tasks = db.query(AgencyTask).all()
    return [
        {
            "id": t.id,
            "allocation_id": t.allocation_id,
            "agency_id": t.agency_id,
            "status": t.status,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        }
        for t in tasks
    ]


@router.patch("/agency-tasks/{task_id}/status")
async def update_task_status(
    task_id: str,
    update: TaskStatusUpdate,
    db: Session = Depends(get_db),
    official: dict = Depends(get_current_official_user)
):
    """Update an agency task status (Pending → Accepted → In-Progress → Completed)."""
    task = db.query(AgencyTask).filter(AgencyTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    valid_statuses = ["Pending", "Accepted", "In-Progress", "Completed"]
    if update.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )

    # Map frontend formats to backend capitalized format
    status_map = {
        "pending": "Pending",
        "accepted": "Accepted",
        "in_progress": "In-Progress",
        "in-progress": "In-Progress",
        "completed": "Completed"
    }
    
    frontend_status = update.status.lower()
    if frontend_status in status_map:
        new_status = status_map[frontend_status]
    else:
        # assume they passed the capitalized version if they are using the API directly
        new_status = update.status 

    old_status = task.status
    task.status = new_status

    # Audit log
    audit = AuditLog(
        event_type="agency.status_changed",
        actor=official["username"],
        payload={
            "task_id": task.id,
            "old_status": old_status,
            "new_status": update.status,
        }
    )
    db.add(audit)
    db.commit()

    # Publish event for WebSocket
    await event_bus.publish("agency.status_changed", {
        "task_id": task.id,
        "agency_id": task.agency_id,
        "status": update.status,
    })

    return {
        "id": task.id,
        "allocation_id": task.allocation_id,
        "agency_id": task.agency_id,
        "status": task.status,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }
