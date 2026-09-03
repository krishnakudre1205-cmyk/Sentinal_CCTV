import os
import time
import requests

BASE = "http://127.0.0.1:8000"

def run_module2_tests():
    print("=" * 65)
    print("=== STARTING MODULE 2: AI DETECTION ENGINE TEST SUITE ===")
    print("=" * 65)

    # 1. Health check verification
    h = requests.get(f"{BASE}/health").json()
    print("\n[1] Health Check:", h)
    assert h["status"] == "online"

    # 2. Get registered cameras & select Camera 3 (Central Municipal Market Square Feed)
    cams = requests.get(f"{BASE}/api/cameras/").json()
    assert len(cams) > 0, "No registered cameras found"
    
    target_cam = None
    for c in cams:
        if c["id"] == 3:
            target_cam = c
            break
    if not target_cam:
        target_cam = cams[0]

    cam_id = target_cam["id"]
    print(f"\n[2] Target Camera for AI Detection: ID #{cam_id} - '{target_cam['camera_name']}' ({target_cam['department']})")

    # 3. Trigger AI Detection Pipeline via API
    print(f"\n[3] Triggering POST /api/detection/start/{cam_id} ...")
    start_time = time.time()
    res = requests.post(f"{BASE}/api/detection/start/{cam_id}")
    duration = time.time() - start_time
    print(f"    API Response Status: {res.status_code} (took {duration:.2f}s)")
    assert res.status_code == 200, f"Detection failed: {res.text}"

    data = res.json()
    print("\n" + "-" * 65)
    print("=== AI DETECTION ENGINE RESULTS SUMMARY ===")
    print("-" * 65)
    print(f"Status:                  {data['status']}")
    print(f"Total Frames Processed:  {data['total_frames_processed']}")
    print(f"Processing Time:         {data['processing_time_secs']} seconds")
    print(f"Average Inference Speed: {data['fps_speed']} FPS")
    print(f"Cars Detected:           {data['car_count']}")
    print(f"Motorcycles Detected:    {data['motorcycle_count']}")
    print(f"Buses Detected:          {data['bus_count']}")
    print(f"Trucks Detected:         {data['truck_count']}")
    print(f"Persons Detected:        {data['person_count']}")
    print(f"Total Vehicles:          {data['total_vehicles']}")
    print(f"Total Detections:        {data['total_detections']}")
    print(f"Annotated Video URL:     {data['annotated_video_url']}")
    print("-" * 65)

    # 4. Verify GET /api/detection/results/{camera_id}
    print(f"\n[4] Testing GET /api/detection/results/{cam_id} ...")
    get_res = requests.get(f"{BASE}/api/detection/results/{cam_id}")
    assert get_res.status_code == 200
    res_data = get_res.json()
    print(f"    Retrieved {len(res_data['detections'])} stored detection event records from database.")
    
    if len(res_data['detections']) > 0:
        sample_det = res_data['detections'][0]
        print(f"\n    Sample Detection Event:")
        print(f"      - ID:          {sample_det['detection_id']}")
        print(f"      - Object Type: {sample_det['object_type']}")
        print(f"      - Confidence:  {sample_det['confidence'] * 100:.1f}%")
        print(f"      - Bounding Box:{sample_det['bounding_box']}")
        print(f"      - Video Time:  {sample_det['video_timestamp_secs']}s")

    print("\n" + "=" * 65)
    print("=== ALL MODULE 2 TESTS PASSED WITH 100% SUCCESS ===")
    print("=" * 65)

if __name__ == "__main__":
    run_module2_tests()
