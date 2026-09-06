import os
import json
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.camera import Camera
from app.models.vehicle import VehicleDetection
from app.models.vehicle_identity import VehicleIdentity
from app.models.watchlist import WatchlistItem
from app.models.alert import Alert
from app.services.alert_engine import seed_default_watchlist_if_empty, alert_engine


DEFAULT_CAMERAS = [
    {
        "camera_name": "Sector 4 North Toll Plaza Cam-01",
        "department": "Police Department",
        "location_name": "Sector 4 North Toll Plaza, Outer Ring",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "source_type": "MP4_FILE",
        "source_url": "/uploads/sample_market_cctv.mp4",
        "status": "ACTIVE"
    },
    {
        "camera_name": "RTO High-Speed Expressway Checkpoint",
        "department": "RTO Department",
        "location_name": "Expressway Km 14 Junction",
        "latitude": 28.6289,
        "longitude": 77.2065,
        "source_type": "MP4_FILE",
        "source_url": "/uploads/sample_market_cctv.mp4",
        "status": "ACTIVE"
    },
    {
        "camera_name": "Central Municipal Market Square Feed",
        "department": "Municipal Department",
        "location_name": "Market Square Sector 2",
        "latitude": 28.6353,
        "longitude": 77.2250,
        "source_type": "MP4_FILE",
        "source_url": "/uploads/sample_market_cctv.mp4",
        "status": "ACTIVE"
    },
    {
        "camera_name": "State Food Supply Godown Gate-2",
        "department": "Food and Civil Supplies Department",
        "location_name": "Godown Depot Sector 8",
        "latitude": 28.6012,
        "longitude": 77.2341,
        "source_type": "MP4_FILE",
        "source_url": "/uploads/sample_market_cctv.mp4",
        "status": "ACTIVE"
    },
    {
        "camera_name": "Home Department High-Security Perimeter",
        "department": "Home Department",
        "location_name": "Secretariat Perimeter North",
        "latitude": 28.6180,
        "longitude": 77.2140,
        "source_type": "MP4_FILE",
        "source_url": "/uploads/sample_market_cctv.mp4",
        "status": "ACTIVE"
    }
]


def execute_full_demo_seeding(db: Session) -> dict:
    """
    Module 9 Hackathon Demo Seeder.
    Executes complete 9-step scenario:
      1. Register multiple cameras across government departments
      2. Upload/bind CCTV videos
      3. Process videos & detect vehicles
      4. Read license plates via ANPR
      5. Generate 9-field Vehicle DNA representation
      6. Match vehicles across cameras (Cross-camera tracking)
      7. Construct observed CCTV journey
      8. Trigger watchlist alerts & WebSockets
    """
    # 1. Seed Cameras
    seeded_cams = []
    if db.query(Camera).count() == 0:
        for cdata in DEFAULT_CAMERAS:
            c_obj = Camera(**cdata)
            db.add(c_obj)
        db.commit()
        seeded_cams = db.query(Camera).all()
    else:
        seeded_cams = db.query(Camera).all()

    # 2. Seed Watchlist Targets
    seed_default_watchlist_if_empty(db)

    # 3. Seed Vehicle Detections (Simulation sequence for GJ01AB1234 across cameras)
    target_plate = "GJ01AB1234"
    if db.query(VehicleDetection).filter(VehicleDetection.plate_number == target_plate).count() == 0:
        base_time = datetime.now() - timedelta(minutes=30)
        cams = seeded_cams if seeded_cams else DEFAULT_CAMERAS

        for i in range(len(cams)):
            cam = cams[i]
            cam_id = cam.id if hasattr(cam, "id") else i + 1
            lat = cam.latitude if hasattr(cam, "latitude") else 28.6139 + (i * 0.005)
            lon = cam.longitude if hasattr(cam, "longitude") else 77.2090 + (i * 0.005)
            s_time = base_time + timedelta(minutes=i * 7)

            det = VehicleDetection(
                vehicle_detection_id=f"DET-DEMO-{target_plate}-{i+1}",
                dna_id=f"VDNA-{target_plate}",
                camera_id=cam_id,
                plate_number=target_plate,
                raw_ocr_text=target_plate,
                plate_confidence=0.96,
                vehicle_type="bus",
                type_confidence=0.94,
                color="white",
                color_confidence=0.92,
                detection_confidence=0.95,
                latitude=lat,
                longitude=lon,
                snapshot_url="/uploads/snapshots/snap_demo_bus.jpg",
                plate_crop_url="/uploads/plate_crops/plate_demo_bus.jpg",
                timestamp=s_time
            )
            db.add(det)
        db.commit()

    # 4. Seed Vehicle Identity
    existing_id = db.query(VehicleIdentity).filter(VehicleIdentity.plate_number == target_plate).first()
    if not existing_id:
        v_identity = VehicleIdentity(
            identity_id=f"VDNA-{target_plate}",
            vehicle_dna=json.dumps({
                "plate_number": target_plate,
                "vehicle_type": "bus",
                "color": "white",
                "visual_embedding": [0.1] * 128
            }),
            plate_number=target_plate,
            vehicle_type="bus",
            color="white",
            total_sightings=len(seeded_cams),
            first_seen=datetime.now() - timedelta(minutes=30),
            last_seen=datetime.now(),
            last_camera_id=1,
            last_latitude=28.6139,
            last_longitude=77.2090
        )
        db.add(v_identity)
        db.commit()

    # 5. Trigger Watchlist Alert for Demo Target
    sim_detection = {
        "plate_number": target_plate,
        "raw_ocr_text": target_plate,
        "plate_confidence": 0.98,
        "vehicle_type": "bus",
        "color": "white",
        "camera_id": 1,
        "latitude": 28.6139,
        "longitude": 77.2090,
        "snapshot_url": "/uploads/snapshots/snap_demo_bus.jpg",
        "plate_crop_url": "/uploads/plate_crops/plate_demo_bus.jpg",
        "dna_id": f"VDNA-{target_plate}"
    }
    alert_result = alert_engine.evaluate_detection(sim_detection, db=db)

    return {
        "status": "success",
        "message": "Module 9 Hackathon Demo Scenario Data Seeded Successfully",
        "seeded_cameras": len(seeded_cams),
        "target_vehicle": target_plate,
        "alert_triggered": alert_result is not None
    }
