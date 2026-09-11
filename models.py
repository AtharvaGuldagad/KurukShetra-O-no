import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Zone(Base):
    __tablename__ = "zones"

    id = Column(String, primary_key=True, default=generate_uuid)
    location = Column(JSON, nullable=False)  # {"lat": float, "lng": float, "name": str}
    disaster_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    states = relationship("ZoneState", back_populates="zone", cascade="all, delete-orphan")
    allocations = relationship("Allocation", back_populates="zone")


class ZoneState(Base):
    __tablename__ = "zone_states"

    id = Column(String, primary_key=True, default=generate_uuid)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False)
    severity_score = Column(Integer, nullable=False)
    priority_tier = Column(String, nullable=False)
    needs = Column(JSON, nullable=False)  # [{"type": str, "urgency": str}]
    source_confidence = Column(Float, default=1.0)
    source_refs = Column(JSON, default=list)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("Zone", back_populates="states")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True, default=generate_uuid)
    resource_type = Column(String, nullable=False)
    quantity_available = Column(Integer, nullable=False)
    depot_location = Column(String, nullable=False)
    owning_agency = Column(String, nullable=False)


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(String, primary_key=True, default=generate_uuid)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False)
    resource_type = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    source_depot = Column(String, nullable=False)
    assigned_agency = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, approved, dispatched, completed
    reasoning = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("Zone", back_populates="allocations")
    tasks = relationship("AgencyTask", back_populates="allocation")


class AgencyTask(Base):
    __tablename__ = "agency_tasks"

    id = Column(String, primary_key=True, default=generate_uuid)
    allocation_id = Column(String, ForeignKey("allocations.id"), nullable=False)
    agency_id = Column(String, nullable=False)
    status = Column(String, default="assigned")  # assigned, in_progress, completed
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    allocation = relationship("Allocation", back_populates="tasks")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String, primary_key=True, default=generate_uuid)
    event_type = Column(String, nullable=False)
    actor = Column(String, nullable=False)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)