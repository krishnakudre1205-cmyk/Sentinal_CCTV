from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    camera_name = Column(String(150), nullable=False)
    department = Column(String(100), nullable=False, default="Police Department")
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False, default=0.0)
    longitude = Column(Float, nullable=False, default=0.0)
    source_type = Column(String(50), nullable=False, default="RTSP")  # "FILE" or "RTSP"
    source_url = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False, default="ACTIVE")  # "ACTIVE", "INACTIVE", "OFFLINE"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
