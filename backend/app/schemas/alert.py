from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AlertBase(BaseModel):
    alert_id: Optional[str] = None
    title: str
    alert_type: str = "WATCHLIST_MATCH"
    priority: str = "HIGH"  # CRITICAL, HIGH, MEDIUM
    severity: str = "HIGH"
    message: str
    vehicle: Optional[str] = None
    plate: Optional[str] = None
    license_plate: Optional[str] = None
    camera_id: Optional[int] = None
    camera_name: Optional[str] = None
    camera: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence: float = 0.90
    evidence_image: Optional[str] = None
    snapshot_url: Optional[str] = None
    plate_crop_url: Optional[str] = None
    dna_id: Optional[str] = None
    is_acknowledged: bool = False
    acknowledged_by: Optional[str] = None


class AlertCreate(AlertBase):
    pass


class AlertResponse(AlertBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
