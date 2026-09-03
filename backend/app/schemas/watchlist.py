from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WatchlistBase(BaseModel):
    target_name: Optional[str] = "Wanted Target Vehicle"
    plate_number: Optional[str] = None
    license_plate: Optional[str] = None
    vehicle_description: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_color: Optional[str] = None
    reason: Optional[str] = None
    category: Optional[str] = "Stolen Vehicle"
    priority: str = "HIGH"  # CRITICAL, HIGH, MEDIUM
    severity: Optional[str] = "HIGH"
    status: str = "ACTIVE"
    notes: Optional[str] = None
    is_active: bool = True


class WatchlistCreate(WatchlistBase):
    pass


class WatchlistResponse(WatchlistBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
