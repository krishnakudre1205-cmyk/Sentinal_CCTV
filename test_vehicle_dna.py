import os
import sys
import unittest
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

import numpy as np
from app.services.vehicle_dna_service import VehicleDNAService, DEFAULT_DNA_WEIGHTS
from app.services.visual_embedder import BaseVisualEmbedder, LightweightColorEmbedder


class TestVehicleDNASimilarityEngine(unittest.TestCase):
    """
    Unit test suite for Module 4: Vehicle DNA Similarity Engine.
    Tests 6-signal multi-feature correlation, configurable weight overrides,
    obscured plate fallback, distinct vehicle rejection, and route feasibility math.
    """

    def setUp(self):
        self.dna_service = VehicleDNAService()
        self.embedder = LightweightColorEmbedder()

    def test_same_vehicle_multi_camera_high_match(self):
        """
        [Test 1] Vehicle A observed at Camera 1 and Camera 7.
        Plates, color (white), type (bus), and visual embeddings correlate.
        Expected: Match Confidence >= 85%.
        """
        # Vehicle A at Camera 1 (Sector 4 Toll Plaza)
        dna_cam1 = {
            "plate_number": "GJ01AB1234",
            "plate_confidence": 0.92,
            "vehicle_type": "bus",
            "color": "white",
            "visual_embedding": [0.1] * 128,
            "camera_id": 1,
            "timestamp": "2026-09-01T10:00:00",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "detection_confidence": 0.95
        }

        # Vehicle A at Camera 7 (5 km away, 10 mins later)
        dna_cam7 = {
            "plate_number": "GJ01AB1234",
            "plate_confidence": 0.88,
            "vehicle_type": "bus",
            "color": "white",
            "visual_embedding": [0.105] * 128,
            "camera_id": 7,
            "timestamp": "2026-09-01T10:10:00",
            "latitude": 28.6353,
            "longitude": 77.2250,
            "detection_confidence": 0.94
        }

        match_pct, breakdown = self.dna_service.calculate_similarity(dna_cam1, dna_cam7)
        print(f"\n[Unit Test 1] Multi-Camera High Match Result: {match_pct * 100:.1f}%")
        print(f"  Breakdown: {breakdown}")

        self.assertGreaterEqual(match_pct, 0.85, "Same vehicle match confidence should be >= 85%")
        self.assertEqual(breakdown["plate_similarity"], 1.0)
        self.assertEqual(breakdown["vehicle_type"], 1.0)
        self.assertEqual(breakdown["color"], 1.0)

    def test_obscured_license_plate_fallback(self):
        """
        [Test 2] License plate obscured at Camera 2, but visual embedding,
        color (black), vehicle type (car), and route feasibility correlate.
        Expected: Partial signal correlation provides match > 40%.
        """
        dna_cam1 = {
            "plate_number": "DL01CA9988",
            "plate_confidence": 0.95,
            "vehicle_type": "car",
            "color": "black",
            "visual_embedding": [0.2] * 128,
            "camera_id": 1,
            "timestamp": "2026-09-01T12:00:00",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "detection_confidence": 0.98
        }

        # Plate obscured ("") at Camera 2
        dna_cam2 = {
            "plate_number": "",
            "plate_confidence": 0.0,
            "vehicle_type": "car",
            "color": "black",
            "visual_embedding": [0.208] * 128,
            "camera_id": 2,
            "timestamp": "2026-09-01T12:05:00",
            "latitude": 28.6289,
            "longitude": 77.2065,
            "detection_confidence": 0.96
        }

        match_pct, breakdown = self.dna_service.calculate_similarity(dna_cam1, dna_cam2)
        print(f"\n[Unit Test 2] Obscured Plate Fallback Match Result: {match_pct * 100:.1f}%")
        print(f"  Breakdown: {breakdown}")

        self.assertEqual(breakdown["plate_similarity"], 0.0)
        self.assertEqual(breakdown["color"], 1.0)
        self.assertEqual(breakdown["vehicle_type"], 1.0)
        self.assertGreater(match_pct, 0.40, "Obscured plate should still match via visual signals")

    def test_distinct_vehicles_rejection(self):
        """
        [Test 3] White Bus vs Black Sedan.
        Expected: Match Confidence <= 35%.
        """
        white_bus = {
            "plate_number": "GJ01AB1234",
            "vehicle_type": "bus",
            "color": "white",
            "visual_embedding": [0.1] * 128,
            "camera_id": 1,
            "timestamp": "2026-09-01T14:00:00",
            "latitude": 28.6139,
            "longitude": 77.2090
        }

        black_sedan = {
            "plate_number": "MH12DE4567",
            "vehicle_type": "car",
            "color": "black",
            "visual_embedding": [-0.3] * 128,
            "camera_id": 3,
            "timestamp": "2026-09-01T14:00:00",
            "latitude": 28.6353,
            "longitude": 77.2250
        }

        match_pct, breakdown = self.dna_service.calculate_similarity(white_bus, black_sedan)
        print(f"\n[Unit Test 3] Distinct Vehicles Rejection Result: {match_pct * 100:.1f}%")
        print(f"  Breakdown: {breakdown}")

        self.assertLessEqual(match_pct, 0.35, "Distinct vehicles should have match score <= 35%")
        self.assertEqual(breakdown["vehicle_type"], 0.0)
        self.assertEqual(breakdown["color"], 0.0)

    def test_custom_configurable_weights_override(self):
        """
        [Test 4] Custom weight configuration (Visual similarity = 50%, Plate = 20%).
        """
        custom_weights = {
            "plate_similarity": 0.20,
            "visual_similarity": 0.50,
            "vehicle_type": 0.10,
            "color": 0.10,
            "time_continuity": 0.05,
            "location_feasibility": 0.05
        }

        dna1 = {
            "plate_number": "HR26DK8890",
            "vehicle_type": "car",
            "color": "red",
            "visual_embedding": [0.5] * 128,
            "camera_id": 1,
            "timestamp": "2026-09-01T15:00:00",
            "latitude": 28.6139,
            "longitude": 77.2090
        }

        dna2 = {
            "plate_number": "HR26DK8890",
            "vehicle_type": "car",
            "color": "red",
            "visual_embedding": [0.51] * 128,
            "camera_id": 2,
            "timestamp": "2026-09-01T15:05:00",
            "latitude": 28.6289,
            "longitude": 77.2065
        }

        score, breakdown = self.dna_service.calculate_similarity(dna1, dna2, custom_weights=custom_weights)
        print(f"\n[Unit Test 4] Custom Weights Result: {score * 100:.1f}%")

        self.assertGreaterEqual(score, 0.90)

    def test_impossible_velocity_location_penalty(self):
        """
        [Test 5] Distance = 500 km, Time = 1 minute (Speed = 30000 km/h impossible velocity).
        Expected: Location feasibility penalty triggers (0.1).
        """
        dna_delhi = {
            "plate_number": "GJ01AB1234",
            "vehicle_type": "car",
            "color": "white",
            "visual_embedding": [0.1] * 128,
            "camera_id": 1,
            "timestamp": "2026-09-01T16:00:00",
            "latitude": 28.6139,
            "longitude": 77.2090
        }

        # 500 km away (Mumbai lat/lon) only 1 minute later!
        dna_mumbai = {
            "plate_number": "GJ01AB1234",
            "vehicle_type": "car",
            "color": "white",
            "visual_embedding": [0.1] * 128,
            "camera_id": 5,
            "timestamp": "2026-09-01T16:01:00",
            "latitude": 19.0760,
            "longitude": 72.8777
        }

        _, breakdown = self.dna_service.calculate_similarity(dna_delhi, dna_mumbai)
        print(f"\n[Unit Test 5] Impossible Speed Penalty Feasibility Score: {breakdown['location_feasibility']}")

        self.assertEqual(breakdown["location_feasibility"], 0.1, "Impossible velocity should trigger penalty score 0.1")

    def test_dna_vector_has_all_9_fields(self):
        """
        [Test 6] Vehicle DNA Vector field completeness.
        Must contain all 9 required fields:
        1. plate_number (License plate)
        2. plate_confidence
        3. vehicle_type
        4. color (Vehicle color)
        5. visual_embedding (Visual appearance embedding)
        6. camera_id
        7. timestamp
        8. geographic_location / (latitude, longitude)
        9. detection_confidence
        """
        vector = self.dna_service.construct_dna_vector(
            plate_number="KA05MH7788",
            plate_confidence=0.91,
            vehicle_type="suv",
            color="black",
            camera_id=4,
            latitude=12.9716,
            longitude=77.5946,
            detection_confidence=0.96
        )

        required_fields = [
            "plate_number",
            "plate_confidence",
            "vehicle_type",
            "color",
            "visual_embedding",
            "camera_id",
            "timestamp",
            "geographic_location",
            "detection_confidence"
        ]

        for field in required_fields:
            self.assertIn(field, vector, f"Vehicle DNA vector missing required field: {field}")

        self.assertEqual(vector["plate_number"], "KA05MH7788")
        self.assertEqual(vector["vehicle_type"], "suv")
        self.assertEqual(vector["color"], "black")
        self.assertEqual(vector["camera_id"], 4)
        self.assertEqual(len(vector["visual_embedding"]), 128)
        self.assertIn("latitude", vector["geographic_location"])
        self.assertIn("longitude", vector["geographic_location"])
        print("\n[Unit Test 6] Vehicle DNA 9-Field Schema Validation Passed.")

    def test_modular_visual_embedder_interface(self):
        """
        [Test 7] Pluggable BaseVisualEmbedder Interface & Lightweight default embedder.
        Ensures a lightweight default embedder produces 128-dim normalized embedding
        and custom embedder can inherit BaseVisualEmbedder interface.
        """
        # Test LightweightColorEmbedder
        dummy_crop = np.zeros((100, 100, 3), dtype=np.uint8)
        embedding = self.embedder.extract_visual_embedding(dummy_crop)
        color, color_conf = self.embedder.detect_dominant_color(dummy_crop)

        self.assertEqual(len(embedding), 128)
        self.assertIsInstance(color, str)
        self.assertIsInstance(color_conf, float)

        # Test Custom Pluggable Embedder subclassing BaseVisualEmbedder
        class MockDeepReIDEmbedder(BaseVisualEmbedder):
            def extract_visual_embedding(self, crop):
                return [0.77] * 128

            def detect_dominant_color(self, crop):
                return "silver", 0.99

        mock_embedder = MockDeepReIDEmbedder()
        mock_embedding = mock_embedder.extract_visual_embedding(dummy_crop)
        self.assertEqual(len(mock_embedding), 128)
        self.assertEqual(mock_embedding[0], 0.77)
        print("\n[Unit Test 7] Modular Visual Embedder Interface Passed.")

    def test_vehicle_identity_database_persistence(self):
        """
        [Test 8] Database persistence for vehicle_identity table.
        Tests assigning or registering new VehicleIdentity records.
        """
        from app.database import init_db, SessionLocal
        init_db()
        db = SessionLocal()
        try:
            vector1 = self.dna_service.construct_dna_vector(
                plate_number="MH02BZ9999",
                vehicle_type="car",
                color="red",
                camera_id=1,
                latitude=19.0760,
                longitude=72.8777
            )

            identity_id, score = self.dna_service.assign_or_create_identity(vector1, db)
            self.assertTrue(identity_id.startswith("VDNA-"))
            self.assertGreaterEqual(score, 0.75)

            # Query vehicle_identity table
            from app.models.vehicle_identity import VehicleIdentity
            db_record = db.query(VehicleIdentity).filter(VehicleIdentity.identity_id == identity_id).first()
            self.assertIsNotNone(db_record)
            self.assertEqual(db_record.plate_number, "MH02BZ9999")
            self.assertEqual(db_record.vehicle_type, "car")
            self.assertEqual(db_record.color, "red")
            print(f"\n[Unit Test 8] vehicle_identity Persistence Passed (ID: {db_record.identity_id}).")
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
