from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.models import Zone, ZoneState

router = APIRouter()


@router.get("/zones")
def list_zones(db: Session = Depends(get_db)):
    """List all zones with their latest state, sorted by severity descending."""
    zones = db.query(Zone).all()

    results = []
    for zone in zones:
        # Get the latest state for this zone
        latest_state = (
            db.query(ZoneState)
            .filter(ZoneState.zone_id == zone.id)
            .order_by(desc(ZoneState.created_at))
            .first()
        )

        zone_data = {
            "zone_id": zone.id,
            "location": zone.location,
            "disaster_type": zone.disaster_type,
            "created_at": zone.created_at.isoformat() if zone.created_at else None,
            "severity_score": latest_state.severity_score if latest_state else 0,
            "priority_tier": latest_state.priority_tier if latest_state else "Low",
            "needs": latest_state.needs if latest_state else [],
            "source_confidence": latest_state.source_confidence if latest_state else 0.0,
            "source_refs": latest_state.source_refs if latest_state else [],
            "population_affected_est": latest_state.population_affected_est if latest_state else 0,
            "casualties": latest_state.casualties if latest_state else 0,
            "deterioration_delta": latest_state.deterioration_delta if latest_state else 0.0,
        }
        results.append(zone_data)

    # Sort by severity descending
    results.sort(key=lambda z: z["severity_score"], reverse=True)
    return results


@router.get("/zones/{zone_id}/history")
def get_zone_history(zone_id: str, db: Session = Depends(get_db)):
    """Get version history for a specific zone."""
    states = (
        db.query(ZoneState)
        .filter(ZoneState.zone_id == zone_id)
        .order_by(desc(ZoneState.created_at))
        .all()
    )

    return [
        {
            "id": s.id,
            "severity_score": s.severity_score,
            "priority_tier": s.priority_tier,
            "needs": s.needs,
            "source_confidence": s.source_confidence,
            "version": s.version,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in states
    ]
