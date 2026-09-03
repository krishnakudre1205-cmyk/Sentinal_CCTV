# SentinelFusion AI — Hackathon Demonstration Guide

Welcome to the **SentinelFusion AI** Law Enforcement Command Center demonstration guide. This document provides step-by-step instructions for conducting an end-to-end hackathon presentation of the platform.

---

## 🚀 Quick Launch Instructions

### Option A: Running via Docker Compose (Recommended)
```bash
# 1. Clone repository & navigate to root directory
cd GJ_P

# 2. Build and start all 4 containerized services (Frontend, Backend, Postgres, MQTT)
docker compose up --build
```
- **Police Command Dashboard UI**: `http://localhost:5173` (or `http://localhost:80`)
- **FastAPI Backend Swagger Docs**: `http://localhost:8000/docs`
- **WebSocket Live Stream**: `ws://localhost:8000/ws/alerts`

### Option B: Local Python Development Execution
```bash
# Backend startup
cd backend
python run.py

# Frontend startup (in separate terminal)
cd frontend
npm run dev
```

---

## 🎬 9-Step Hackathon Demonstration Scenario Script

Follow this sequential walkthrough during your live presentation:

### Step 1: System Overview & Home Dashboard Metrics
1. Open `http://localhost:5173` to display the **Police Command Center** Home Dashboard.
2. Highlight the 5 core **Home Dashboard KPI Metrics**:
   - **Total Cameras**: 5 registered feed nodes
   - **Active Cameras**: 4 live streaming feeds
   - **Vehicles Detected Today**: Multi-signal vehicle ANPR entries
   - **Active Alerts**: Unacknowledged law enforcement dispatches
   - **Watchlist Matches**: Active stolen & suspect vehicle targets

### Step 2: Camera Registry Management across Departments (Module 1)
1. Click **Camera Management** in the left sidebar navigation.
2. Demonstrate multi-department CCTV node registration:
   - `Sector 4 North Toll Plaza Cam-01` (**Police Department**)
   - `RTO High-Speed Expressway Checkpoint` (**RTO Department**)
   - `Central Municipal Market Square Feed` (**Municipal Department**)
   - `State Food Supply Godown Gate-2` (**Food & Civil Supplies Department**)
   - `Home Department High-Security Perimeter` (**Home Department**)
3. Click **"Test Stream"** on any camera card to launch live video modal playback.

### Step 3: Live Video Processing & YOLOv8 Detection (Modules 2 & 3)
1. Click **Live Video Processing** in the left sidebar navigation.
2. Click **"Run AI Pipeline on Selected Camera"**.
3. Point out real-time AI bounding boxes color-coded by class:
   - 🔵 **Vehicles** (Car, Bus, Truck, Motorcycle)
   - 🟢 **Pedestrians**

### Step 4: License Plate OCR Extraction (ANPR Engine)
1. Observe number plate recognition (`GJ01AB1234`) extracted via EasyOCR.
2. Note confidence score percentage (e.g. `96.4% OCR Confidence`) and cropped license plate image ROI.

### Step 5: Persistent Vehicle DNA Vector Engine (Module 4)
1. Click **Vehicle Search** in the sidebar.
2. Select **Vehicle DNA Profiles** tab.
3. Explain the project's unique innovation: **Vehicle DNA**.
   - Show the 9-field DNA representation: License plate, Plate confidence, Vehicle type, Color, Visual appearance embedding (128-dim HSV histogram + spatial moments), Camera ID, Timestamp, Geographic location (Lat/Lon), Detection confidence.
   - Explain the 6-signal weighted similarity scoring system:
     $$\text{Score} = w_{\text{plate}} S_{\text{plate}} + w_{\text{vis}} S_{\text{vis}} + w_{\text{type}} S_{\text{type}} + w_{\text{color}} S_{\text{color}} + w_{\text{time}} S_{\text{time}} + w_{\text{loc}} S_{\text{loc}}$$

### Step 6: Cross-Camera Vehicle Tracking Journey (Module 5)
1. In **Vehicle Search**, enter plate `GJ01AB1234` and select **Cross-Camera Journey**.
2. Point out multi-camera trajectory stops reconstructed across cameras.
3. Explain match level classification:
   - 🔴 **Confirmed Match** ($\ge 85\%$)
   - 🟠 **High Confidence Match** ($65\% - 84\%$)
   - 🔵 **Possible Match** ($40\% - 64\%$)
4. Point out speed validation ($v \le 180 \text{ km/h}$) and time continuity checks.

### Step 7: GIS Route Intelligence Leaflet Trajectory Map (Module 7)
1. Observe the embedded **GIS Route Map** rendered with Leaflet & OpenStreetMap.
2. Highlight camera markers across the city and dashed polyline connections.
3. Click any numbered stop marker (1, 2, 3...) to inspect popup evidence snapshots and plate crops.
4. Point out the mandatory non-GPS label: **"Observed CCTV Journey"** (*Observed camera-to-camera movement; not exact GPS*).

### Step 8: Watchlist & Live WebSocket Alert Dispatch (Module 6)
1. Click **Real-Time Alerts** in the sidebar.
2. Show the 🟢 **WS LIVE STREAM** connection indicator pill.
3. Click **"Simulate Stolen Hit (GJ01AB1234)"**.
4. Observe instantaneous live alert card creation via WebSockets with priority badge:
   - 🔴 **CRITICAL PRIORITY: WATCHLIST HIT: Stolen Commercial Bus Intercepted**
5. Click **"Acknowledge Alert"** to demonstrate police officer dispatch logging.

### Step 9: Global Command Search
1. Click the top-bar **Global Command Search** input.
2. Type `GJ01AB1234` or `Toll Plaza` or `Stolen`.
3. Select any result from the instant dropdown overlay to demonstrate 1-click navigation across the command center.

---

## 🛡️ Hackathon Judge Q&A Cheatsheet

- **Q: Does SentinelFusion AI require paid external map or cloud AI APIs?**
  - **A:** No. SentinelFusion AI uses 100% open-source technologies: Leaflet & OpenStreetMap for GIS, YOLOv8 + EasyOCR for local AI detection, FastAPI for backend, and React for frontend.
- **Q: How does Vehicle DNA work if license plates are obscured?**
  - **A:** The `VehicleDNAService` correlates visual appearance embeddings, vehicle type, color histogram, time continuity, and location feasibility to match vehicles even when plates are missing or partially covered.
- **Q: Is the GIS map continuous real-time GPS tracking?**
  - **A:** No. As explicitly labeled on the map (**Observed CCTV Journey**), trajectories represent observed movement between fixed camera locations.
