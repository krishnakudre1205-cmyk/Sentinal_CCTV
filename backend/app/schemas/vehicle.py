from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class VehicleDetectionBase(BaseModel):
    dna_id: Optional[str] = "DNA-UNINDEXED"
    camera_id: Optional[int] = None
    license_plate: Optional[str] = None
    plate_number: Optional[str] = None
    raw_ocr_text: Optional[str] = None
    plate_confidence: float = 0.0
    vehicle_type: Optional[str] = None
    type_confidence: float = 0.0
    color: Optional[str] = None
    color_confidence: float = 0.0
    visual_embedding: Optional[str] = None
    detection_confidence: float = 0.0
    speed_estimate: Optional[float] = None
    heading_direction: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    snapshot_url: Optional[str] = None
    plate_crop_url: Optional[str] = None


class VehicleDetectionCreate(VehicleDetectionBase):
    pass


class VehicleDetectionResponse(VehicleDetectionBase):
    id: int
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class VehicleSearchResult(BaseModel):
    id: int
    plate_number: str
    raw_ocr_text: Optional[str] = None
    confidence: float
    camera_id: Optional[int] = None
    camera_name: Optional[str] = "Unknown Camera"
    department: Optional[str] = "Surveillance"
    location_name: Optional[str] = "Unknown Location"
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    timestamp: Optional[datetime] = None
    vehicle_type: Optional[str] = "car"
    evidence_frame: Optional[str] = None
    plate_crop_url: Optional[str] = None
    vehicle_detection_id: Optional[str] = None

    class Config:
        from_attributes = True


class VehicleDNAVector(BaseModel):
    plate_number: Optional[str] = ""
    plate_confidence: float = 0.0
    vehicle_type: str = "car"
    color: str = "unknown"
    visual_embedding: List[float] = []
    camera_id: int = 1
    timestamp: Optional[str] = None
    latitude: float = 0.0
    longitude: float = 0.0
    detection_confidence: float = 0.90


class DNACompareRequest(BaseModel):
    dna1: VehicleDNAVector
    dna2: VehicleDNAVector
    weights: Optional[Dict[str, float]] = None


class DNACompareResponse(BaseModel):
    match_confidence_pct: float
    overall_match_percentage: str
    is_same_vehicle: bool
    component_breakdown: Dict[str, float]
    configured_weights: Dict[str, float]
    recommendation: str


class VehicleIdentityResponse(BaseModel):
    id: int
    identity_id: str
    plate_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    color: Optional[str] = None
    total_sightings: int = 1
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    last_camera_id: Optional[int] = None
    last_latitude: Optional[float] = None
    last_longitude: Optional[float] = None

    class Config:
        from_attributes = True


class VehicleDNABase(BaseModel):
    dna_id: str
    primary_plate: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_color: Optional[str] = None
    total_sightings: int = 1
    last_camera_id: Optional[int] = None
    last_latitude: Optional[float] = None
    last_longitude: Optional[float] = None
    is_flagged: int = 0


class VehicleDNAResponse(VehicleDNABase):
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    recent_sightings: Optional[List[VehicleDetectionResponse]] = []

    class Config:
        from_attributes = True


class EvidenceImages(BaseModel):
    snapshot_url: Optional[str] = None
    plate_crop_url: Optional[str] = None


class JourneyNodeResponse(BaseModel):
    sequence_index: int
    camera_id: int
    camera_name: str
    department: Optional[str] = "Surveillance"
    location_name: str
    latitude: float
    longitude: float
    timestamp: str
    timestamp_iso: Optional[str] = None
    match_confidence: float
    match_confidence_pct: str
    match_level: str
    badge_variant: str
    vehicle_type: str
    color: str
    plate_number: str
    evidence_images: EvidenceImages
    time_delta_mins: float = 0.0
    distance_km: float = 0.0
    speed_kmh: float = 0.0
    component_breakdown: Optional[Dict[str, float]] = None


class MatchSummary(BaseModel):
    confirmed_matches: int = 0
    high_confidence_matches: int = 0
    possible_matches: int = 0


class VehicleJourneyResponse(BaseModel):
    identity_id: str
    plate_number: str
    vehicle_type: str
    color: str
    total_camera_stops: int
    match_summary: MatchSummary
    timeline: List[JourneyNodeResponse]
