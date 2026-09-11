from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models

# table creation
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Disaster Relief Emergency Coordinator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "online"}

@app.get("/zones")
def get_zones(db: Session = Depends(get_db)):
    zones = db.query(models.Zone).all()
    result = []
    for zone in zones:
        latest_state = (
            db.query(models.ZoneState)
            .filter(models.ZoneState.zone_id == zone.id)
            .order_by(models.ZoneState.version.desc())
            .first()
        )
        result.append({
            "id": zone.id,
            "location": zone.location,
            "disaster_type": zone.disaster_type,
            "created_at": zone.created_at,
            "latest_state": latest_state
        })
    return result

@app.get("/inventory")
def get_inventory(db: Session = Depends(get_db)):
    return db.query(models.Resource).all()

@app.get("/allocations")
def get_allocations(db: Session = Depends(get_db)):
    return db.query(models.Allocation).all()

@app.get("/audit-log")
def get_audit_log(db: Session = Depends(get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).all()