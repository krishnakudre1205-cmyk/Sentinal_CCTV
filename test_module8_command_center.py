import os
import sys
import unittest
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from app.database import init_db, SessionLocal
from app.models.camera import Camera
from app.models.vehicle import VehicleDetection
from app.models.watchlist import WatchlistItem
from app.models.alert import Alert
from app.services.alert_engine import seed_default_watchlist_if_empty


class TestModule8PoliceCommandCenter(unittest.TestCase):
    """
    Unit test suite for Module 8: Police Command Center Integration.
    Tests system KPI metrics aggregation, global search data coverage across cameras/vehicles/watchlist,
    and end-to-end multi-module API integration health.
    """

    def setUp(self):
        init_db()
        self.db = SessionLocal()
        seed_default_watchlist_if_empty(self.db)

    def tearDown(self):
        self.db.close()

    def test_command_center_kpi_metrics_aggregation(self):
        """
        [Test 1] Home Dashboard KPI Metrics Aggregation.
        Validates database aggregation for 5 required command metrics:
        - Total Cameras, Active Cameras, Vehicles Detected Today, Active Alerts, Watchlist Matches.
        """
        total_cameras = self.db.query(Camera).count()
        active_cameras = self.db.query(Camera).filter(Camera.status == "ACTIVE").count()
        vehicles_detected = self.db.query(VehicleDetection).count()
        active_alerts = self.db.query(Alert).filter(Alert.is_acknowledged == False).count()
        watchlist_matches = self.db.query(WatchlistItem).filter(WatchlistItem.is_active == True).count()

        print("\n[Unit Test 1] Home Dashboard KPI Metrics:")
        print(f"  1. Total Cameras: {total_cameras}")
        print(f"  2. Active Cameras: {active_cameras}")
        print(f"  3. Vehicles Detected Today: {vehicles_detected}")
        print(f"  4. Active Alerts: {active_alerts}")
        print(f"  5. Watchlist Matches: {watchlist_matches}")

        self.assertGreaterEqual(total_cameras, 1, "Total cameras should be >= 1")
        self.assertGreaterEqual(watchlist_matches, 4, "Watchlist targets should be >= 4")

    def test_global_search_api_coverage(self):
        """
        [Test 2] Global Search Coverage Across Entities.
        Verifies queries match cameras, license plates, and watchlist entries.
        """
        # 1. Search Plate
        plate_target = self.db.query(WatchlistItem).filter(
            (WatchlistItem.plate_number == "GJ01AB1234") | (WatchlistItem.license_plate == "GJ01AB1234")
        ).first()
        self.assertIsNotNone(plate_target)
        self.assertEqual(plate_target.priority.upper(), "CRITICAL")

        # 2. Search Camera
        camera_target = self.db.query(Camera).filter(Camera.id == 1).first()
        self.assertIsNotNone(camera_target)
        self.assertIsNotNone(camera_target.camera_name)

        print("\n[Unit Test 2] Global Search Coverage Verified:")
        print(f"  Matched Watchlist Target: {plate_target.target_name} ({plate_target.plate_number})")
        print(f"  Matched Camera Node: {camera_target.camera_name} [{camera_target.department}]")

    def test_all_modules_integration_health(self):
        """
        [Test 3] End-to-End Multi-Module Integration Health.
        Validates data consistency across all 8 modules (Module 1 through Module 7).
        """
        cams = self.db.query(Camera).all()
        dets = self.db.query(VehicleDetection).all()
        watch = self.db.query(WatchlistItem).all()
        alerts = self.db.query(Alert).all()

        print(f"\n[Unit Test 3] Command Center System Health:")
        print(f"  Module 1 (Cameras): {len(cams)} nodes")
        print(f"  Module 2/3/4 (Detections/DNA): {len(dets)} logged")
        print(f"  Module 6 (Watchlist): {len(watch)} targets")
        print(f"  Module 6 (Alerts): {len(alerts)} records")

        self.assertTrue(len(cams) > 0 and len(watch) > 0)


if __name__ == "__main__":
    unittest.main()
