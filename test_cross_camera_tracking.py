import os
import sys
import unittest
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from app.database import init_db, SessionLocal
from app.services.cross_camera_tracking_service import CrossCameraTrackingService, cross_camera_tracking_service
from app.services.vehicle_dna_service import VehicleDNAService
from app.models.camera import Camera
from app.models.vehicle import VehicleDetection
from app.models.vehicle_identity import VehicleIdentity


class TestCrossCameraTrackingEngine(unittest.TestCase):
    """
    Unit test suite for Module 5: Cross-Camera Vehicle Tracking Engine.
    Tests multi-camera journey reconstruction, match level classification (Confirmed, High Confidence, Possible),
    spatiotemporal velocity validation, and empty journey handling.
    """

    def setUp(self):
        init_db()
        self.db = SessionLocal()
        self.tracking_service = CrossCameraTrackingService()

    def tearDown(self):
        self.db.close()

    def test_multi_camera_journey_reconstruction(self):
        """
        [Test 1] Multi-camera trajectory reconstruction.
        Verifies chronological camera sequence (Stop #1 -> Stop #2 -> Stop #3 -> Stop #4),
        timestamps, and telemetry payload.
        """
        journey = self.tracking_service.reconstruct_journey("GJ01AB1234", self.db)
        print(f"\n[Unit Test 1] Journey Stops Reconstructed: {journey['total_camera_stops']}")
        print(f"  Plate: {journey['plate_number']} | Identity: {journey['identity_id']}")
        print(f"  Match Summary: {journey['match_summary']}")

        self.assertGreaterEqual(journey["total_camera_stops"], 4, "Journey should contain at least 4 camera stops")
        self.assertEqual(journey["plate_number"], "GJ01AB1234")
        
        timeline = journey["timeline"]
        for idx, node in enumerate(timeline):
            self.assertEqual(node["sequence_index"], idx + 1)
            self.assertIn("match_level", node)
            self.assertIn("badge_variant", node)
            self.assertIn("evidence_images", node)
            print(f"   Stop #{node['sequence_index']}: {node['camera_name']} @ {node['timestamp']} [{node['match_level']}] ({node['match_confidence_pct']})")

    def test_match_level_classification(self):
        """
        [Test 2] Match Level Classification.
        - Score >= 0.85 -> "Confirmed Match"
        - Score >= 0.65 -> "High Confidence Match"
        - Score >= 0.40 -> "Possible Match"
        """
        level1, var1 = self.tracking_service.classify_match_level(0.95, plate_exact_match=True, speed_kmh=40.0)
        self.assertEqual(level1, "Confirmed Match")
        self.assertEqual(var1, "confirmed")

        level2, var2 = self.tracking_service.classify_match_level(0.75, plate_exact_match=False, speed_kmh=50.0)
        self.assertEqual(level2, "High Confidence Match")
        self.assertEqual(var2, "high_confidence")

        level3, var3 = self.tracking_service.classify_match_level(0.55, plate_exact_match=False, speed_kmh=45.0)
        self.assertEqual(level3, "Possible Match")
        self.assertEqual(var3, "possible")

        print("\n[Unit Test 2] Match Level Classification Rules Verified.")

    def test_spatiotemporal_speed_validation(self):
        """
        [Test 3] Speed feasibility check.
        If calculated speed > 180 km/h (e.g. 500 km in 1 min = 30,000 km/h),
        classify_match_level demotes match to 'Possible Match' with warning badge.
        """
        level, var = self.tracking_service.classify_match_level(0.99, plate_exact_match=True, speed_kmh=300.0)
        print(f"\n[Unit Test 3] Impossible Speed Result: {level} ({var})")

        self.assertEqual(level, "Possible Match", "Impossible speed (>180 km/h) should demote match level")
        self.assertEqual(var, "warning")

    def test_empty_journey_handling(self):
        """
        [Test 4] Handling empty / invalid query string.
        Should return clean zero-stop journey response without crashing.
        """
        empty_res = self.tracking_service.reconstruct_journey("", self.db)
        self.assertEqual(empty_res["total_camera_stops"], 0)
        self.assertEqual(len(empty_res["timeline"]), 0)
        print("\n[Unit Test 4] Empty Journey Handling Verified.")


if __name__ == "__main__":
    unittest.main()
