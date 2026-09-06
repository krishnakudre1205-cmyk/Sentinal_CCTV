import sys
import os
import time
import requests
import cv2
import numpy as np

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import SessionLocal, engine, Base
from app.models.camera import Camera
from app.models.vehicle import VehicleDetection
from app.models.vehicle_identity import VehicleIdentity
from app.models.watchlist import WatchlistItem
from app.models.alert import Alert
from app.services.demo_seeder import execute_full_demo_seeding
from app.services.ai_detector import ai_detection_engine
from app.services.alert_engine import alert_engine

BASE_URL = "http://127.0.0.1:8000"

def run_integration_tests():
    print("=" * 80)
    print("SENTINELFUSION AI — FINAL MEDIA & ALERT INTEGRATION TEST SUITE")
    print("=" * 80)

    db = SessionLocal()
    results = []

    def log_test(test_num: int, title: str, passed: bool, details: str):
        status = "PASSED" if passed else "FAILED"
        results.append((test_num, title, status, details))
        print(f"[{test_num:02d}] {title:<60} [{status}]")
        if details:
            print(f"     -> {details}")

    # 1. Seed demo data idempotently
    seed_res = execute_full_demo_seeding(db)
    
    # TEST 1: Camera stream / source accessible
    try:
        r = requests.get(f"{BASE_URL}/api/cameras/1", timeout=5)
        passed = r.status_code == 200 and r.json().get("id") == 1
        log_test(1, "Camera Stream / Metadata Accessible", passed, f"Status: {r.status_code}")
    except Exception as e:
        log_test(1, "Camera Stream / Metadata Accessible", False, str(e))

    # TEST 2: Processed Video File Exists on Disk
    try:
        det_res = requests.post(f"{BASE_URL}/api/detection/start/1", timeout=30)
        det_json = det_res.json()
        vid_url = det_json.get("annotated_video_url")
        passed = vid_url is not None and vid_url.startswith("/uploads/")
        
        rel_path = vid_url.lstrip("/")
        abs_path = os.path.join(os.path.dirname(__file__), "backend", rel_path)
        file_exists = os.path.exists(abs_path) and os.path.getsize(abs_path) > 0
        log_test(2, "Processed Video File Exists on Disk", passed and file_exists, f"Path: {vid_url}, Size: {os.path.getsize(abs_path) if file_exists else 0} bytes")
    except Exception as e:
        log_test(2, "Processed Video File Exists on Disk", False, str(e))
        vid_url = None

    # TEST 3: Processed Video HTTP Endpoint Returns 200 OK
    try:
        if vid_url:
            r = requests.get(f"{BASE_URL}{vid_url}", timeout=5, stream=True)
            passed = r.status_code == 200
            log_test(3, "Processed Video HTTP Endpoint Returns 200 OK", passed, f"Status: {r.status_code}")
        else:
            log_test(3, "Processed Video HTTP Endpoint Returns 200 OK", False, "No vid_url")
    except Exception as e:
        log_test(3, "Processed Video HTTP Endpoint Returns 200 OK", False, str(e))

    # TEST 4: Processed Video Content-Type is Browser Compatible
    try:
        if vid_url:
            r = requests.head(f"{BASE_URL}{vid_url}", timeout=5)
            content_type = r.headers.get("Content-Type", "")
            passed = r.status_code == 200 and "video/mp4" in content_type
            log_test(4, "Processed Video Content-Type is video/mp4", passed, f"Content-Type: {content_type}")
        else:
            log_test(4, "Processed Video Content-Type is video/mp4", False, "No vid_url")
    except Exception as e:
        log_test(4, "Processed Video Content-Type is video/mp4", False, str(e))

    # TEST 5: Processed Video Contains Valid Video Frames
    try:
        if vid_url:
            rel_path = vid_url.lstrip("/")
            abs_path = os.path.join(os.path.dirname(__file__), "backend", rel_path)
            cap = cv2.VideoCapture(abs_path)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            cap.release()
            passed = frame_count > 0
            log_test(5, "Processed Video Contains Valid Frames", passed, f"Total Frames: {frame_count}")
        else:
            log_test(5, "Processed Video Contains Valid Frames", False, "No vid_url")
    except Exception as e:
        log_test(5, "Processed Video Contains Valid Frames", False, str(e))

    # TEST 6: Vehicle Evidence Snapshot File Exists on Disk
    try:
        snap_path = os.path.join(os.path.dirname(__file__), "backend", "uploads", "snapshots", "snap_demo_bus.jpg")
        passed = os.path.exists(snap_path) and os.path.getsize(snap_path) > 100
        log_test(6, "Vehicle Evidence Snapshot File Exists", passed, f"Size: {os.path.getsize(snap_path) if os.path.exists(snap_path) else 0} bytes")
    except Exception as e:
        log_test(6, "Vehicle Evidence Snapshot File Exists", False, str(e))

    # TEST 7: Vehicle Evidence Snapshot HTTP URL Returns 200 OK
    try:
        r = requests.get(f"{BASE_URL}/uploads/snapshots/snap_demo_bus.jpg", timeout=5)
        passed = r.status_code == 200 and "image/" in r.headers.get("Content-Type", "")
        log_test(7, "Vehicle Evidence Snapshot HTTP URL Returns 200 OK", passed, f"Status: {r.status_code}, Content-Type: {r.headers.get('Content-Type')}")
    except Exception as e:
        log_test(7, "Vehicle Evidence Snapshot HTTP URL Returns 200 OK", False, str(e))

    # TEST 8: License Plate Crop Image File Exists on Disk
    try:
        crop_path = os.path.join(os.path.dirname(__file__), "backend", "uploads", "plate_crops", "plate_demo_bus.jpg")
        passed = os.path.exists(crop_path) and os.path.getsize(crop_path) > 100
        log_test(8, "License Plate Crop Image File Exists", passed, f"Size: {os.path.getsize(crop_path) if os.path.exists(crop_path) else 0} bytes")
    except Exception as e:
        log_test(8, "License Plate Crop Image File Exists", False, str(e))

    # TEST 9: License Plate Crop HTTP URL Returns 200 OK
    try:
        r = requests.get(f"{BASE_URL}/uploads/plate_crops/plate_demo_bus.jpg", timeout=5)
        passed = r.status_code == 200 and "image/" in r.headers.get("Content-Type", "")
        log_test(9, "License Plate Crop HTTP URL Returns 200 OK", passed, f"Status: {r.status_code}, Content-Type: {r.headers.get('Content-Type')}")
    except Exception as e:
        log_test(9, "License Plate Crop HTTP URL Returns 200 OK", False, str(e))

    # TEST 10: Real-Time Alert Evidence URLs Return 200 OK
    try:
        r = requests.get(f"{BASE_URL}/api/alerts/", timeout=5)
        alerts_list = r.json()
        passed = False
        details = "No alerts found"
        if alerts_list and len(alerts_list) > 0:
            first_alert = alerts_list[0]
            snap_u = first_alert.get("snapshot_url") or first_alert.get("evidence_image")
            crop_u = first_alert.get("plate_crop_url")
            
            r_snap = requests.get(f"{BASE_URL}{snap_u}", timeout=5) if snap_u else None
            r_crop = requests.get(f"{BASE_URL}{crop_u}", timeout=5) if crop_u else None
            
            snap_ok = r_snap is not None and r_snap.status_code == 200
            crop_ok = r_crop is not None and r_crop.status_code == 200
            passed = snap_ok and crop_ok
            details = f"Snap HTTP: {r_snap.status_code if r_snap else 'N/A'}, Crop HTTP: {r_crop.status_code if r_crop else 'N/A'}"
        log_test(10, "Real-Time Alert Evidence URLs Return 200 OK", passed, details)
    except Exception as e:
        log_test(10, "Real-Time Alert Evidence URLs Return 200 OK", False, str(e))

    # TEST 11: Idempotent Alert Deduplication
    try:
        sim_data = {
            "plate_number": "GJ01AB1234",
            "camera_id": 1,
            "snapshot_url": "/uploads/snapshots/snap_demo_bus.jpg",
            "plate_crop_url": "/uploads/plate_crops/plate_demo_bus.jpg"
        }
        alert_engine.evaluate_detection(sim_data, db=db)
        count_after_first = db.query(Alert).filter(Alert.plate == "GJ01AB1234", Alert.camera_id == 1).count()

        alert_engine.evaluate_detection(sim_data, db=db)
        count_after_second = db.query(Alert).filter(Alert.plate == "GJ01AB1234", Alert.camera_id == 1).count()

        passed = (count_after_first == count_after_second) and (count_after_first >= 1)
        log_test(11, "Idempotent Alert Deduplication Prevents Duplicates", passed, f"1st Call Count: {count_after_first}, 2nd Call Count: {count_after_second}")
    except Exception as e:
        log_test(11, "Idempotent Alert Deduplication Prevents Duplicates", False, str(e))

    # TEST 12: Separate Camera Detections Create Separate Events
    try:
        initial_count = db.query(Alert).filter(Alert.camera_id == 4).count()
        sim_data_cam4 = {
            "plate_number": "GJ01AB1234",
            "camera_id": 4,
            "snapshot_url": "/uploads/snapshots/snap_demo_bus.jpg",
            "plate_crop_url": "/uploads/plate_crops/plate_demo_bus.jpg"
        }
        res4 = alert_engine.evaluate_detection(sim_data_cam4, db=db)
        new_count = db.query(Alert).filter(Alert.camera_id == 4).count()
        passed = (new_count == initial_count + 1)
        log_test(12, "Separate Camera Sighting Triggers Separate Alert Event", passed, f"Camera #4 Alerts: {initial_count} -> {new_count}")
    except Exception as e:
        log_test(12, "Separate Camera Sighting Triggers Separate Alert Event", False, str(e))

    # TEST 13: Cross-Camera Journey References Valid Detections & Evidence
    try:
        r = requests.get(f"{BASE_URL}/api/vehicles/GJ01AB1234/journey", timeout=5)
        j_data = r.json()
        passed = j_data.get("plate_number") == "GJ01AB1234" and len(j_data.get("timeline", [])) > 0
        details = f"Journey stops: {len(j_data.get('timeline', []))}"
        log_test(13, "Cross-Camera Journey Validated", passed, details)
    except Exception as e:
        log_test(13, "Cross-Camera Journey Validated", False, str(e))

    # TEST 14: Evidence URLs Free of Windows Local File Paths
    try:
        r = requests.get(f"{BASE_URL}/api/vehicles/search?plate=GJ01AB1234", timeout=5)
        veh_data = r.json()
        invalid_paths = []
        for v in veh_data:
            s_url = v.get("snapshot_url", "")
            c_url = v.get("plate_crop_url", "")
            if ":" in s_url or "\\" in s_url or s_url.startswith("file:"):
                invalid_paths.append(s_url)
            if ":" in c_url or "\\" in c_url or c_url.startswith("file:"):
                invalid_paths.append(c_url)
        passed = len(invalid_paths) == 0
        log_test(14, "No Local Windows Paths Exposed in API", passed, f"Invalid Paths: {invalid_paths}")
    except Exception as e:
        log_test(14, "No Local Windows Paths Exposed in API", False, str(e))

    # TEST 15: Demo Seeder Idempotency
    try:
        seed1 = execute_full_demo_seeding(db)
        count_cams = db.query(Camera).count()
        count_dets = db.query(VehicleDetection).count()
        seed2 = execute_full_demo_seeding(db)
        count_cams_after = db.query(Camera).count()
        count_dets_after = db.query(VehicleDetection).count()
        passed = (count_cams == count_cams_after) and (count_dets == count_dets_after)
        log_test(15, "Demo Seeder Execution is 100% Idempotent", passed, f"Cameras: {count_cams}->{count_cams_after}, Detections: {count_dets}->{count_dets_after}")
    except Exception as e:
        log_test(15, "Demo Seeder Execution is 100% Idempotent", False, str(e))

    db.close()

    print("=" * 80)
    total_passed = sum(1 for r in results if r[2] == "PASSED")
    print(f"FINAL RESULT: {total_passed}/{len(results)} INTEGRATION TESTS PASSED ({(total_passed/len(results))*100:.1f}%)")
    print("=" * 80)

    return total_passed == len(results)

if __name__ == "__main__":
    success = run_integration_tests()
    sys.exit(0 if success else 1)
