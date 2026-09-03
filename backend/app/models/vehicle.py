from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.database import Base


class VehicleDetection(Base):
    """
    Represents an individual vehicle sighting event & ANPR plate recognition log.
    """
    __tablename__ = "vehicle_detections"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_detection_id = Column(String(100), index=True, nullable=True)  # Link to DetectionEvent ID
    dna_id = Column(String(100), index=True, nullable=True)  # Correlated Vehicle DNA ID
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True, index=True)
    
    # ANPR Specific Fields
    plate_number = Column(String(50), index=True, nullable=True)  # Cleaned / Normalized License Plate
    raw_ocr_text = Column(String(100), nullable=True)  # Uncleaned raw OCR output
    plate_confidence = Column(Float, default=0.0)  # ANPR / Plate recognition confidence score
    
    # Vehicle Classification & Physical Signals
    vehicle_type = Column(String(50), nullable=True)  # car, truck, motorcycle, bus
    type_confidence = Column(Float, default=0.0)
    color = Column(String(50), nullable=True)
    color_confidence = Column(Float, default=0.0)
    visual_embedding = Column(Text, nullable=True)
    detection_confidence = Column(Float, default=0.0)
    
    # Telemetry & Evidence Paths
    speed_estimate = Column(Float, nullable=True)
    heading_direction = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    snapshot_url = Column(String(500), nullable=True)  # Vehicle ROI image snapshot
    plate_crop_url = Column(String(500), nullable=True)  # License plate crop image
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class VehicleDNAProfile(Base):
    """
    Represents persistent Vehicle DNA profile correlating multi-camera sightings.
    """
    __tablename__ = "vehicle_dna_profiles"

    dna_id = Column(String(100), primary_key=True, index=True)
    primary_plate = Column(String(50), index=True, nullable=True)
    vehicle_type = Column(String(50), nullable=True)
    vehicle_color = Column(String(50), nullable=True)
    total_sightings = Column(Integer, default=1)
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_camera_id = Column(Integer, nullable=True)
    last_latitude = Column(Float, nullable=True)
    last_longitude = Column(Float, nullable=True)
    is_flagged = Column(Integer, default=0)
