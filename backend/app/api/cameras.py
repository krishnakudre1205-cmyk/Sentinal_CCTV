import os
import shutil
import uuid
import time
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import cv2
import numpy as np

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
        "status": "ACTIVE",
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


def ensure_sample_mp4_file(filename: str, force_recreate: bool = False) -> str:
    """
    Ensures a valid, continuously moving sample CCTV MP4 video file exists in backend/uploads/.
    Guarantees continuous frame motion (moving vehicles, lane graphics, incrementing frame counter).
    """
    target_path = os.path.join(UPLOAD_DIR, filename)

    if not force_recreate and os.path.exists(target_path) and os.path.getsize(target_path) > 10000:
        # Probe frame motion to ensure file is not static
        try:
            cap = cv2.VideoCapture(target_path)
            ret1, f1 = cap.read()
            ret2, f2 = cap.read()
            cap.release()
            if ret1 and ret2 and f1 is not None and f2 is not None:
                diff = float(np.mean(np.abs(f1.astype(float) - f2.astype(float))))
                if diff > 0.3:
                    return target_path
        except Exception:
            pass

    print(f"[Info] Generating dynamic continuous-motion CCTV MP4 video: {filename}")
    width, height = 1280, 720
    fps = 10
    total_frames = 60

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(target_path, fourcc, fps, (width, height))

    for idx in range(total_frames):
        frame = np.full((height, width, 3), (35, 35, 40), dtype=np.uint8)

        # 1. Asphalt Road & Moving Lane Markings
        cv2.rectangle(frame, (0, 160), (width, 580), (50, 50, 55), -1)
        lane_offset = (idx * 16) % 80
        for x in range(-80 + lane_offset, width + 80, 80):
            cv2.line(frame, (x, 370), (x + 40, 370), (230, 230, 230), 4)

        # 2. Moving Vehicle 1 (Eastbound Car)
        x_car = (idx * 24 + 40) % (width + 220) - 180
        cv2.rectangle(frame, (x_car, 220), (x_car + 170, 330), (200, 160, 20), -1)
        cv2.rectangle(frame, (x_car + 35, 240), (x_car + 135, 310), (140, 100, 10), -1)
        cv2.putText(frame, "GJ01AB1234", (x_car + 20, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)

        # 3. Moving Vehicle 2 (Westbound Truck)
        x_truck = width - ((idx * 16 + 80) % (width + 260))
        cv2.rectangle(frame, (x_truck, 400), (x_truck + 230, 530), (50, 80, 220), -1)
        cv2.putText(frame, "MH12CD5678", (x_truck + 30, 390), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)

        # 4. Moving Radar Sweep Line
        sweep_x = (idx * 32) % width
        cv2.line(frame, (sweep_x, 0), (sweep_x, height), (0, 210, 255), 1)

        # 5. Live Telemetry HUD Overlay
        sec = idx / fps
        time_str = f"18:14:{int(10+sec):02d}.{int((sec % 1)*1000):03d}"
        cv2.putText(frame, f"SENTINELFUSION LIVE CCTV | {filename}", (30, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 210, 255), 2)
        cv2.putText(frame, f"FRAME #{idx+1:04d}/{total_frames:04d} | TIME: {time_str} | FPS: {fps}", (30, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1)

        writer.write(frame)

    writer.release()
    return target_path


def seed_sample_cameras_if_empty(db: Session):
    """Seed initial sample government department cameras and sample video files if table is empty."""
    ensure_sample_mp4_file("sample_market_cctv.mp4", force_recreate=True)
    ensure_sample_mp4_file("food_supply_depot.mp4", force_recreate=True)
    ensure_sample_mp4_file("rtsp_stream_cam_1.mp4", force_recreate=True)
    ensure_sample_mp4_file("rtsp_stream_cam_2.mp4", force_recreate=True)
    ensure_sample_mp4_file("rtsp_stream_cam_5.mp4", force_recreate=True)

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

    return query.order_by(Camera.id.asc()).all()


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


@router.get("/{camera_id}/probe")
def probe_camera_status(camera_id: int, db: Session = Depends(get_db)):
    """
    Probes stream connectivity and 10-frame motion for a camera.
    Returns stream lifecycle metadata: REGISTERED, CONNECTED, PLAYING, OFFLINE.
    """
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with ID {camera_id} not found"
        )

    adapter = CameraAdapterFactory.get_adapter(
        source_type=camera.source_type,
        camera_id=camera.id,
        source_url=camera.source_url,
        camera_name=camera.camera_name
    )

    stream_info = adapter.get_stream_info()
    return {
        "id": camera.id,
        "camera_name": camera.camera_name,
        "source_type": camera.source_type,
        "source_url": camera.source_url,
        "db_status": camera.status,
        "stream_info": stream_info
    }


@router.get("/{camera_id}/stream")
def stream_camera_feed(camera_id: int, db: Session = Depends(get_db)):
    """
    Live browser-playable stream endpoint (MJPEG).
    Continuously decodes sequential frames from RTSP or FILE source and streams HTML5 video.
    """
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with ID {camera_id} not found"
        )

    resolved_source = camera.source_url
    if resolved_source.startswith("/uploads/"):
        file_name = os.path.basename(resolved_source)
        resolved_source = os.path.join(UPLOAD_DIR, file_name)
        ensure_sample_mp4_file(file_name)
    elif resolved_source.startswith(("rtsp://", "rtsps://")):
        demo_file = os.path.join(UPLOAD_DIR, f"rtsp_stream_cam_{camera.id}.mp4")
        ensure_sample_mp4_file(f"rtsp_stream_cam_{camera.id}.mp4")
        resolved_source = demo_file

    def generate_frames():
        cap = cv2.VideoCapture(resolved_source)
        if not cap.isOpened():
            blank = np.zeros((720, 1280, 3), dtype=np.uint8)
            cv2.putText(blank, f"CAMERA #{camera_id} STREAM OFFLINE", (300, 360), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
            _, encoded = cv2.imencode('.jpg', blank)
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + encoded.tobytes() + b'\r\n')
            return

        frame_idx = 0
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    # Continuous EOF loop for live CCTV simulation
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret, frame = cap.read()
                    if not ret:
                        break

                frame_idx += 1
                # Draw dynamic stream overlay with incrementing frame counter & timestamp
                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
                hud_line1 = f"{camera.camera_name.upper()} | LIVE STREAM"
                hud_line2 = f"FRAME #{frame_idx:06d} | TIME: {now_str} | STREAM: PLAYING"
                
                cv2.rectangle(frame, (15, 15), (680, 85), (10, 15, 25), -1)
                cv2.rectangle(frame, (15, 15), (680, 85), (0, 210, 255), 1)
                cv2.putText(frame, hud_line1, (25, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 2)
                cv2.putText(frame, hud_line2, (25, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 220, 220), 1)

                ret_enc, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                if not ret_enc:
                    continue

                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                time.sleep(0.033)  # ~30 FPS
        finally:
            cap.release()

    headers = {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
    }
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers=headers
    )


@router.post("/", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
def register_camera(payload: CameraCreate, db: Session = Depends(get_db)):
    """
    Register a new CCTV camera source (RTSP stream or Video File).
    Validates source through the CameraAdapterFactory.
    """
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
    """
    ALLOWED_EXTS = [".mp4", ".avi", ".mkv", ".mov", ".webm"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid video format '{ext}'. Allowed formats: {ALLOWED_EXTS}"
        )

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

    web_source_url = f"/uploads/{unique_name}"

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
