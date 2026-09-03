from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime


class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    width: Optional[int] = None
    height: Optional[int] = None


class DetectionEventResponse(BaseModel):
    id: int
    detection_id: str
    camera_id: int
    object_type: str
    confidence: float
    bounding_box: Union[Dict[str, Any], str]
    frame_number: int = 0
    video_timestamp_secs: float = 0.0
    snapshot_url: Optional[str] = None
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class DetectionStartResponse(BaseModel):
    message: str
    camera_id: int
    camera_name: str
    status: str
    source_url: str


class DetectionSummaryResponse(BaseModel):
    camera_id: int
    camera_name: str
    status: str
    total_frames_processed: int = 0
    processing_time_secs: float = 0.0
    fps_speed: float = 0.0
    car_count: int = 0
    motorcycle_count: int = 0
    bus_count: int = 0
    truck_count: int = 0
    person_count: int = 0
    total_vehicles: int = 0
    total_detections: int = 0
    annotated_video_url: Optional[str] = None
    detections: List[DetectionEventResponse] = []
    updated_at: Optional[datetime] = None
