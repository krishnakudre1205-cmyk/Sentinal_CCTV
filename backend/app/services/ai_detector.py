"""
AI DETECTION ENGINE SERVICE (Module 2 & Module 3 ANPR Integration)
-------------------------------------------------------------------
Architecture Role:
- Real-time / Batch Object & Vehicle Detection using YOLO and OpenCV.
- ANPR Pipeline: Automatic License Plate Recognition on detected vehicles.
- Extracted Classes: Cars, Motorcycles, Buses, Trucks, and Persons.
- Extracts Bounding Boxes, ANPR License Plate Numbers, Confidence Scores, Timestamps.
- Generates Tactical Annotated Video Overlay with License Plate Badges.
"""

import os
import time
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import cv2

from app.services.anpr_engine import anpr_service

# Target detection classes mapped from standard COCO ontology
TARGET_CLASSES = {
    0: "person",
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck"
}

# Color palette for tactical bounding boxes (BGR format for OpenCV)
CLASS_COLORS = {
    "person": (0, 230, 115),      # Neon Emerald Green
    "car": (255, 210, 0),         # Cyber Cyan
    "motorcycle": (220, 50, 220), # Violet / Magenta
    "bus": (0, 180, 255),         # Amber Yellow
    "truck": (0, 100, 255),       # Tactical Orange
    "bicycle": (255, 180, 50),    # Sky Blue
}


class AIDetectionEngine:
    """
    Modular YOLO detection & ANPR service for CCTV streams and video files.
    """

    _instance = None
    _model = None

    def __init__(self, model_name: str = "yolov8n.pt", confidence_threshold: float = 0.35):
        self.model_name = model_name
        self.confidence_threshold = confidence_threshold
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        """Lazy load YOLO weights using Ultralytics."""
        try:
            from ultralytics import YOLO
            models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))
            os.makedirs(models_dir, exist_ok=True)
            model_path = os.path.join(models_dir, self.model_name)

            if not os.path.exists(model_path):
                model_path = self.model_name

            self._model = YOLO(model_path)
            self.is_loaded = True
            print(f"[AIDetectionEngine] YOLO model loaded successfully: {self.model_name}")
        except Exception as e:
            print(f"[AIDetectionEngine] Warning: Could not initialize YOLO directly: {e}")
            self.is_loaded = False

    def detect_frame(self, frame) -> List[Dict[str, Any]]:
        """
        Run inference on a single BGR OpenCV frame.
        Returns normalized list of detected target objects.
        """
        if not self.is_loaded or self._model is None:
            self._load_model()
            if not self.is_loaded:
                return []

        detections = []
        try:
            target_ids = list(TARGET_CLASSES.keys())
            results = self._model(frame, imgsz=640, classes=target_ids, conf=self.confidence_threshold, verbose=False)

            if results and len(results) > 0:
                boxes = results[0].boxes
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    xyxy = box.xyxy[0].tolist()

                    object_type = TARGET_CLASSES.get(cls_id, "unknown")
                    x1, y1, x2, y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])

                    detections.append({
                        "detection_id": f"DET-{uuid.uuid4().hex[:8].upper()}",
                        "object_type": object_type,
                        "confidence": round(conf, 4),
                        "bounding_box": {
                            "x1": x1,
                            "y1": y1,
                            "x2": x2,
                            "y2": y2,
                            "width": x2 - x1,
                            "height": y2 - y1
                        }
                    })
        except Exception as e:
            print(f"[AIDetectionEngine] Frame inference error: {e}")

        return detections

    def draw_detections_on_frame(self, frame, detections: List[Dict[str, Any]]) -> Any:
        """
        Render tactical police surveillance HUD bounding boxes & ANPR license plate badges.
        """
        annotated = frame.copy()
        for det in detections:
            bbox = det["bounding_box"]
            x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]
            obj_type = det["object_type"]
            conf = det["confidence"]
            anpr = det.get("anpr")

            color = CLASS_COLORS.get(obj_type, (0, 255, 255))

            # 1. Main bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            # 2. Corner accent brackets for tactical HUD look
            corner_len = min(20, (x2 - x1) // 4, (y2 - y1) // 4)
            if corner_len > 4:
                cv2.line(annotated, (x1, y1), (x1 + corner_len, y1), color, 3)
                cv2.line(annotated, (x1, y1), (x1, y1 + corner_len), color, 3)
                cv2.line(annotated, (x2, y1), (x2 - corner_len, y1), color, 3)
                cv2.line(annotated, (x2, y1), (x2, y1 + corner_len), color, 3)
                cv2.line(annotated, (x1, y2), (x1 + corner_len, y2), color, 3)
                cv2.line(annotated, (x1, y2), (x1, y2 - corner_len), color, 3)
                cv2.line(annotated, (x2, y2), (x2 - corner_len, y2), color, 3)
                cv2.line(annotated, (x2, y2), (x2, y2 - corner_len), color, 3)

            # 3. Label badge with ANPR License Plate text if vehicle
            plate_text = anpr.get("plate_number") if anpr else None
            if plate_text:
                label = f"{obj_type.upper()} | {plate_text} ({int(conf * 100)}%)"
            else:
                label = f"{obj_type.upper()} {int(conf * 100)}%"

            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(annotated, (x1, y1 - th - 6), (x1 + tw + 6, y1), color, -1)
            cv2.putText(annotated, label, (x1 + 3, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)

        return annotated

    def process_video(
        self,
        video_source_path: str,
        camera_id: int,
        output_dir: str,
        sample_fps: int = 10,
        max_duration_seconds: int = 60
    ) -> Dict[str, Any]:
        """
        Process CCTV video stream/file, extract frames, run YOLO + ANPR pipeline,
        draw HUD overlays, and compute summary counts and processing speed.
        """
        resolved_path = video_source_path
        if resolved_path.startswith("/uploads/"):
            resolved_path = os.path.join(".", resolved_path.lstrip("/"))

        if not os.path.exists(resolved_path) and not resolved_path.startswith(("rtsp://", "http://", "https://")):
            raise FileNotFoundError(f"Video source not found at: {resolved_path}")

        cap = cv2.VideoCapture(resolved_path)
        if not cap.isOpened():
            raise RuntimeError(f"Failed to open video source: {resolved_path}")

        src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        src_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
        src_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720

        step = max(1, int(round(src_fps / sample_fps))) if sample_fps > 0 else 1

        annotated_filename = f"annotated_cam_{camera_id}_{uuid.uuid4().hex[:6]}.mp4"
        annotated_filepath = os.path.join(output_dir, annotated_filename)

        # Use H.264 (avc1) for native HTML5 video playback compatibility in Chrome/Edge/Firefox
        try:
            fourcc = cv2.VideoWriter_fourcc(*'avc1')
        except Exception:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out_fps = sample_fps if sample_fps > 0 else src_fps
        writer = cv2.VideoWriter(annotated_filepath, fourcc, out_fps, (src_width, src_height))

        all_detections = []
        anpr_records = []
        class_counts = {
            "car": 0,
            "motorcycle": 0,
            "bus": 0,
            "truck": 0,
            "person": 0,
            "bicycle": 0
        }

        frames_processed = 0
        current_frame_idx = 0
        start_time = time.time()

        max_frames_to_read = int(src_fps * max_duration_seconds) if max_duration_seconds > 0 else 999999

        while cap.isOpened() and current_frame_idx < max_frames_to_read:
            ret, frame = cap.read()
            if not ret:
                break

            if current_frame_idx % step == 0:
                video_timestamp_secs = round(current_frame_idx / src_fps, 2)
                
                # Run YOLO Detection
                frame_detections = self.detect_frame(frame)

                # Process objects & run ANPR on vehicles
                for det in frame_detections:
                    obj_type = det["object_type"]
                    if obj_type in class_counts:
                        class_counts[obj_type] += 1

                    anpr_data = None
                    if obj_type in ["car", "motorcycle", "bus", "truck"]:
                        # Execute ANPR pipeline on vehicle ROI
                        anpr_data = anpr_service.process_vehicle_anpr(
                            frame=frame,
                            vehicle_bbox=det["bounding_box"],
                            camera_id=camera_id,
                            vehicle_type=obj_type,
                            frame_number=current_frame_idx,
                            timestamp_sec=video_timestamp_secs
                        )
                        det["anpr"] = anpr_data
                        anpr_records.append(anpr_data)

                    det_record = {
                        "detection_id": det["detection_id"],
                        "camera_id": camera_id,
                        "object_type": obj_type,
                        "confidence": det["confidence"],
                        "bounding_box": det["bounding_box"],
                        "frame_number": current_frame_idx,
                        "video_timestamp_secs": video_timestamp_secs,
                        "anpr": anpr_data,
                        "timestamp": datetime.now()
                    }
                    all_detections.append(det_record)

                # Draw tactical bounding boxes & license plate badges
                annotated_frame = self.draw_detections_on_frame(frame, frame_detections)
                
                # Add HUD Header
                hud_text = f"SENTINELFUSION AI | CAM #{camera_id} | T: {video_timestamp_secs:.1f}s | ANPR PLATES: {len(anpr_records)}"
                cv2.putText(annotated_frame, hud_text, (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 210, 255), 2, cv2.LINE_AA)

                writer.write(annotated_frame)
                frames_processed += 1

            current_frame_idx += 1

        cap.release()
        writer.release()

        processing_duration = max(0.001, time.time() - start_time)
        processing_fps = round(frames_processed / processing_duration, 2)

        total_vehicles = (
            class_counts["car"] +
            class_counts["motorcycle"] +
            class_counts["bus"] +
            class_counts["truck"]
        )
        total_all_detections = total_vehicles + class_counts["person"] + class_counts.get("bicycle", 0)
        annotated_video_url = f"/uploads/{annotated_filename}"

        return {
            "camera_id": camera_id,
            "status": "COMPLETED",
            "total_frames_processed": frames_processed,
            "processing_time_secs": round(processing_duration, 2),
            "fps_speed": processing_fps,
            "car_count": class_counts["car"],
            "motorcycle_count": class_counts["motorcycle"],
            "bus_count": class_counts["bus"],
            "truck_count": class_counts["truck"],
            "person_count": class_counts["person"],
            "total_vehicles": total_vehicles,
            "total_detections": total_all_detections,
            "annotated_video_url": annotated_video_url,
            "detections": all_detections,
            "anpr_records": anpr_records
        }


# Global singleton instance
ai_detection_engine = AIDetectionEngine()
