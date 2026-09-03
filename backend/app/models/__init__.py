from app.models.camera import Camera
from app.models.vehicle import VehicleDetection, VehicleDNAProfile
from app.models.vehicle_identity import VehicleIdentity
from app.models.watchlist import WatchlistItem
from app.models.alert import Alert
from app.models.detection import DetectionEvent, DetectionJob

__all__ = [
    "Camera",
    "VehicleDetection",
    "VehicleDNAProfile",
    "VehicleIdentity",
    "WatchlistItem",
    "Alert",
    "DetectionEvent",
    "DetectionJob",
]
