import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Zone(Base):
    __tablename__ = "zones"
    id = Column(String, primary_key=True, default=lambda: f"zone_{uuid.uuid4().hex[:6]}")
    location = Column(JSON, nullable=False)  # {"lat": float, "lng": float, "name": str}
    disaster_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ZoneState(Base):
    __tablename__ = "zone_states"
    id = Column(Integer, primary_key=True, autoincrement=True)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False)
    severity_score = Column(Integer, nullable=False)
    priority_tier = Column(String, nullable=False)
    needs = Column(JSON, nullable=False)      # [{"type": "medical", "urgency": "critical"}]
    source_confidence = Column(Float, default=1.0)
    source_refs = Column(JSON, default=list)  # ["news_url", "report_id"]
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class Resource(Base):
    __tablename__ = "resources"
    id = Column(String, primary_key=True, default=lambda: f"res_{uuid.uuid4().hex[:6]}")
    resource_type = Column(String, nullable=False)
    quantity_available = Column(Integer, default=0)
    depot_location = Column(String, nullable=False)
    owning_agency = Column(String, nullable=False)

class Allocation(Base):
    __tablename__ = "allocations"
    id = Column(String, primary_key=True, default=lambda: f"alloc_{uuid.uuid4().hex[:6]}")
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False)
    resource_type = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    source_depot = Column(String, nullable=False)
    assigned_agency = Column(String, nullable=False)
    status = Column(String, default="Proposed")  # Proposed, Approved, Dispatched
    reasoning = Column(String, nullable=True)
    requires_human_approval = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AgencyTask(Base):
    __tablename__ = "agency_tasks"
    id = Column(String, primary_key=True, default=lambda: f"task_{uuid.uuid4().hex[:6]}")
    allocation_id = Column(String, ForeignKey("allocations.id"), nullable=False)
    agency_id = Column(String, nullable=False)
    status = Column(String, default="Pending")   # Pending, Accepted, In-Progress, Completed
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String, nullable=False)
    actor = Column(String, default="SYSTEM")
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)