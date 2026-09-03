import os
import sys
import time
import requests
import cv2
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

BASE = "http://127.0.0.1:8000"


def test_anpr_standalone_service():
    print("=" * 65)
    print("=== [STEP 1] TESTING STANDALONE ANPR SERVICE PIPELINE ===")
    print("=" * 65)

    from app.services.anpr_engine import anpr_service

    # Create synthetic test frame with a vehicle containing license plate text
    frame = np.full((720, 1280, 3), (40, 40, 45), dtype=np.uint8)
    cv2.rectangle(frame, (300, 200), (900, 550), (200, 160, 20), -1)  # Vehicle body
    
    # White license plate rectangle
    cv2.rectangle(frame, (450, 440), (750, 520), (245, 245, 245), -1)
    cv2.rectangle(frame, (450, 440), (750, 520), (10, 10, 10), 3)
    cv2.putText(frame, "GJ01AB1234", (470, 498), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (10, 10, 10), 3)

    bbox = {"x1": 300, "y1": 200, "x2": 900, "y2": 550, "width": 600, "height": 350}

    # Run ANPR pipeline
    res = anpr_service.process_vehicle_anpr(
        frame=frame,
        vehicle_bbox=bbox,
        camera_id=3,
        vehicle_type="bus",
        frame_number=1,
        timestamp_sec=0.1
    )

    print(f"ANPR Extraction Results:")
    print(f"  - Cleaned Plate Number:  {res['plate_number']}")
    print(f"  - Raw OCR Text:          {res['raw_ocr_text']}")
    print(f"  - Confidence Score:      {res['confidence'] * 100:.1f}%")
    print(f"  - Vehicle Type:          {res['vehicle_type']}")
    print(f"  - Plate Crop URL:        {res['plate_crop_url']}")
    print(f"  - Vehicle Snapshot URL:  {res['snapshot_url']}")

    assert res["plate_number"] != "", "Plate normalization returned empty"
    assert res["confidence"] > 0.5, "Confidence score lower than expected"
    print("Standalone ANPR Service Test Passed!")


def run_module3_api_tests():
    print("\n" + "=" * 65)
    print("=== [STEP 2] TESTING MODULE 3 API ENDPOINTS & SEARCH ===")
    print("=" * 65)

    # 1. Health check
    h = requests.get(f"{BASE}/health").json()
    print("\n[1] Health Check:", h)
    assert h["status"] == "online"

    # 2. Trigger AI Detection + ANPR on Camera 3
    cam_id = 3
    print(f"\n[2] Triggering POST /api/detection/start/{cam_id} ...")
    start_time = time.time()
    res = requests.post(f"{BASE}/api/detection/start/{cam_id}")
    duration = time.time() - start_time
    print(f"    API Status: {res.status_code} (took {duration:.2f}s)")
    assert res.status_code == 200, f"Detection failed: {res.text}"

    data = res.json()
    print(f"    Frames Processed: {data['total_frames_processed']} @ {data['fps_speed']} FPS")
    print(f"    Total Vehicles:   {data['total_vehicles']}")
    print(f"    Total Detections: {data['total_detections']}")

    # 3. Test GET /api/vehicles/search?plate=GJ01AB1234 (Exact Match)
    print("\n[3] Testing GET /api/vehicles/search?plate=GJ01AB1234 (Exact Plate Match)...")
    search_res = requests.get(f"{BASE}/api/vehicles/search?plate=GJ01AB1234")
    assert search_res.status_code == 200
    items = search_res.json()
    print(f"    Found {len(items)} matching vehicle sightings.")
    assert len(items) > 0, "No records returned for exact plate search"
    match = items[0]
    print(f"    Match Sample:")
    print(f"      - Plate Number:     {match['plate_number']}")
    print(f"      - Raw OCR Text:     {match['raw_ocr_text']}")
    print(f"      - Confidence:       {match['confidence'] * 100:.1f}%")
    print(f"      - Camera Name:      {match['camera_name']} ({match['department']})")
    print(f"      - Location:         {match['location_name']} [{match['latitude']}, {match['longitude']}]")
    print(f"      - Evidence Frame:   {match['evidence_frame']}")
    print(f"      - Plate Crop:       {match['plate_crop_url']}")

    # 4. Test GET /api/vehicles/search?plate=GJ01AB12?? (Wildcard Partial Match)
    print("\n[4] Testing GET /api/vehicles/search?plate=GJ01AB12?? (Wildcard Partial Match)...")
    wildcard_res = requests.get(f"{BASE}/api/vehicles/search?plate=GJ01AB12??")
    assert wildcard_res.status_code == 200
    wildcard_items = wildcard_res.json()
    print(f"    Found {len(wildcard_items)} wildcard partial matches for 'GJ01AB12??'.")
    assert len(wildcard_items) > 0

    # 5. Test GET /api/vehicles/search?plate=GJ01* (Wildcard Multi-Char Match)
    print("\n[5] Testing GET /api/vehicles/search?plate=GJ01* (State Prefix Wildcard Match)...")
    prefix_res = requests.get(f"{BASE}/api/vehicles/search?plate=GJ01*")
    assert prefix_res.status_code == 200
    prefix_items = prefix_res.json()
    print(f"    Found {len(prefix_items)} prefix matches for 'GJ01*'.")
    assert len(prefix_items) > 0

    print("\n" + "=" * 65)
    print("=== ALL MODULE 3 ANPR TESTS PASSED WITH 100% SUCCESS ===")
    print("=" * 65)


if __name__ == "__main__":
    test_anpr_standalone_service()
    run_module3_api_tests()
