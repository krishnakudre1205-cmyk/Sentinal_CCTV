from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class VehicleIdentity(Base):
    """
    Represents persistent Vehicle DNA Identity correlates multi-camera vehicle sightings.
    Stores complete multi-signal DNA representation, primary plate, vehicle classification,
    dominant color, and 128-dim visual embedding reference.
    """
    __tablename__ = "vehicle_identity"

    id = Column(Integer, primary_key=True, index=True)
    identity_id = Column(String(100), unique=True, index=True, nullable=False)  # e.g., VDNA-9A1F2C84
    vehicle_dna = Column(Text, nullable=False)  # JSON string of complete 9-field DNA vector
    plate_number = Column(String(50), index=True, nullable=True)
    vehicle_type = Column(String(50), nullable=True)  # car, bus, truck, motorcycle
    color = Column(String(50), nullable=True)  # white, black, red, silver, blue, etc.
    visual_embedding_reference = Column(Text, nullable=True)  # JSON array of 128-dim vector
    
    # Sighting Metrics
    total_sightings = Column(Integer, default=1)
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Last Known Camera & Geo Telemetry
    last_camera_id = Column(Integer, nullable=True)
    last_latitude = Column(Float, nullable=True)
    last_longitude = Column(Float, nullable=True)
