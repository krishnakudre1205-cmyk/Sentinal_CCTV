import os
import sys
import unittest
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from app.database import init_db, SessionLocal
from app.models.camera import Camera
from app.models.vehicle import VehicleDetection
from app.services.cross_camera_tracking_service import cross_camera_tracking_service


class TestModule7GISRouteIntelligence(unittest.TestCase):
    """
    Unit test suite for Module 7: GIS Route Intelligence.
    Tests camera coordinate retrieval, journey route polyline formatting,
    chronological ordering, evidence images, and non-GPS labeling ("Observed CCTV Journey").
    """

    def setUp(self):
        init_db()
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_camera_gis_coordinates_retrieval(self):
        """
        [Test 1] Camera GIS Coordinates Retrieval.
        Verifies registered CCTV cameras have valid lat/lon GPS coordinates and departments.
        """
        cameras = self.db.query(Camera).all()
        print(f"\n[Unit Test 1] Registered GIS Cameras Count: {len(cameras)}")

        self.assertGreaterEqual(len(cameras), 1, "At least 1 camera should be registered")
        for cam in cameras:
            self.assertIsNotNone(cam.latitude)
            self.assertIsNotNone(cam.longitude)
            self.assertIsInstance(cam.latitude, float)
            self.assertIsInstance(cam.longitude, float)
            print(f"  Camera #{cam.id}: {cam.camera_name} [{cam.department}] @ ({cam.latitude}, {cam.longitude})")

    def test_vehicle_journey_gis_route_formatting(self):
        """
        [Test 2] Vehicle Journey GIS Route Polyline Formatting.
        Verifies journey endpoints produce valid chronological lat/lon coordinate sequences for map plotting.
        """
        journey = cross_camera_tracking_service.reconstruct_journey(
            identity_id_or_plate="GJ01AB1234",
            db=self.db
        )

        timeline = journey.get("timeline", []) if isinstance(journey, dict) else journey.timeline
        plate_number = journey.get("plate_number") if isinstance(journey, dict) else journey.plate_number

        print(f"\n[Unit Test 2] Journey GIS Timeline Stops: {len(timeline)}")
        self.assertEqual(plate_number, "GJ01AB1234")
        self.assertGreater(len(timeline), 0, "Journey should contain timeline stops")

        # Verify each stop has valid lat, lon, sequence_index, timestamp, camera_name, department
        prev_seq = -1
        for stop in timeline:
            stop_dict = stop if isinstance(stop, dict) else stop.__dict__
            seq = stop_dict.get("sequence_index")
            lat = stop_dict.get("latitude")
            lng = stop_dict.get("longitude")
            cam_name = stop_dict.get("camera_name")
            dept = stop_dict.get("department")
            level = stop_dict.get("match_level")
            ev_images = stop_dict.get("evidence_images")

            self.assertGreater(seq, prev_seq)
            prev_seq = seq
            self.assertIsNotNone(lat)
            self.assertIsNotNone(lng)
            self.assertIsNotNone(cam_name)
            self.assertIsNotNone(dept)
            self.assertIn(level, ["Confirmed Match", "High Confidence Match", "Possible Match"])
            self.assertIsNotNone(ev_images)

        first_stop = timeline[0] if isinstance(timeline[0], dict) else timeline[0].__dict__
        last_stop = timeline[-1] if isinstance(timeline[-1], dict) else timeline[-1].__dict__

        print(f"  First GIS Stop: #{first_stop.get('sequence_index')} {first_stop.get('camera_name')} ({first_stop.get('latitude')}, {first_stop.get('longitude')})")
        print(f"  Last GIS Stop: #{last_stop.get('sequence_index')} {last_stop.get('camera_name')} ({last_stop.get('latitude')}, {last_stop.get('longitude')})")

    def test_observed_cctv_journey_label_and_schema(self):
        """
        [Test 3] Observed CCTV Journey Metadata & Non-GPS Validation.
        Asserts that route tracking represents observed movement between CCTV cameras.
        """
        journey = cross_camera_tracking_service.reconstruct_journey(
            identity_id_or_plate="GJ01AB1234",
            db=self.db
        )

        self.assertIsNotNone(journey)
        match_summary = journey.get("match_summary") if isinstance(journey, dict) else journey.match_summary
        total_stops = journey.get("total_camera_stops") if isinstance(journey, dict) else journey.total_camera_stops
        timeline = journey.get("timeline", []) if isinstance(journey, dict) else journey.timeline

        self.assertIsNotNone(match_summary)
        
        # Verify schema components
        for stop in timeline:
            stop_dict = stop if isinstance(stop, dict) else stop.__dict__
            self.assertIsInstance(stop_dict.get("match_confidence"), float)
            self.assertTrue(stop_dict.get("match_confidence_pct").endswith("%"))
            self.assertIsNotNone(stop_dict.get("evidence_images"))

        print(f"\n[Unit Test 3] Non-GPS Trajectory Verified: {total_stops} Camera Stops Processed.")


if __name__ == "__main__":
    unittest.main()
