from app.schemas.camera import CameraBase, CameraCreate, CameraResponse
from app.schemas.vehicle import (
    VehicleDetectionBase,
    VehicleDetectionCreate,
    VehicleDetectionResponse,
    VehicleDNABase,
    VehicleDNAResponse,
)
from app.schemas.watchlist import WatchlistBase, WatchlistCreate, WatchlistResponse
from app.schemas.alert import AlertBase, AlertCreate, AlertResponse

__all__ = [
    "CameraBase",
    "CameraCreate",
    "CameraResponse",
    "VehicleDetectionBase",
    "VehicleDetectionCreate",
    "VehicleDetectionResponse",
    "VehicleDNABase",
    "VehicleDNAResponse",
    "WatchlistBase",
    "WatchlistCreate",
    "WatchlistResponse",
    "AlertBase",
    "AlertCreate",
    "AlertResponse",
]
