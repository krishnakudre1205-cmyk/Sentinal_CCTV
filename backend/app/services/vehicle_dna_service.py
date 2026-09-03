import os
import math
import json
import uuid
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.services.visual_embedder import default_visual_embedder

# Default 6-signal weight configuration for Vehicle DNA match calculation
DEFAULT_DNA_WEIGHTS = {
    "plate_similarity": 0.40,
    "visual_similarity": 0.25,
    "vehicle_type": 0.10,
    "color": 0.10,
    "time_continuity": 0.10,
    "location_feasibility": 0.05
}

# Vehicle Type compatibility matrix
TYPE_SIMILARITY_MATRIX = {
    ("car", "car"): 1.0,
    ("bus", "bus"): 1.0,
    ("truck", "truck"): 1.0,
    ("motorcycle", "motorcycle"): 1.0,
    ("car", "suv"): 0.8,
    ("suv", "car"): 0.8,
    ("truck", "bus"): 0.5,
    ("bus", "truck"): 0.5,
}

# Color similarity lookup
COLOR_SIMILARITY_MATRIX = {
    ("white", "silver"): 0.7,
    ("silver", "white"): 0.7,
    ("black", "dark_gray"): 0.8,
    ("dark_gray", "black"): 0.8,
    ("silver", "gray"): 0.85,
    ("gray", "silver"): 0.85,
    ("red", "orange"): 0.6,
    ("orange", "red"): 0.6,
}


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance in kilometers between two GPS points."""
    if lat1 == 0.0 or lat2 == 0.0 or lon1 == 0.0 or lon2 == 0.0:
        return 0.0
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def string_similarity_ratio(s1: str, s2: str) -> float:
    """Computes character overlap / edit ratio between two license plate strings."""
    if not s1 or not s2:
        return 0.0
    u1 = s1.upper().replace("-", "").replace(" ", "")
    u2 = s2.upper().replace("-", "").replace(" ", "")
    if u1 == u2:
        return 1.0
    
    # Handle wildcard characters '?' or '*'
    if '?' in u1 or '?' in u2 or '*' in u1 or '*' in u2:
        matches = 0
        min_len = min(len(u1), len(u2))
        for i in range(min_len):
            c1, c2 = u1[i], u2[i]
            if c1 == '?' or c2 == '?' or c1 == '*' or c2 == '*' or c1 == c2:
                matches += 1
        return round(matches / max(len(u1), len(u2)), 3)

    # Character position matching ratio
    matches = sum(1 for a, b in zip(u1, u2) if a == b)
    max_len = max(len(u1), len(u2))
    return round(matches / max_len, 3) if max_len > 0 else 0.0


class VehicleDNAService:
    """
    Vehicle DNA Engine Service.
    Constructs 9-field Vehicle DNA vectors, executes 6-signal multi-feature similarity scoring,
    and manages persistent vehicle identity correlation across heterogeneous CCTV streams.
    """

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or DEFAULT_DNA_WEIGHTS.copy()
        self._normalize_weights()

    def _normalize_weights(self):
        """Ensures all 6 signal weights sum to 1.0."""
        total = sum(self.weights.values())
        if total > 0:
            for k in self.weights:
                self.weights[k] = round(self.weights[k] / total, 4)

    def construct_dna_vector(
        self,
        frame: Optional[np.ndarray] = None,
        vehicle_crop: Optional[np.ndarray] = None,
        vehicle_bbox: Optional[Dict[str, int]] = None,
        plate_number: Optional[str] = None,
        plate_confidence: float = 0.0,
        vehicle_type: str = "car",
        color: Optional[str] = None,
        camera_id: int = 1,
        timestamp: Optional[datetime] = None,
        latitude: float = 0.0,
        longitude: float = 0.0,
        detection_confidence: float = 0.90
    ) -> Dict[str, Any]:
        """
        Constructs a complete 9-field Vehicle DNA representation dictionary.
        """
        # Crop vehicle if frame & bbox supplied
        crop = vehicle_crop
        if crop is None and frame is not None and vehicle_bbox is not None:
            h, w, _ = frame.shape
            x1 = max(0, int(vehicle_bbox.get("x1", 0)))
            y1 = max(0, int(vehicle_bbox.get("y1", 0)))
            x2 = min(w, int(vehicle_bbox.get("x2", w)))
            y2 = min(h, int(vehicle_bbox.get("y2", h)))
            if (x2 - x1) > 10 and (y2 - y1) > 10:
                crop = frame[y1:y2, x1:x2]

        # Extract visual appearance embedding & dominant color
        if crop is not None and crop.size > 0:
            visual_embedding = default_visual_embedder.extract_visual_embedding(crop)
            if not color:
                detected_c, _ = default_visual_embedder.detect_dominant_color(crop)
                color = detected_c
        else:
            visual_embedding = [0.0] * 128
            color = color or "unknown"

        ts_str = (timestamp or datetime.now()).isoformat()

        return {
            "plate_number": plate_number or "",
            "plate_confidence": round(float(plate_confidence), 3),
            "vehicle_type": (vehicle_type or "car").lower(),
            "color": (color or "unknown").lower(),
            "visual_embedding": visual_embedding,
            "camera_id": camera_id,
            "timestamp": ts_str,
            "geographic_location": {
                "latitude": round(float(latitude), 4),
                "longitude": round(float(longitude), 4)
            },
            "latitude": round(float(latitude), 4),
            "longitude": round(float(longitude), 4),
            "detection_confidence": round(float(detection_confidence), 3)
        }

    def calculate_similarity(
        self,
        dna1: Dict[str, Any],
        dna2: Dict[str, Any],
        custom_weights: Optional[Dict[str, float]] = None
    ) -> Tuple[float, Dict[str, float]]:
        """
        Executes 6-signal multi-feature similarity scoring:
          1. Plate Similarity (40%)
          2. Visual Appearance Similarity (25%)
          3. Vehicle Type Match (10%)
          4. Color Spectrum Match (10%)
          5. Time Continuity (10%)
          6. Location Feasibility (5%)
        Returns (overall_match_confidence_pct, component_scores_dict).
        """
        weights = custom_weights.copy() if custom_weights else self.weights.copy()
        
        # 1. License Plate Similarity
        plate1 = dna1.get("plate_number", "")
        plate2 = dna2.get("plate_number", "")
        plate_score = string_similarity_ratio(plate1, plate2)

        # 2. Visual Embedding Cosine Similarity
        vec1 = np.array(dna1.get("visual_embedding", [0.0]*128), dtype=np.float32)
        vec2 = np.array(dna2.get("visual_embedding", [0.0]*128), dtype=np.float32)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 > 0 and norm2 > 0:
            cos_sim = float(np.dot(vec1, vec2) / (norm1 * norm2))
            visual_score = round(max(0.0, min(1.0, (cos_sim + 1.0) / 2.0)), 4)
        else:
            visual_score = 0.5

        # 3. Vehicle Type Similarity
        t1, t2 = dna1.get("vehicle_type", "car").lower(), dna2.get("vehicle_type", "car").lower()
        if t1 == t2:
            type_score = 1.0
        else:
            type_score = TYPE_SIMILARITY_MATRIX.get((t1, t2), TYPE_SIMILARITY_MATRIX.get((t2, t1), 0.0))

        # 4. Color Spectrum Similarity
        c1, c2 = dna1.get("color", "unknown").lower(), dna2.get("color", "unknown").lower()
        if c1 == c2:
            color_score = 1.0
        else:
            color_score = COLOR_SIMILARITY_MATRIX.get((c1, c2), COLOR_SIMILARITY_MATRIX.get((c2, c1), 0.0))

        # 5. Time Continuity
        try:
            ts1 = datetime.fromisoformat(str(dna1.get("timestamp")).replace("Z", ""))
            ts2 = datetime.fromisoformat(str(dna2.get("timestamp")).replace("Z", ""))
            delta_sec = abs((ts2 - ts1).total_seconds())
        except Exception:
            delta_sec = 0.0

        # Exponential decay score based on time gap
        time_score = round(math.exp(-delta_sec / 86400.0), 4)

        # 6. Location / Route Feasibility
        loc1 = dna1.get("geographic_location") if isinstance(dna1.get("geographic_location"), dict) else {}
        lat1 = float(dna1.get("latitude") if dna1.get("latitude") is not None else loc1.get("latitude", 0.0))
        lon1 = float(dna1.get("longitude") if dna1.get("longitude") is not None else loc1.get("longitude", 0.0))

        loc2 = dna2.get("geographic_location") if isinstance(dna2.get("geographic_location"), dict) else {}
        lat2 = float(dna2.get("latitude") if dna2.get("latitude") is not None else loc2.get("latitude", 0.0))
        lon2 = float(dna2.get("longitude") if dna2.get("longitude") is not None else loc2.get("longitude", 0.0))
        dist_km = haversine_distance_km(lat1, lon1, lat2, lon2)

        if dist_km > 0 and delta_sec > 0:
            speed_kmh = (dist_km / (delta_sec / 3600.0))
            if speed_kmh <= 120.0:
                loc_score = 1.0
            elif speed_kmh <= 180.0:
                loc_score = 0.7
            else:
                loc_score = 0.1  # Impossible velocity penalty
        else:
            loc_score = 1.0

        component_scores = {
            "plate_similarity": plate_score,
            "visual_similarity": visual_score,
            "vehicle_type": type_score,
            "color": color_score,
            "time_continuity": time_score,
            "location_feasibility": loc_score
        }

        # Weighted sum
        overall_score = sum(component_scores[k] * weights.get(k, 0.0) for k in component_scores)
        overall_pct = round(max(0.0, min(1.0, overall_score)), 4)

        return overall_pct, component_scores

    def assign_or_create_identity(
        self,
        dna_vector: Dict[str, Any],
        db: Session,
        threshold: float = 0.75
    ) -> Tuple[str, float]:
        """
        Correlates a Vehicle DNA vector against existing VehicleIdentity database records.
        If match confidence >= threshold (75%), links sighting to existing identity.
        Otherwise, registers a new persistent VehicleIdentity record.
        """
        from app.models.vehicle_identity import VehicleIdentity

        identities = db.query(VehicleIdentity).all()
        best_identity = None
        best_score = 0.0

        for ident in identities:
            try:
                existing_dna = json.loads(ident.vehicle_dna)
                score, _ = self.calculate_similarity(dna_vector, existing_dna)
                if score > best_score:
                    best_score = score
                    best_identity = ident
            except Exception:
                continue

        if best_identity and best_score >= threshold:
            # Link to existing VehicleIdentity
            best_identity.total_sightings += 1
            best_identity.last_seen = datetime.now()
            best_identity.last_camera_id = dna_vector.get("camera_id")
            best_identity.last_latitude = dna_vector.get("latitude")
            best_identity.last_longitude = dna_vector.get("longitude")
            if dna_vector.get("plate_number") and not best_identity.plate_number:
                best_identity.plate_number = dna_vector.get("plate_number")
            db.commit()
            return best_identity.identity_id, best_score

        # Register new VehicleIdentity
        plate = dna_vector.get("plate_number") or "UNREADABLE"
        color = dna_vector.get("color") or "unknown"
        vtype = dna_vector.get("vehicle_type") or "car"
        
        uid = f"VDNA-{uuid.uuid4().hex[:8].upper()}"
        new_identity = VehicleIdentity(
            identity_id=uid,
            vehicle_dna=json.dumps(dna_vector),
            plate_number=dna_vector.get("plate_number"),
            vehicle_type=vtype,
            color=color,
            visual_embedding_reference=json.dumps(dna_vector.get("visual_embedding", [])),
            total_sightings=1,
            last_camera_id=dna_vector.get("camera_id"),
            last_latitude=dna_vector.get("latitude"),
            last_longitude=dna_vector.get("longitude")
        )
        db.add(new_identity)
        db.commit()
        return uid, 1.0


# Singleton instance
vehicle_dna_service = VehicleDNAService()
