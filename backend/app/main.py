import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.config import settings
from app.api import api_router
from app.database import init_db

# Ensure uploads directory exists
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown events.
    Initializes database tables on startup.
    """
    try:
        init_db()
    except Exception as e:
        print(f"[Warning] Database initialization deferred: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Unified CCTV Intelligence and Vehicle Tracking Platform - Module 1 Camera Registry & Video Ingestion",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development & local command center
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory for static video playback
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include API Routers
app.include_router(api_router)


from fastapi import WebSocket, WebSocketDisconnect
from app.services.websocket_manager import alert_ws_manager


@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    Module 6: Real-time WebSocket live alert stream.
    Broadcasting instantaneous Watchlist Hits to Police Command Dashboards.
    """
    await alert_ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        alert_ws_manager.disconnect(websocket)
    except Exception:
        alert_ws_manager.disconnect(websocket)


@app.get("/health", tags=["System Health"])
def health_check():
    """
    System Health Status Endpoint.
    Returns status code 200 and operational health metadata.
    """
    return {
        "status": "online",
        "project": "SentinelFusion AI",
        "module": "Module 6 - Watchlist and Real-Time Alert Engine Active"
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to SentinelFusion AI Backend API",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": "/health"
    }
