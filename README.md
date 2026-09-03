# SentinelFusion AI
### Law Enforcement CCTV & Persistent Vehicle DNA Platform

![SentinelFusion AI Banner](https://img.shields.io/badge/System-SentinelFusion%20AI-00d2ff?style=for-the-badge&logo=shield&logoColor=white)
![Status: Production Ready](https://img.shields.io/badge/Status-Containerized%20%26%20Tested-10b981?style=for-the-badge)
![License: FOSS](https://img.shields.io/badge/License-MIT%20%2F%20FOSS-8b5cf6?style=for-the-badge)

---

## 📌 Project Overview & Problem Solved

**SentinelFusion AI** is an enterprise-grade, open-source AI intelligence platform built for law enforcement, traffic management, and smart city CCTV surveillance networks.

### The Problem
Traditional ANPR (Automatic Number Plate Recognition) systems rely solely on clear license plate text. They fail when:
- License plates are covered, muddy, broken, fake, or missing entirely.
- Criminals swap license plates between vehicles.
- CCTV video streams have low resolution, glares, or high motion blur.

### The SentinelFusion AI Solution
SentinelFusion AI introduces **Vehicle DNA™**, a multi-signal identity fusion engine that correlates vehicle sightings across multiple CCTV cameras even without readable license plates, reconstructing full inter-camera journey timelines.

---

## 🌟 Key Features

1. **Vehicle DNA™ Fusion Engine**
   Fuses vehicle classification (Sedan, SUV, Truck, Bus, Motorcycle), color chrominance histogram, metric Re-ID visual embeddings, license plate OCR, and spatiotemporal GIS constraints.

2. **YOLOv8 AI Detection Engine**
   High-precision real-time detection of vehicles, pedestrians, and traffic objects with custom visual overlays.

3. **7-Stage EasyOCR ANPR Pipeline**
   Aspect-ratio filtering, CLAHE contrast enhancement, bilateral filtering, OCR extraction, syntax normalization (e.g. Indian/International syntax disambiguation `O` $\rightarrow$ `0`, `I` $\rightarrow$ `1`), and wildcard plate search (`*`, `?`).

4. **Cross-Camera Journey Reconstruction**
   Tracks vehicle movement chronologically across heterogeneous CCTV nodes and plots interactive journey polylines.

5. **Distributed MQTT & WebSocket Alert Pipeline**
   Eclipse Mosquitto broker publishes real-time vehicle detection and watchlist alert events over MQTT (`sentinelfusion/events/detections`, `sentinelfusion/events/alerts`) with instant WebSocket push to the React Command Center UI.

6. **Interactive GIS / Leaflet Map**
   Real-time map rendering using OpenStreetMap and Leaflet JS showing camera locations, live alert markers, and vehicle transit paths.

7. **Law Enforcement Watchlist & Dispatch Alerts**
   Instant notifications on stolen/wanted vehicle matches with sound alerts, evidence snapshot popups, and confidence breakdown.

---

## 🛠️ Technology Stack (100% Open-Source FOSS)

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Vanilla CSS Design System, Lucide Icons, Leaflet / OpenStreetMap |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, Pydantic v2, uvicorn, asyncpg / psycopg2 |
| **AI / Computer Vision** | Ultralytics YOLOv8, OpenCV 4.13, PyTorch 2.1+, EasyOCR |
| **Messaging & Real-time** | Eclipse Mosquitto (MQTT 2.0), WebSockets (FastAPI WebSocket Manager) |
| **Database** | PostgreSQL 15 (Production) / SQLite (Zero-config local development) |
| **Orchestration** | Docker & Docker Compose |

---

## 🏗️ Architecture

```text
  [ CCTV Cameras / Video Streams ]
                │
                ▼
      [ FastAPI Backend Engine ]
        ├── YOLOv8 Vehicle & Person Detector
        ├── 7-Stage EasyOCR ANPR Pipeline
        └── Vehicle DNA Re-ID Feature Extractor
                │
        ┌───────┴───────┐
        ▼               ▼
 [ PostgreSQL DB ]   [ Mosquitto MQTT Broker ]
                        │
                        ▼
            [ WebSockets / FastAPI ]
                        │
                        ▼
      [ React 19 Command Center UI ]
```

---

## ⚡ Quickstart & Local Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ or Node.js 22+
- Docker Desktop (Optional, for containerized deployment)

### 1. Environment Configuration
Copy the example environment configuration:
```bash
cp backend/.env.example backend/.env
```

Key environment variables in `backend/.env`:
- `HOST`: Server host (Default: `127.0.0.1`)
- `PORT`: API port (Default: `8000`)
- `DATABASE_URL`: Database connection string (`sqlite:///./sentinelfusion.db` or `postgresql://postgres:postgres@localhost:5432/sentinelfusion`)
- `MQTT_BROKER_HOST`: Mosquitto broker address (`localhost` or `mqtt`)
- `MQTT_BROKER_PORT`: MQTT port (`1883`)

---

### 2. Local Backend Setup

```bash
cd backend

# Create virtual environment (optional)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI application
python run.py
```

- Backend API: `http://127.0.0.1:8000`
- Swagger Interactive Docs: `http://127.0.0.1:8000/docs`

---

### 3. Local Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```

- React Command Center UI: `http://localhost:5173`

---

## 🐳 Docker Deployment Instructions

The entire platform can be deployed via Docker Compose:

```bash
# Build and launch all services in detached mode
docker compose up -d --build
```

### Services Started:
- **`frontend`**: Nginx web server hosting React single-page app on `http://localhost:5173`
- **`backend`**: FastAPI AI processing engine on `http://localhost:8000`
- **`postgres`**: PostgreSQL 15 database on `localhost:5432`
- **`mqtt`**: Eclipse Mosquitto MQTT broker on `localhost:1883` and `localhost:9001` (WebSockets)

### Stopping Services:
```bash
docker compose down
```

---

## 🧪 Automated Test Verification

SentinelFusion AI includes automated integration test suites for core modules:

```bash
# Vehicle DNA Multi-Signal Fusion Test
python test_vehicle_dna.py

# Cross-Camera Tracking Test
python test_cross_camera_tracking.py

# Watchlist Matcher & Alert Engine Test
python test_module6_alerts.py

# GIS Route Reconstruction Test
python test_module7_gis_route.py

# Command Center Real-Time Integration Test
python test_module8_command_center.py

# Complete End-to-End System Test
python test_module10_end_to_end.py
```

---

## 🔒 Security & Environment Guidelines

- Never commit `.env` files, database secrets, or private keys to source control.
- Sample environment variables are documented in `backend/.env.example`.
- Pre-configured `.gitignore` excludes binary database files, video files, node modules, virtual environments, and AI model weight caches (`*.pt`).

---

## 📄 License

Distributed under the **MIT License**. Free for commercial, personal, and law enforcement research use.
