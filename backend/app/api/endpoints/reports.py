from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import ReportCreate
from app.models.models import Zone, ZoneState, AuditLog
from app.agents.agent_a import process_report_with_agent_a
from app.core.event_bus import event_bus
import uuid

router = APIRouter()

@router.post("/reports")
async def submit_report(payload: ReportCreate, db: Session = Depends(get_db)):
    report_id = f"rep_{uuid.uuid4().hex[:6]}"
    
    # 1. Run Agent A on raw text
    parsed = await process_report_with_agent_a(payload.raw_text, report_id)

    # 2. Persist Zone & State
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
        source_refs=parsed["source_refs"]
    )
    db.add(zone_state)

    # 3. Log to Audit
    audit = AuditLog(
        event_type="report.submitted",
        actor=payload.reported_by,
        payload={"zone_id": zone.id, "score": parsed["severity_score"]}
    )
    db.add(audit)
    db.commit()

    # 4. Publish Event
    await event_bus.publish("zone.updated", {"zone_id": zone.id, "severity": parsed["severity_score"]})

    return {"status": "success", "zone_id": zone.id, "state": parsed}