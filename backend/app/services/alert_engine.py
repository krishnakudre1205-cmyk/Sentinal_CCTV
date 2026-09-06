import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.watchlist import WatchlistItem
from app.models.alert import Alert
from app.models.camera import Camera
from app.services.websocket_manager import alert_ws_manager


DEFAULT_WATCHLIST_TARGETS = [
    {
        "target_name": "Reported Stolen Intercity Bus",
        "plate_number": "GJ01AB1234",
        "license_plate": "GJ01AB1234",
        "vehicle_description": "White Intercity Bus",
        "vehicle_type": "bus",
        "vehicle_color": "white",
        "reason": "Reported hijacked / stolen from Sector 4 Bus Depot",
        "category": "Stolen Vehicle",
        "priority": "CRITICAL",
        "severity": "CRITICAL",
        "status": "ACTIVE",
        "notes": "Vehicle identified fleeing towards highway checkpoint. High priority interception.",
        "is_active": True,
    },
    {
        "target_name": "Armed Robbery Suspect Vehicle",
        "plate_number": "DL01CA9988",
        "license_plate": "DL01CA9988",
        "vehicle_description": "Black Sedan",
        "vehicle_type": "car",
        "vehicle_color": "black",
        "reason": "Wanted in connection with armed robbery in Sector 2",
        "category": "Felony Suspect",
        "priority": "CRITICAL",
        "severity": "CRITICAL",
        "status": "ACTIVE",
        "notes": "Armed suspects onboard. Maintain safe distance and alert SWAT dispatch.",
        "is_active": True,
    },
    {
        "target_name": "Reported Stolen White SUV",
        "plate_number": "HR26DK8890",
        "license_plate": "HR26DK8890",
        "vehicle_description": "White SUV",
        "vehicle_type": "suv",
        "vehicle_color": "white",
        "reason": "Reported stolen from Central Mall Parking 2 hours ago",
        "category": "Stolen Vehicle",
        "priority": "HIGH",
        "severity": "HIGH",
        "status": "ACTIVE",
        "notes": "Stolen vehicle report filed by owner.",
        "is_active": True,
    },
    {
        "target_name": "Habitual Traffic Violator",
        "plate_number": "MH12DE4567",
        "license_plate": "MH12DE4567",
        "vehicle_description": "Blue Sedan",
        "vehicle_type": "car",
        "vehicle_color": "blue",
        "reason": "Multiple reckless driving & over-speeding infractions",
        "category": "Traffic Violation",
        "priority": "MEDIUM",
        "severity": "MEDIUM",
        "status": "ACTIVE",
        "notes": "Issue citation upon checkpoint interception.",
        "is_active": True,
    },
]


def seed_default_watchlist_if_empty(db: Session):
    """
    Seeds local representative watchlist targets into database if watchlist table is empty.
    Guarantees representative watchlist data for hackathons without external government access.
    """
    try:
        count = db.query(WatchlistItem).count()
        if count == 0:
            for item in DEFAULT_WATCHLIST_TARGETS:
                db_item = WatchlistItem(**item)
                db.add(db_item)
            db.commit()
            print(f"[Watchlist] Seeded {len(DEFAULT_WATCHLIST_TARGETS)} representative watchlist targets.")
    except Exception as e:
        print(f"[Watchlist Seed Error]: {e}")
        db.rollback()


class AlertEngine:
    """
    Module 6: Watchlist Correlation & Real-Time Alert Engine.
    Executes automated rule evaluation against local watchlist database:
      Detection -> ANPR -> Vehicle DNA -> Watchlist Search -> Match?
      - NO: Store detection log
      - YES: Generate Alert record + Store Evidence paths + WebSocket Dashboard Broadcast
    """

    def evaluate_detection(
        self,
        detection_data: Dict[str, Any],
        db: Session
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluates a vehicle detection against active Watchlist database records.
        If a match is found, creates an Alert database record and broadcasts it over WebSockets.
        """
        # Ensure watchlist seeded
        seed_default_watchlist_if_empty(db)

        plate = (detection_data.get("plate_number") or detection_data.get("raw_ocr_text") or "").strip().upper()
        if not plate:
            return None

        # Search active watchlist targets
        active_watchlist = (
            db.query(WatchlistItem)
            .filter(WatchlistItem.is_active == True)
            .all()
        )

        matched_target = None
        for item in active_watchlist:
            target_plate = (item.plate_number or item.license_plate or "").strip().upper()
            if not target_plate:
                continue
            
            # Exact match or wildcard / edit match
            if target_plate == plate or (len(plate) >= 4 and plate in target_plate) or (len(target_plate) >= 4 and target_plate in plate):
                matched_target = item
                break

        if not matched_target:
            return None

        cam_id = detection_data.get("camera_id") or 1

        # IDEMPOTENT DEDUPLICATION: Check if recent alert exists for same plate and camera
        recent_cutoff_utc = datetime.utcnow() - timedelta(minutes=5)
        recent_cutoff_local = datetime.now() - timedelta(minutes=5)
        recent_alert = (
            db.query(Alert)
            .filter(
                Alert.plate == plate,
                Alert.camera_id == cam_id,
                or_(
                    Alert.created_at >= recent_cutoff_utc,
                    Alert.created_at >= recent_cutoff_local
                )
            )
            .order_by(Alert.id.desc())
            .first()
        )
        if recent_alert:
            return {
                "id": recent_alert.id,
                "alert_id": recent_alert.alert_id,
                "title": recent_alert.title,
                "alert_type": recent_alert.alert_type,
                "priority": recent_alert.priority,
                "severity": recent_alert.priority,
                "message": recent_alert.message,
                "vehicle": recent_alert.vehicle,
                "plate": recent_alert.plate,
                "license_plate": recent_alert.plate,
                "camera_id": recent_alert.camera_id,
                "camera_name": recent_alert.camera_name,
                "location": recent_alert.location,
                "latitude": recent_alert.latitude,
                "longitude": recent_alert.longitude,
                "confidence": recent_alert.confidence,
                "evidence_image": recent_alert.evidence_image,
                "snapshot_url": recent_alert.snapshot_url,
                "plate_crop_url": recent_alert.plate_crop_url,
                "dna_id": recent_alert.dna_id,
                "is_acknowledged": False,
                "timestamp": recent_alert.created_at.isoformat() if recent_alert.created_at else datetime.now().isoformat(),
                "created_at": recent_alert.created_at.isoformat() if recent_alert.created_at else datetime.now().isoformat()
            }

        # MATCH FOUND! Generate Alert Data Structure
        cam_obj = db.query(Camera).filter(Camera.id == cam_id).first()
        cam_name = cam_obj.camera_name if cam_obj else f"CCTV Camera #{cam_id}"
        loc_name = cam_obj.location_name if cam_obj else "City Perimeter Checkpoint"
        lat = cam_obj.latitude if cam_obj else detection_data.get("latitude") or 28.6139
        lon = cam_obj.longitude if cam_obj else detection_data.get("longitude") or 77.2090

        priority = matched_target.priority or matched_target.severity or "HIGH"
        priority = priority.upper()
        if priority not in ["CRITICAL", "HIGH", "MEDIUM"]:
            priority = "HIGH"

        v_type = detection_data.get("vehicle_type") or matched_target.vehicle_type or "vehicle"
        v_color = detection_data.get("color") or matched_target.vehicle_color or ""
        v_desc = f"{v_color} {v_type}".strip().title()

        snapshot_url = detection_data.get("snapshot_url") or "/uploads/snapshots/snap_demo_bus.jpg"
        plate_crop_url = detection_data.get("plate_crop_url") or "/uploads/plate_crops/plate_demo_bus.jpg"
        confidence = round(float(detection_data.get("plate_confidence") or detection_data.get("confidence") or 0.92), 3)

        uid = f"ALT-{uuid.uuid4().hex[:8].upper()}"

        alert_record = Alert(
            alert_id=uid,
            title=f"WATCHLIST HIT: {matched_target.category or 'Wanted Vehicle'} Intercepted",
            alert_type="WATCHLIST_MATCH",
            priority=priority,
            severity=priority,
            message=f"{priority} ALERT: {v_desc} (Plate: {plate}) detected at {cam_name} [{loc_name}]. Reason: {matched_target.reason or matched_target.notes or 'Monitored Target'}.",
            vehicle=v_desc,
            plate=plate,
            license_plate=plate,
            camera_id=cam_id,
            camera_name=cam_name,
            location=loc_name,
            latitude=lat,
            longitude=lon,
            confidence=confidence,
            evidence_image=snapshot_url,
            snapshot_url=snapshot_url,
            plate_crop_url=plate_crop_url,
            dna_id=detection_data.get("dna_id") or f"DNA-{plate}",
            is_acknowledged=False
        )

        db.add(alert_record)
        db.commit()
        db.refresh(alert_record)

        alert_payload = {
            "id": alert_record.id,
            "alert_id": alert_record.alert_id,
            "title": alert_record.title,
            "alert_type": alert_record.alert_type,
            "priority": alert_record.priority,
            "severity": alert_record.priority,
            "message": alert_record.message,
            "vehicle": alert_record.vehicle,
            "plate": alert_record.plate,
            "license_plate": alert_record.plate,
            "camera_id": alert_record.camera_id,
            "camera_name": alert_record.camera_name,
            "location": alert_record.location,
            "latitude": alert_record.latitude,
            "longitude": alert_record.longitude,
            "confidence": alert_record.confidence,
            "confidence_pct": f"{int(alert_record.confidence * 100)}%",
            "evidence_image": alert_record.evidence_image,
            "snapshot_url": alert_record.snapshot_url,
            "plate_crop_url": alert_record.plate_crop_url,
            "dna_id": alert_record.dna_id,
            "is_acknowledged": False,
            "timestamp": alert_record.created_at.isoformat() if alert_record.created_at else datetime.now().isoformat(),
            "created_at": alert_record.created_at.isoformat() if alert_record.created_at else datetime.now().isoformat()
        }

        # Asynchronously broadcast to WebSockets & Publish to MQTT Event Bus
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(alert_ws_manager.broadcast(alert_payload))
        except Exception:
            pass

        try:
            from app.services.mqtt_pipeline import mqtt_pipeline
            mqtt_pipeline.publish_event("sentinelfusion/events/alerts", alert_payload)
        except Exception:
            pass

        print(f"[Alert Engine] Generated {priority} Alert #{alert_record.id} for Watchlist Hit: {plate}")
        return alert_payload


# Singleton instance
alert_engine = AlertEngine()
