from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

VALID_SOURCE_TYPES = ["FILE", "RTSP"]
VALID_DEPARTMENTS = [
    "Home Department",
    "RTO Department",
    "Municipal Department",
    "Food and Civil Supplies Department",
    "Police Department"
]


class CameraBase(BaseModel):
    camera_name: str
    department: str = "Police Department"
    location_name: str
    latitude: float = 0.0
    longitude: float = 0.0
    source_type: str = "RTSP"
    source_url: str
    status: str = "ACTIVE"

    @field_validator("source_type", mode="before")
    @classmethod
    def validate_source_type(cls, v: str) -> str:
        if not v:
            return "RTSP"
        upper_v = v.strip().upper()
        if upper_v not in VALID_SOURCE_TYPES:
            raise ValueError(f"Invalid source_type '{v}'. Must be one of: {VALID_SOURCE_TYPES}")
        return upper_v

    @field_validator("department", mode="before")
    @classmethod
    def validate_department(cls, v: str) -> str:
        if not v or not v.strip():
            return "Police Department"
        cleaned = v.strip()
        # Case-insensitive match against valid sample departments
        for dept in VALID_DEPARTMENTS:
            if dept.lower() == cleaned.lower():
                return dept
        return cleaned


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    camera_name: Optional[str] = None
    department: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source_type: Optional[str] = None
    source_url: Optional[str] = None
    status: Optional[str] = None


class CameraResponse(CameraBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VideoUploadResponse(BaseModel):
    message: str
    camera: CameraResponse
    file_name: str
    file_path: str
    file_size_mb: float
    is_streamable: bool = True
