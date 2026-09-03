import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Camera,
  Navigation,
  Clock,
  Layers,
  Maximize2,
  ShieldCheck,
  Zap,
  Info,
  CheckCircle2,
  FileText
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const resolveUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

export const GISRouteMap = ({
  cameras = [],
  journey = null,
  selectedStopIndex = null,
  onSelectStop = null
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);
  const [showAllCameras, setShowAllCameras] = useState(true);
  const [showRouteLine, setShowRouteLine] = useState(true);
  const [activePreviewImage, setActivePreviewImage] = useState(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const L = window.L;
    if (!L) {
      console.error('Leaflet script window.L not loaded.');
      return;
    }

    // Default center (New Delhi / India default coordinates)
    const initialLat = 28.6139;
    const initialLng = 77.2090;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: false
    });

    // Add Dark/Cyan themed OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add zoom control top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Polyline Route when cameras or journey prop changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    const L = window.L;

    if (!map || !layersGroup || !L) return;

    layersGroup.clearLayers();

    const boundsPoints = [];

    // 1. Plot All Registered Cameras Layer
    if (showAllCameras && Array.isArray(cameras)) {
      cameras.forEach((cam) => {
        const lat = parseFloat(cam.latitude || 28.6139);
        const lng = parseFloat(cam.longitude || 77.2090);
        boundsPoints.push([lat, lng]);

        const cameraHtml = `
          <div style="
            background: #0284c7;
            color: #ffffff;
            border: 2px solid #38bdf8;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px rgba(56,189,248,0.5);
            font-size: 12px;
          ">
            📷
          </div>
        `;

        const icon = L.divIcon({
          html: cameraHtml,
          className: 'custom-camera-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const popupContent = `
          <div style="font-family: monospace; font-size: 12px; color: #0f172a; padding: 4px;">
            <div style="font-weight: bold; color: #0284c7; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 4px;">
              📷 ${cam.camera_name || `Camera #${cam.id}`}
            </div>
            <div><strong>Department:</strong> ${cam.department || 'Surveillance'}</div>
            <div><strong>Location:</strong> ${cam.location_name || 'City Checkpoint'}</div>
            <div><strong>GPS:</strong> [${lat.toFixed(4)}, ${lng.toFixed(4)}]</div>
            <div style="margin-top: 4px; color: #16a34a; font-weight: bold;">● Status: ${cam.status || 'ACTIVE'}</div>
          </div>
        `;

        const marker = L.marker([lat, lng], { icon }).bindPopup(popupContent);
        layersGroup.addLayer(marker);
      });
    }

    // 2. Plot Vehicle Observed CCTV Journey Trajectory Route Layer
    if (journey && Array.isArray(journey.timeline) && journey.timeline.length > 0) {
      const journeyPoints = journey.timeline.map((stop) => [
        parseFloat(stop.latitude),
        parseFloat(stop.longitude)
      ]);

      // Add points to bounds
      journeyPoints.forEach((pt) => boundsPoints.push(pt));

      // Draw Polyline for Observed CCTV Journey
      if (showRouteLine && journeyPoints.length >= 2) {
        const polyline = L.polyline(journeyPoints, {
          color: '#f43f5e',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8'
        });
        layersGroup.addLayer(polyline);
      }

      // Plot Numbered Journey Stops (1, 2, 3...)
      journey.timeline.forEach((stop, idx) => {
        const lat = parseFloat(stop.latitude);
        const lng = parseFloat(stop.longitude);
        const isSelected = selectedStopIndex === idx;

        const isCritical = stop.match_level === 'Confirmed Match';
        const isHigh = stop.match_level === 'High Confidence Match';
        const badgeBg = isCritical ? '#f43f5e' : isHigh ? '#f59e0b' : '#06b6d4';

        const stopHtml = `
          <div style="
            background: ${badgeBg};
            color: #ffffff;
            border: 2px solid ${isSelected ? '#ffffff' : '#0f172a'};
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-family: monospace;
            font-size: 13px;
            box-shadow: 0 0 15px ${badgeBg};
            transform: ${isSelected ? 'scale(1.25)' : 'scale(1.0)'};
            transition: transform 0.2s;
          ">
            ${idx + 1}
          </div>
        `;

        const stopIcon = L.divIcon({
          html: stopHtml,
          className: 'journey-stop-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const snapshot = resolveUrl(stop.evidence_images?.snapshot_url) || '/uploads/sample_market_cctv.mp4';
        const crop = resolveUrl(stop.evidence_images?.plate_crop_url) || '/uploads/plate_crops/sample_crop.jpg';

        const popupContent = `
          <div style="font-family: monospace; font-size: 11px; color: #0f172a; max-width: 240px;">
            <div style="background: #0f172a; color: #ffffff; padding: 6px 8px; border-radius: 6px; margin-bottom: 6px;">
              <strong style="color: #38bdf8;">Stop #${idx + 1}: ${stop.camera_name}</strong>
              <div style="font-size: 10px; color: #94a3b8;">${stop.department || 'Surveillance'}</div>
            </div>

            <div style="margin-bottom: 4px;">
              <strong>Time:</strong> ${stop.timestamp}
            </div>

            <div style="margin-bottom: 6px;">
              <strong>Match Level:</strong> 
              <span style="background: ${badgeBg}; color: white; padding: 1px 6px; border-radius: 4px; font-weight: bold;">
                ${stop.match_level} (${stop.match_confidence_pct})
              </span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 6px;">
              <div>
                <span style="font-size: 9px; color: #64748b; font-weight: bold;">CCTV SNAPSHOT</span>
                <img src="${snapshot}" style="width: 100%; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;" />
              </div>
              <div>
                <span style="font-size: 9px; color: #64748b; font-weight: bold;">PLATE CROP</span>
                <img src="${crop}" style="width: 100%; height: 60px; object-fit: contain; background: #000; border-radius: 4px; border: 1px solid #cbd5e1;" />
              </div>
            </div>
          </div>
        `;

        const marker = L.marker([lat, lng], { icon: stopIcon }).bindPopup(popupContent);

        marker.on('click', () => {
          if (onSelectStop) onSelectStop(idx);
        });

        layersGroup.addLayer(marker);
      });
    }

    // Auto-fit bounds
    if (boundsPoints.length > 0) {
      try {
        map.fitBounds(boundsPoints, { padding: [50, 50], maxZoom: 15 });
      } catch (e) {
        // invalid bounds
      }
    }
  }, [cameras, journey, selectedStopIndex, showAllCameras, showRouteLine]);

  // Zoom to Fit Journey handler
  const handleZoomToFit = () => {
    const map = mapInstanceRef.current;
    if (!map || !journey || !Array.isArray(journey.timeline)) return;

    const points = journey.timeline.map((stop) => [
      parseFloat(stop.latitude),
      parseFloat(stop.longitude)
    ]);
    if (points.length > 0) {
      map.fitBounds(points, { padding: [50, 50] });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Telemetry Header with Non-GPS Label */}
      <div className="tactical-card rounded-2xl p-4 border border-police-700/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white font-mono tracking-wider">
                GIS Route Intelligence
              </h3>

              {/* MANDATORY Label: "Observed CCTV Journey" */}
              <span className="px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold tracking-wider uppercase animate-pulse">
                Observed CCTV Journey
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Observed movement connecting registered camera locations (Not continuous or exact GPS).
            </p>
          </div>
        </div>

        {/* Map Control Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setShowAllCameras((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              showAllCameras
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-police-950 text-slate-400 border-police-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{showAllCameras ? 'Hide All Cameras' : 'Show All Cameras'}</span>
          </button>

          <button
            onClick={() => setShowRouteLine((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              showRouteLine
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-police-950 text-slate-400 border-police-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showRouteLine ? 'Hide Route Line' : 'Show Route Line'}</span>
          </button>

          {journey && (
            <button
              onClick={handleZoomToFit}
              className="px-3 py-1.5 bg-police-800 hover:bg-police-700 text-cyan-300 rounded-xl border border-police-700 font-bold transition-all flex items-center gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Zoom to Fit</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Leaflet Map Box */}
      <div className="relative rounded-2xl overflow-hidden border border-police-700/80 shadow-2xl bg-police-950 min-h-[460px]">
        {/* Leaflet Map Container */}
        <div ref={mapContainerRef} className="w-full h-[460px] z-10" />

        {/* Floating Non-GPS Disclaimer & Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 tactical-card rounded-xl p-3 border border-police-800 bg-police-950/90 text-xs font-mono max-w-sm space-y-2 backdrop-blur-md">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <Info className="w-4 h-4 shrink-0" />
            <span>CCTV TRAJECTORY DISCLAIMER</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">
            Trajectory represents sequential camera sightings. Inter-camera movement paths are estimated via Haversine distance and spatial correlation.
          </p>

          <div className="pt-2 border-t border-police-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> All Cameras
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Vehicle Sighting
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-rose-500 border-dashed border-rose-500 inline-block" /> Route
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GISRouteMap;
