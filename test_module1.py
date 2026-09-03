import requests
import os

BASE = "http://127.0.0.1:8000"

def run_tests():
    print("=== STARTING MODULE 1 COMPREHENSIVE TEST SUITE ===")

    # 1. Health
    h = requests.get(f"{BASE}/health").json()
    print("[PASS] Health Check:", h)
    assert h["status"] == "online"

    # 2. List Cameras
    cams = requests.get(f"{BASE}/api/cameras/").json()
    print(f"[PASS] List Cameras: {len(cams)} cameras returned.")
    assert len(cams) >= 5

    # 3. Register Cameras across sample departments
    sample_depts = [
        ("Municipal Ward 12 Traffic Cam", "Municipal Department", "Ward 12 Crossroad", "RTSP", "rtsp://127.0.0.1:8554/live/ward12"),
        ("RTO Highway Weighbridge Cam", "RTO Department", "Highway Weighbridge 3", "RTSP", "rtsp://127.0.0.1:8554/live/weighbridge3"),
        ("Secretariat Gate Home Dept Cam", "Home Department", "Secretariat Entry 1", "RTSP", "rtsp://127.0.0.1:8554/live/sec_gate1"),
    ]

    created_ids = []
    for name, dept, loc, stype, surl in sample_depts:
        res = requests.post(f"{BASE}/api/cameras/", json={
            "camera_name": name,
            "department": dept,
            "location_name": loc,
            "latitude": 28.6139,
            "longitude": 77.2090,
            "source_type": stype,
            "source_url": surl,
            "status": "ACTIVE"
        })
        assert res.status_code == 201, f"Failed to register {name}: {res.text}"
        cid = res.json()["id"]
        created_ids.append(cid)
        print(f"[PASS] Registered Camera ID #{cid} for {dept}")

    # 4. Video Upload Test
    test_video = "test_sample_footage.mp4"
    with open(test_video, "wb") as f:
        f.write(b"\x00\x00\x00 ftypisom\x00\x00\x02\x00isomiso2avc1mp41" + b"0" * 5000)

    with open(test_video, "rb") as f:
        upload_res = requests.post(
            f"{BASE}/api/cameras/upload-video",
            files={"file": ("traffic_junction_cctv.mp4", f, "video/mp4")},
            data={
                "camera_name": "Civil Supplies Depot Gate Cam",
                "department": "Food and Civil Supplies Department",
                "location_name": "Depot Outer Perimeter",
                "latitude": "28.5800",
                "longitude": "77.2200"
            }
        )

    if os.path.exists(test_video):
        os.remove(test_video)

    assert upload_res.status_code == 201, f"Upload failed: {upload_res.text}"
    uploaded_cam = upload_res.json()["camera"]
    print(f"[PASS] Video Upload & Camera Auto-Registration: ID #{uploaded_cam['id']}, URL: {uploaded_cam['source_url']}")
    created_ids.append(uploaded_cam["id"])

    # 5. Filter by Department
    rto_cams = requests.get(f"{BASE}/api/cameras/?department=RTO%20Department").json()
    print(f"[PASS] Filter by RTO Department count: {len(rto_cams)}")
    assert len(rto_cams) >= 2

    # 6. Filter by Source Type
    file_cams = requests.get(f"{BASE}/api/cameras/?source_type=FILE").json()
    print(f"[PASS] Filter by FILE source_type count: {len(file_cams)}")
    assert len(file_cams) >= 2

    # 7. Clean up created test cameras
    for cid in created_ids:
        del_res = requests.delete(f"{BASE}/api/cameras/{cid}")
        assert del_res.status_code == 200
    print(f"[PASS] Cleanup: Deleted {len(created_ids)} test camera records successfully.")

    # 8. Frontend dev server check
    fe = requests.get("http://127.0.0.1:5173/")
    print(f"[PASS] Frontend UI Server HTTP status: {fe.status_code}")
    assert fe.status_code == 200

    print("\n=== ALL MODULE 1 TESTS COMPLETED WITH 100% SUCCESS ===")

if __name__ == "__main__":
    run_tests()
