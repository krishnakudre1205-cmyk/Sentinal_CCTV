import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.camera import CameraResponse, CameraCreate, VideoUploadResponse
from app.models.camera import Camera
from app.services.camera_adapter import CameraAdapterFactory

router = APIRouter(prefix="/cameras", tags=["Cameras"])

# Upload directory configuration
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Default sample seed cameras for demonstration across government departments
SAMPLE_SEED_CAMERAS = [
    {
        "camera_name": "Sector 4 North Toll Plaza Cam-01",
        "department": "Police Department",
        "location_name": "Sector 4 North Toll Plaza, Outer Ring",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "source_type": "RTSP",
        "source_url": "rtsp://127.0.0.1:8554/live/north_toll",
        "status": "ACTIVE",
    },
    {
        "camera_name": "RTO High-Speed Expressway Checkpoint",
        "department": "RTO Department",
        "location_name": "National Highway NH-48 Km Marker 24",
        "latitude": 28.6289,
        "longitude": 77.2065,
        "source_type": "RTSP",
        "source_url": "rtsp://127.0.0.1:8554/live/rto_checkpoint",
        "status": "ACTIVE",
    },
    {
        "camera_name": "Central Municipal Market Square Feed",
        "department": "Municipal Department",
        "location_name": "Main Market Circle, Municipal Ward 7",
        "latitude": 28.6353,
        "longitude": 77.2250,
        "source_type": "FILE",
        "source_url": "/uploads/sample_market_cctv.mp4",
        "status": "ACTIVE",
    },
    {
        "camera_name": "State Food Supply Godown Gate-2",
        "department": "Food and Civil Supplies Department",
        "location_name": "Central Grain Storage Warehouse Complex",
        "latitude": 28.6012,
        "longitude": 77.2341,
        "source_type": "FILE",
        "source_url": "/uploads/food_supply_depot.mp4",
        "status": "INACTIVE",
    },
    {
        "camera_name": "Home Department High-Security Perimeter",
        "department": "Home Department",
        "location_name": "Secretariat Security Zone Alpha",
        "latitude": 28.6180,
        "longitude": 77.2140,
        "source_type": "RTSP",
        "source_url": "rtsp://127.0.0.1:8554/live/home_dept_alpha",
        "status": "ACTIVE",
    },
]


def seed_sample_cameras_if_empty(db: Session):
    """Seed initial sample government department cameras if table is empty."""
    try:
        count = db.query(Camera).count()
        if count == 0:
            for seed in SAMPLE_SEED_CAMERAS:
                cam = Camera(**seed)
                db.add(cam)
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Info] Seed cameras deferral: {e}")


@router.get("/", response_model=List[CameraResponse])
def list_cameras(
    department: Optional[str] = None,
    source_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve all registered CCTV cameras with optional filtering by department, source_type, or status.
    """
    seed_sample_cameras_if_empty(db)
    query = db.query(Camera)

    if department:
        query = query.filter(Camera.department.ilike(f"%{department}%"))
    if source_type:
        query = query.filter(Camera.source_type == source_type.upper())
    if status_filter:
        query = query.filter(Camera.status == status_filter.upper())

    return query.order_by(Camera.id.desc()).all()


@router.get("/{camera_id}", response_model=CameraResponse)
def get_camera(camera_id: int, db: Session = Depends(get_db)):
    """
    Retrieve specific camera details by ID.
    """
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with ID {camera_id} not found"
        )
    return camera


@router.post("/", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
def register_camera(payload: CameraCreate, db: Session = Depends(get_db)):
    """
    Register a new CCTV camera source (RTSP stream or Video File).
    Validates source through the CameraAdapterFactory.
    """
    # 1. Validate source using Camera Adapter
    try:
        adapter = CameraAdapterFactory.get_adapter(
            source_type=payload.source_type,
            camera_id=0,
            source_url=payload.source_url,
            camera_name=payload.camera_name
        )
        is_valid, msg = adapter.validate_source()
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Camera source validation failed: {msg}"
            )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )

    # 2. Persist to Database
    new_camera = Camera(
        camera_name=payload.camera_name,
        department=payload.department,
        location_name=payload.location_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        source_type=payload.source_type.upper(),
        source_url=payload.source_url,
        status=payload.status.upper()
    )

    try:
        db.add(new_camera)
        db.commit()
        db.refresh(new_camera)
        return new_camera
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register camera in database: {str(e)}"
        )


@router.delete("/{camera_id}", status_code=status.HTTP_200_OK)
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    """
    Delete a camera registration by ID.
    """
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with ID {camera_id} not found"
        )

    # If it was an uploaded file in uploads dir, optionally remove file
    if camera.source_type == "FILE" and camera.source_url.startswith("/uploads/"):
        file_name = os.path.basename(camera.source_url)
        local_file = os.path.join(UPLOAD_DIR, file_name)
        if os.path.exists(local_file):
            try:
                os.remove(local_file)
            except Exception:
                pass

    try:
        db.delete(camera)
        db.commit()
        return {"success": True, "message": f"Camera '{camera.camera_name}' (ID: {camera_id}) removed successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete camera: {str(e)}"
        )


@router.post("/upload-video", response_model=VideoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_cctv_video(
    file: UploadFile = File(...),
    camera_name: str = Form(...),
    department: str = Form("Police Department"),
    location_name: str = Form("Uploaded Video Checkpoint"),
    latitude: float = Form(28.6139),
    longitude: float = Form(77.2090),
    db: Session = Depends(get_db)
):
    """
    Upload a CCTV video recording file and register it as an active FILE-based camera source.
    Supported extensions: .mp4, .avi, .mkv, .mov, .webm
    """
    ALLOWED_EXTS = [".mp4", ".avi", ".mkv", ".mov", ".webm"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid video format '{ext}'. Allowed formats: {ALLOWED_EXTS}"
        )

    # Generate unique filename to avoid collision
    unique_name = f"cctv_{uuid.uuid4().hex[:10]}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_name)

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size_bytes = os.path.getsize(dest_path)
        file_size_mb = round(file_size_bytes / (1024 * 1024), 2)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save video file: {str(e)}"
        )
    finally:
        await file.close()

    # Public web path for frontend stream / playback
    web_source_url = f"/uploads/{unique_name}"

    # Auto-register camera in DB
    new_cam = Camera(
        camera_name=camera_name.strip() if camera_name else f"Uploaded Feed - {file.filename}",
        department=department.strip(),
        location_name=location_name.strip(),
        latitude=latitude,
        longitude=longitude,
        source_type="FILE",
        source_url=web_source_url,
        status="ACTIVE"
    )

    try:
        db.add(new_cam)
        db.commit()
        db.refresh(new_cam)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register uploaded video camera in DB: {str(e)}"
        )

    return {
        "message": "CCTV Video uploaded and registered successfully",
        "camera": new_cam,
        "file_name": unique_name,
        "file_path": dest_path,
        "file_size_mb": file_size_mb,
        "is_streamable": True
    }
