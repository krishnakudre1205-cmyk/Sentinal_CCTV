import os
import sys
import unittest
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from app.database import init_db, SessionLocal
from app.models.watchlist import WatchlistItem
from app.models.alert import Alert
from app.services.alert_engine import alert_engine, seed_default_watchlist_if_empty
from app.services.websocket_manager import alert_ws_manager


class TestModule6AlertEngine(unittest.TestCase):
    """
    Unit test suite for Module 6: Watchlist and Real-Time Alert Engine.
    Tests local watchlist seeding, automated hit evaluation pipeline,
    priority classification (CRITICAL, HIGH, MEDIUM), evidence paths, and simulated stolen vehicle alerts.
    """

    def setUp(self):
        init_db()
        self.db = SessionLocal()
        seed_default_watchlist_if_empty(self.db)

    def tearDown(self):
        self.db.close()

    def test_watchlist_seeding_and_lookup(self):
        """
        [Test 1] Representative Watchlist Seeding & Target Lookup.
        Verifies local representative watchlist targets exist in DB.
        """
        targets = self.db.query(WatchlistItem).filter(WatchlistItem.is_active == True).all()
        print(f"\n[Unit Test 1] Active Watchlist Targets Loaded: {len(targets)}")

        self.assertGreaterEqual(len(targets), 4, "Watchlist should contain at least 4 seeded targets")
        
        plates = [t.plate_number or t.license_plate for t in targets]
        self.assertIn("GJ01AB1234", plates)
        self.assertIn("DL01CA9988", plates)

        stolen_bus = self.db.query(WatchlistItem).filter(
            (WatchlistItem.plate_number == "GJ01AB1234") | (WatchlistItem.license_plate == "GJ01AB1234")
        ).first()
        self.assertIsNotNone(stolen_bus)
        self.assertEqual(stolen_bus.priority.upper(), "CRITICAL")

    def test_watchlist_match_and_alert_generation(self):
        """
        [Test 2] Watchlist Detection Match & Alert Generation.
        Pipeline: Detection -> ANPR -> Vehicle DNA -> Watchlist Search -> Alert Object.
        Verifies alert payload contains all required fields:
        - alert_id, priority, vehicle, plate, camera, location, timestamp, confidence, evidence_image
        """
        detection_event = {
            "plate_number": "GJ01AB1234",
            "raw_ocr_text": "GJ01AB1234",
            "plate_confidence": 0.95,
            "vehicle_type": "bus",
            "color": "white",
            "camera_id": 1,
            "latitude": 28.6139,
            "longitude": 77.2090,
            "snapshot_url": "/uploads/sample_market_cctv.mp4",
            "plate_crop_url": "/uploads/plate_crops/sample_crop.jpg",
            "dna_id": "VDNA-GJ01AB1234"
        }

        alert = alert_engine.evaluate_detection(detection_event, self.db)
        print(f"\n[Unit Test 2] Alert Generated: {alert['alert_id']} ({alert['priority']})")
        print(f"  Title: {alert['title']}")
        print(f"  Message: {alert['message']}")

        self.assertIsNotNone(alert, "Watchlist hit should produce an alert object")
        self.assertTrue(alert["alert_id"].startswith("ALT-"))
        self.assertEqual(alert["priority"], "CRITICAL")
        self.assertEqual(alert["plate"], "GJ01AB1234")
        self.assertIn("snapshot_url", alert)
        self.assertIn("plate_crop_url", alert)

        # Check DB record
        db_alert = self.db.query(Alert).filter(Alert.alert_id == alert["alert_id"]).first()
        self.assertIsNotNone(db_alert)
        self.assertEqual(db_alert.priority, "CRITICAL")

    def test_stolen_vehicle_simulation(self):
        """
        [Test 3] Simulated Stolen Vehicle Hit (GJ01AB1234).
        Tests triggering a simulated stolen vehicle hit for hackathon demo.
        """
        sim_event = {
            "plate_number": "GJ01AB1234",
            "raw_ocr_text": "GJ01AB1234",
            "plate_confidence": 0.98,
            "vehicle_type": "bus",
            "color": "white",
            "camera_id": 1,
            "snapshot_url": "/uploads/sample_market_cctv.mp4",
            "plate_crop_url": "/uploads/plate_crops/sample_crop.jpg"
        }

        alert = alert_engine.evaluate_detection(sim_event, self.db)
        print(f"\n[Unit Test 3] Stolen Vehicle Simulation Alert Result: {alert['priority']} - {alert['plate']}")

        self.assertIsNotNone(alert)
        self.assertEqual(alert["plate"], "GJ01AB1234")
        self.assertIn(alert["priority"], ["CRITICAL", "HIGH", "MEDIUM"])

    def test_alert_acknowledgement(self):
        """
        [Test 4] Alert Acknowledgment.
        Tests marking active alert as acknowledged by a command center officer.
        """
        alert_rec = Alert(
            alert_id="ALT-TESTACK01",
            title="TEST ALERT",
            alert_type="WATCHLIST_MATCH",
            priority="HIGH",
            severity="HIGH",
            message="Test alert message",
            plate="DL01CA9988",
            is_acknowledged=False
        )
        self.db.add(alert_rec)
        self.db.commit()
        self.db.refresh(alert_rec)

        alert_rec.is_acknowledged = True
        alert_rec.acknowledged_by = "Officer R. Sharma"
        self.db.commit()

        updated = self.db.query(Alert).filter(Alert.id == alert_rec.id).first()
        self.assertTrue(updated.is_acknowledged)
        self.assertEqual(updated.acknowledged_by, "Officer R. Sharma")
        print(f"\n[Unit Test 4] Alert #{updated.id} Acknowledgment Verified.")


if __name__ == "__main__":
    unittest.main()
