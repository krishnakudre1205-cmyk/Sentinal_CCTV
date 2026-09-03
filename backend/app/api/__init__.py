from fastapi import APIRouter
from app.api.cameras import router as cameras_router
from app.api.vehicles import router as vehicles_router
from app.api.watchlist import router as watchlist_router
from app.api.alerts import router as alerts_router
from app.api.detection import router as detection_router

api_router = APIRouter(prefix="/api")

api_router.include_router(cameras_router)
api_router.include_router(detection_router)
api_router.include_router(vehicles_router)
api_router.include_router(watchlist_router)
api_router.include_router(alerts_router)

__all__ = ["api_router"]
