from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class WatchlistItem(Base):
    """
    Target vehicles and suspects monitored by law enforcement command center.
    Contains fields: plate_number, vehicle_description, reason, priority (CRITICAL/HIGH/MEDIUM), status.
    """
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    target_name = Column(String(150), nullable=False, default="Wanted Target Vehicle")
    plate_number = Column(String(50), index=True, nullable=True)
    license_plate = Column(String(50), index=True, nullable=True)
    vehicle_description = Column(String(200), nullable=True)
    vehicle_type = Column(String(50), nullable=True)
    vehicle_color = Column(String(50), nullable=True)
    reason = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, default="Stolen Vehicle")
    priority = Column(String(50), default="HIGH")  # CRITICAL, HIGH, MEDIUM
    severity = Column(String(50), default="HIGH")
    status = Column(String(50), default="ACTIVE")
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
