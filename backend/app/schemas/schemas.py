from pydantic import BaseModel
from typing import List, Optional, Any

class ReportCreate(BaseModel):
    raw_text: str
    reported_by: Optional[str] = "Field Reporter"

class InventoryCreate(BaseModel):
    resource_type: str
    quantity_available: int
    depot_location: str
    owning_agency: str

class TaskStatusUpdate(BaseModel):
    status: str