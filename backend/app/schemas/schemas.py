from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime


# ─── Request Schemas ──────────────────────────────────────────────────────────

class ReportCreate(BaseModel):
    raw_text: str
    reported_by: Optional[str] = "Field Reporter"

class InventoryCreate(BaseModel):
    resource_type: str
    quantity_available: int
    depot_location: str
    owning_agency: str

class InventoryUpdate(BaseModel):
    quantity_available: Optional[int] = None
    depot_location: Optional[str] = None
    owning_agency: Optional[str] = None

class TaskStatusUpdate(BaseModel):
    status: str  # Pending, Accepted, In-Progress, Completed


# ─── Response Schemas ─────────────────────────────────────────────────────────

class LocationOut(BaseModel):
    lat: float
    lng: float
    name: str

class NeedOut(BaseModel):
    type: str
    urgency: str

class ZoneOut(BaseModel):
    zone_id: str
    location: Any  # JSON dict
    disaster_type: str
    created_at: Optional[str] = None
    # Latest state fields
    severity_score: Optional[int] = None
    priority_tier: Optional[str] = None
    needs: Optional[List[Any]] = None
    source_confidence: Optional[float] = None
    source_refs: Optional[List[str]] = None
    population_affected_est: Optional[int] = None
    casualties: Optional[int] = None
    deterioration_delta: Optional[str] = None

class ZoneStateHistoryOut(BaseModel):
    id: int
    severity_score: int
    priority_tier: str
    needs: Any
    source_confidence: Optional[float] = None
    version: int
    created_at: Optional[str] = None

class ResourceOut(BaseModel):
    id: str
    resource_type: str
    quantity_available: int
    depot_location: str
    owning_agency: str

class AllocationOut(BaseModel):
    id: str
    zone_id: str
    resource_type: str
    quantity: int
    source_depot: str
    assigned_agency: str
    status: str
    reasoning: Optional[str] = None
    requires_human_approval: bool
    created_at: Optional[str] = None

class AgencyTaskOut(BaseModel):
    id: str
    allocation_id: str
    agency_id: str
    status: str
    updated_at: Optional[str] = None

class AuditLogOut(BaseModel):
    id: int
    event_type: str
    actor: str
    payload: Any
    created_at: Optional[str] = None


# ─── Filter Schemas ───────────────────────────────────────────────────────────

class AuditFilter(BaseModel):
    event_type: Optional[str] = None
    actor: Optional[str] = None
    search: Optional[str] = None