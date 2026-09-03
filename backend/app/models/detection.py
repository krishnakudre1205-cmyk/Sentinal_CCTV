from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.database import Base


class DetectionEvent(Base):
    """
    Individual object detection record captured by YOLO AI engine.
    """
    __tablename__ = "detection_events"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(String(100), index=True, nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False, index=True)
    object_type = Column(String(50), nullable=False, index=True)  # car, motorcycle, bus, truck, person
    confidence = Column(Float, nullable=False, default=0.0)
    bounding_box = Column(Text, nullable=False)  # JSON string: {"x1": int, "y1": int, "x2": int, "y2": int}
    frame_number = Column(Integer, default=0)
    video_timestamp_secs = Column(Float, default=0.0)
    snapshot_url = Column(String(500), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class DetectionJob(Base):
    """
    Aggregated processing metadata and summary metrics for a camera's video detection run.
    """
    __tablename__ = "detection_jobs"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), unique=True, nullable=False, index=True)
    status = Column(String(50), default="IDLE")  # IDLE, PROCESSING, COMPLETED, FAILED
    total_frames_processed = Column(Integer, default=0)
    processing_time_secs = Column(Float, default=0.0)
    fps_speed = Column(Float, default=0.0)
    
    # Class-wise object counts
    car_count = Column(Integer, default=0)
    motorcycle_count = Column(Integer, default=0)
    bus_count = Column(Integer, default=0)
    truck_count = Column(Integer, default=0)
    person_count = Column(Integer, default=0)
    total_detections = Column(Integer, default=0)
    
    annotated_video_url = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
