# SentinelFusion AI — Technical Architecture & System Specification

## Overview
**SentinelFusion AI** is a unified, multi-department CCTV intelligence and persistent Vehicle DNA tracking platform designed for law enforcement command centers and smart city surveillance networks.

---

## 🏗️ System Architecture Diagram

```
 +-------------------------------------------------------------------------------+
 |                              DASHBOARD UI LAYER                               |
 |   React 19 SPA • Vanilla CSS • Leaflet OpenStreetMap • WebSocket Stream Client |
 +--------------------------------──────┬----------------------------------------+
                                        | HTTP REST / WebSockets
                                        v
 +-------------------------------------------------------------------------------+
 |                              BACKEND CORE LAYER                               |
 |   FastAPI Application • Pydantic Schemas • Dependency Injection • Router APIs  |
 +-------┬------------------------------┬--------------------------------┬-------+
         |                              |                                |
         v                              v                                v
 +---------------+             +-----------------+             +------------------+
 |  DATABASE DB  |             |  ALERT ENGINE   |             |   EVENT LAYER    |
 | PostgreSQL 15 |             | Watchlist Hits  |             | MQTT Broker      |
 | SQLAlchemy    |             | Priority Matrix |             | Mosquitto        |
 +---------------+             +-----------------+             +------------------+
                                        ^
                                        | Vehicle DNA Vector
 +--------------------------------------+----------------------------------------+
 |                                  AI LAYER                                     |
 |  YOLOv8 Object Detection • EasyOCR ANPR Engine • HSV Visual Appearance Embedder|
 +--------------------------------------+----------------------------------------+
                                        ^ Frame Streams
 +--------------------------------------+----------------------------------------+
 |                               CAMERA LAYER                                    |
 |  Police • RTO • Municipal • Food & Civil Supplies • Home Dept CCTV Feeds      |
 +-------------------------------------------------------------------------------+
```

---

## 🧩 Detailed Architectural Layer Breakdown

### 1. Camera Layer (Ingestion & Registry)
- **Role**: Manages multi-department CCTV camera node registry and video feed ingestion.
- **Components**:
  - `Camera` model storing node metadata: `camera_name`, `department` (`Police`, `RTO`, `Municipal`, `Food & Civil Supplies`, `Home Dept`), `location_name`, `latitude`, `longitude`, `source_type` (`RTSP`, `MP4_FILE`), `source_url`, and `status`.
  - Ingestion pipeline supporting continuous RTSP video streams, uploaded MP4 files, and static test streams.

### 2. AI Layer (Detection, ANPR & DNA Extraction)
- **Role**: Performs real-time computer vision inference on CCTV video frames.
- **Components**:
  - **YOLOv8 Engine** (`AIDetectionEngine` in `ai_detector.py`): Performs multi-class object detection for vehicles (`car`, `bus`, `truck`, `motorcycle`) and pedestrians (`person`).
  - **EasyOCR ANPR Engine** (`ANPREngine` in `anpr_engine.py`): Extracts license plate text, raw OCR strings, character bounding boxes, and crop images.
  - **Lightweight Color & Visual Embedder** (`LightweightColorEmbedder` in `visual_embedder.py`): Computes 128-dimensional spatial HSV color histograms and visual appearance feature vectors.
  - **Vehicle DNA Vector Service** (`VehicleDNAService` in `vehicle_dna_service.py`): Generates persistent 9-field DNA vectors:
    $$\text{DNA} = \langle \text{Plate}, \text{PlateConf}, \text{Type}, \text{Color}, \text{VisualVector}, \text{CameraID}, \text{Timestamp}, \text{GeoLocation}, \text{DetectionConf} \rangle$$

### 3. Event Layer (Async Pub/Sub & Live Stream)
- **Role**: Asynchronous event decoupling and real-time dashboard notifications.
- **Components**:
  - **MQTT Broker** (Eclipse Mosquitto): Publishes frame-by-frame detection events on topic `sentinelfusion/events/detections`.
  - **WebSocket Connection Manager** (`AlertWebSocketManager` in `websocket_manager.py`): Maintains active WebSocket connections at `/ws/alerts` for instantaneous live alert dispatch.

### 4. Backend Core Layer (REST & Business Logic)
- **Role**: High-performance asynchronous API endpoints written in Python FastAPI.
- **Components**:
  - API Routers: `/api/cameras`, `/api/detection`, `/api/vehicles`, `/api/watchlist`, `/api/alerts`.
  - Pydantic validation schemas enforcing strict contract safety.

### 5. Database Layer (Persistence)
- **Role**: Relational data store for camera nodes, detections, DNA profiles, vehicle identities, watchlist targets, and alert logs.
- **Components**:
  - **ORM**: SQLAlchemy 2.0.
  - **RDBMS**: SQLite for zero-dependency local development; PostgreSQL 15 for production Docker deployments.

### 6. Alert Engine Layer (Watchlist Correlation)
- **Role**: Automated rule evaluation matching vehicle detections against police watchlist databases.
- **Components**:
  - Pipeline: $\text{Detection} \rightarrow \text{ANPR} \rightarrow \text{Vehicle DNA} \rightarrow \text{Watchlist Search} \rightarrow \text{Alert Generation}$.
  - Priority Classification: `CRITICAL` (Stolen / Felony), `HIGH` (Stolen / Amber), `MEDIUM` (Traffic Infractions).

### 7. Dashboard UI Layer (Police Command Center)
- **Role**: High-density law enforcement command interface.
- **Components**:
  - Built with React 19, Vanilla CSS, Tailwind, and Lucide Icons.
  - **GIS Engine**: 100% open-source Leaflet & OpenStreetMap rendering observed CCTV camera trajectories (**Observed CCTV Journey**).
  - Global Search Bar: Instant searching across plates, DNA IDs, cameras, departments, and dates.

---

## 📈 Scalability & Production Approach

1. **Edge Camera Inference**:
   - In production, YOLOv8 and EasyOCR run on edge processing units (e.g. NVIDIA Jetson or local NVR nodes), sending light JSON payloads over MQTT to reduce network bandwidth.
2. **Horizontal Scaling**:
   - FastAPI backend services scale horizontally behind Nginx load balancers.
3. **Database Indexing & Partitioning**:
   - `vehicle_detections` and `vehicle_identity` tables are indexed by `plate_number`, `dna_id`, `camera_id`, and `timestamp`.
