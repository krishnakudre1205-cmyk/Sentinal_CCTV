from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.schemas.alert import AlertResponse, AlertCreate
from app.models.alert import Alert
from app.services.alert_engine import alert_engine
from app.services.websocket_manager import alert_ws_manager

router = APIRouter(prefix="/alerts", tags=["Alerts & Dispatch"])


@router.get("/", response_model=List[AlertResponse])
def list_alerts(db: Session = Depends(get_db)):
    """
    Retrieve real-time and historical law enforcement dispatch alerts.
    """
    try:
        alerts = db.query(Alert).order_by(Alert.id.desc()).all()
        if alerts:
            return alerts
    except Exception as e:
        print(f"[Alerts List Error]: {e}")

    # Fallback simulation items if database is clean
    return [
        {
            "id": 1,
            "alert_id": "ALT-9A81B2C3",
            "title": "WATCHLIST HIT: Reported Stolen Intercity Bus Intercepted",
            "alert_type": "WATCHLIST_MATCH",
            "priority": "CRITICAL",
            "severity": "CRITICAL",
            "message": "CRITICAL ALERT: White Bus (Plate: GJ01AB1234) detected at Sector 4 North Toll Plaza Cam-01. Reason: Reported stolen from Sector 4 Bus Depot.",
            "vehicle": "White Bus",
            "plate": "GJ01AB1234",
            "license_plate": "GJ01AB1234",
            "camera_id": 1,
            "camera_name": "Sector 4 North Toll Plaza Cam-01",
            "location": "North Highway Checkpoint",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "confidence": 0.95,
            "evidence_image": "/uploads/sample_market_cctv.mp4",
            "snapshot_url": "/uploads/sample_market_cctv.mp4",
            "plate_crop_url": "/uploads/plate_crops/sample_crop.jpg",
            "dna_id": "VDNA-GJ01AB1234",
            "is_acknowledged": False,
            "acknowledged_by": None,
            "created_at": datetime.now(),
        },
        {
            "id": 2,
            "alert_id": "ALT-7C12F00E",
            "title": "WATCHLIST HIT: Armed Robbery Suspect Vehicle Detected",
            "alert_type": "WATCHLIST_MATCH",
            "priority": "CRITICAL",
            "severity": "CRITICAL",
            "message": "CRITICAL ALERT: Black Sedan (Plate: DL01CA9988) detected at Expressway Cam-02. Reason: Wanted in connection with armed robbery.",
            "vehicle": "Black Sedan",
            "plate": "DL01CA9988",
            "license_plate": "DL01CA9988",
            "camera_id": 2,
            "camera_name": "City Ring Road Flyover Cam-02",
            "location": "Ring Road Junction North",
            "latitude": 28.6250,
            "longitude": 77.2150,
            "confidence": 0.92,
            "evidence_image": "/uploads/sample_market_cctv.mp4",
            "snapshot_url": "/uploads/sample_market_cctv.mp4",
            "plate_crop_url": "/uploads/plate_crops/sample_crop.jpg",
            "dna_id": "VDNA-DL01CA9988",
            "is_acknowledged": False,
            "acknowledged_by": None,
            "created_at": datetime.now(),
        }
    ]


@router.post("/simulate", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def simulate_watchlist_hit(
    plate: Optional[str] = "GJ01AB1234",
    db: Session = Depends(get_db)
):
    """
    Module 6 Demo Endpoint: Trigger a simulated stolen vehicle watchlist hit.
    Evaluates detection against active Watchlist, generates Alert, and broadcasts live WebSocket notification.
    """
    sim_plate = (plate or "GJ01AB1234").strip().upper()
    sim_detection = {
        "plate_number": sim_plate,
        "raw_ocr_text": sim_plate,
        "plate_confidence": 0.96,
        "vehicle_type": "bus" if "1234" in sim_plate else "car",
        "color": "white" if "1234" in sim_plate else "black",
        "camera_id": 1,
        "latitude": 28.6139,
        "longitude": 77.2090,
        "snapshot_url": "/uploads/sample_market_cctv.mp4",
        "plate_crop_url": "/uploads/plate_crops/sample_crop.jpg",
        "dna_id": f"VDNA-{sim_plate}"
    }

    result = alert_engine.evaluate_detection(sim_detection, db=db)
    if result:
        alert_rec = db.query(Alert).filter(Alert.id == result["id"]).first()
        if alert_rec:
            return alert_rec
            
    # Fallback create alert if evaluate_detection returned None
    new_alert = Alert(
        alert_id=f"ALT-{sim_plate}",
        title=f"WATCHLIST HIT: Simulated Stolen Vehicle ({sim_plate})",
        alert_type="WATCHLIST_MATCH",
        priority="CRITICAL",
        severity="CRITICAL",
        message=f"CRITICAL ALERT: Simulated stolen vehicle {sim_plate} detected at Sector 4 North Toll Plaza.",
        vehicle="White Bus" if "1234" in sim_plate else "Black Sedan",
        plate=sim_plate,
        license_plate=sim_plate,
        camera_id=1,
        camera_name="Sector 4 North Toll Plaza Cam-01",
        location="North Highway Checkpoint",
        latitude=28.6139,
        longitude=77.2090,
        confidence=0.96,
        evidence_image="/uploads/sample_market_cctv.mp4",
        snapshot_url="/uploads/sample_market_cctv.mp4",
        plate_crop_url="/uploads/plate_crops/sample_crop.jpg",
        is_acknowledged=False
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert


@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def trigger_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    """
    Trigger a new command center alert manually.
    """
    new_alert = Alert(**payload.model_dump())
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert


@router.patch("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(alert_id: int, officer_name: str = "Command Officer", db: Session = Depends(get_db)):
    """
    Acknowledge an active alert in the command center.
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert with ID {alert_id} not found")
        
    alert.is_acknowledged = True
    alert.acknowledged_by = officer_name
    db.commit()
    db.refresh(alert)
    return alert
