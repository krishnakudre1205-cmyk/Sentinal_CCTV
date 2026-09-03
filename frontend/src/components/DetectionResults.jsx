import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scan, 
  Play, 
  Car, 
  Bike, 
  Bus, 
  Truck, 
  User, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Video, 
  Filter, 
  Search, 
  Layers, 
  Activity, 
  Radio, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Gauge
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import apiService from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const DetectionResults = ({ cameras = [] }) => {
  const [selectedCameraId, setSelectedCameraId] = useState(
    cameras.length > 0 ? cameras[0].id : 1
  );
  const [detectionData, setDetectionData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterClass, setFilterClass] = useState('ALL');
  const [timelineSearch, setTimelineSearch] = useState('');
  const [notification, setNotification] = useState(null);

  // Sync selected camera if cameras list updates and none selected
  useEffect(() => {
    if (cameras.length > 0 && !selectedCameraId) {
      setSelectedCameraId(cameras[0].id);
    }
  }, [cameras, selectedCameraId]);

  // Fetch detection results for selected camera
  const fetchResults = async (camId) => {
    if (!camId) return;
    try {
      const res = await apiService.getDetectionResults(camId);
      if (res.success) {
        setDetectionData(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch detection results:', err);
    }
  };

  useEffect(() => {
    if (selectedCameraId) {
      fetchResults(selectedCameraId);
    }
  }, [selectedCameraId]);

  // Trigger YOLO AI detection on selected camera video
  const handleStartDetection = async () => {
    if (!selectedCameraId) return;
    setIsProcessing(true);
    setNotification({ type: 'info', message: 'YOLO AI Engine started: Extracting frames & detecting objects...' });

    try {
      const res = await apiService.startDetection(selectedCameraId);
      if (res.success) {
        setDetectionData(res.data);
        setNotification({
          type: 'success',
          message: `Detection complete! ${res.data.total_detections} objects detected at ${res.data.fps_speed} FPS.`,
        });
      } else {
        setNotification({ type: 'error', message: res.error || 'Detection processing failed' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const selectedCam = cameras.find((c) => c.id === Number(selectedCameraId));

  // Filtered timeline detections
  const filteredDetections = useMemo(() => {
    if (!detectionData || !detectionData.detections) return [];

    return detectionData.detections.filter((det) => {
      const matchesClass =
        filterClass === 'ALL' ||
        (filterClass === 'VEHICLES' && ['car', 'motorcycle', 'bus', 'truck'].includes(det.object_type.toLowerCase())) ||
        (filterClass === 'PERSONS' && det.object_type.toLowerCase() === 'person') ||
        det.object_type.toUpperCase() === filterClass;

      const matchesSearch =
        timelineSearch === '' ||
        det.detection_id.toLowerCase().includes(timelineSearch.toLowerCase()) ||
        det.object_type.toLowerCase().includes(timelineSearch.toLowerCase());

      return matchesClass && matchesSearch;
    });
  }, [detectionData, filterClass, timelineSearch]);

  const getClassIcon = (objType) => {
    switch (objType.toLowerCase()) {
      case 'car':
        return <Car className="w-4 h-4 text-cyan-400" />;
      case 'motorcycle':
        return <Bike className="w-4 h-4 text-violet-400" />;
      case 'bus':
        return <Bus className="w-4 h-4 text-amber-400" />;
      case 'truck':
        return <Truck className="w-4 h-4 text-orange-400" />;
      case 'person':
        return <User className="w-4 h-4 text-emerald-400" />;
      default:
        return <Scan className="w-4 h-4 text-slate-400" />;
    }
  };

  const getClassPill = (objType) => {
    switch (objType.toLowerCase()) {
      case 'car':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'motorcycle':
        return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
      case 'bus':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'truck':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'person':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const videoSrc = detectionData?.annotated_video_url
    ? `${API_BASE_URL}${detectionData.annotated_video_url}`
    : selectedCam?.source_type === 'FILE' && selectedCam?.source_url?.startsWith('/uploads/')
    ? `${API_BASE_URL}${selectedCam.source_url}`
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Camera Control Bar */}
      <div className="tactical-card rounded-2xl p-6 border border-police-700/60 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
                <Scan className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
                  YOLO Vehicle & Person Detection Engine
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Module 2 Active
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time detection and bounding-box localization for Cars, Motorcycles, Buses, Trucks, and Persons.
                </p>
              </div>
            </div>
          </div>

          {/* Camera Selection & Launch Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-police-950/90 px-3 py-1.5 rounded-xl border border-police-700">
              <Video className="w-4 h-4 text-cyan-400" />
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(Number(e.target.value))}
                className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id} className="bg-police-900 text-white">
                    #{c.id} - {c.camera_name} ({c.department})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStartDetection}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold shadow-[0_0_20px_rgba(0,210,255,0.35)] transition-all flex items-center gap-2 disabled:opacity-50 group"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Video Frames...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white fill-white group-hover:scale-110 transition-transform" />
                  <span>Run YOLO AI Detection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Selected Camera Metadata Pill Bar */}
        {selectedCam && (
          <div className="mt-4 pt-3.5 border-t border-police-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
            <div className="flex items-center gap-4">
              <span>Department: <span className="text-cyan-300 font-semibold">{selectedCam.department}</span></span>
              <span>Source: <span className="text-slate-300">{selectedCam.source_type} ({selectedCam.source_url})</span></span>
              <span>Status: <span className="text-emerald-400 font-bold">{selectedCam.status}</span></span>
            </div>
            {detectionData && detectionData.status === 'COMPLETED' && (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Detection Complete • {detectionData.total_frames_processed} Frames Ingested</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-mono flex items-center gap-2.5 border transition-all animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
              : notification.type === 'info'
              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : notification.type === 'info' ? (
            <Sparkles className="w-4 h-4 shrink-0 text-cyan-400 animate-spin" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Object Counts & Performance Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* Cars */}
        <div className="tactical-card rounded-xl p-4 border border-police-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Cars</span>
            <Car className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white mt-2">
            {detectionData?.car_count ?? 0}
          </p>
          <span className="text-[10px] font-mono text-cyan-400 mt-1">Light Vehicles</span>
        </div>

        {/* Motorcycles */}
        <div className="tactical-card rounded-xl p-4 border border-police-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Motorcycles</span>
            <Bike className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white mt-2">
            {detectionData?.motorcycle_count ?? 0}
          </p>
          <span className="text-[10px] font-mono text-violet-400 mt-1">Two-Wheelers</span>
        </div>

        {/* Buses */}
        <div className="tactical-card rounded-xl p-4 border border-police-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Buses</span>
            <Bus className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white mt-2">
            {detectionData?.bus_count ?? 0}
          </p>
          <span className="text-[10px] font-mono text-amber-400 mt-1">Transit / Heavy</span>
        </div>

        {/* Trucks */}
        <div className="tactical-card rounded-xl p-4 border border-police-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Trucks</span>
            <Truck className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white mt-2">
            {detectionData?.truck_count ?? 0}
          </p>
          <span className="text-[10px] font-mono text-orange-400 mt-1">Commercial Freight</span>
        </div>

        {/* Persons */}
        <div className="tactical-card rounded-xl p-4 border border-police-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Persons</span>
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white mt-2">
            {detectionData?.person_count ?? 0}
          </p>
          <span className="text-[10px] font-mono text-emerald-400 mt-1">Pedestrians</span>
        </div>

        {/* Total Detections */}
        <div className="tactical-card rounded-xl p-4 border border-cyan-500/40 bg-cyan-950/20 flex flex-col justify-between shadow-[0_0_15px_rgba(0,210,255,0.1)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-cyan-300 uppercase font-bold">Total Detections</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-cyan-200 mt-2">
            {detectionData?.total_detections ?? 0}
          </p>
          <span className="text-[10px] font-mono text-cyan-400 mt-1">
            {detectionData?.total_vehicles ?? 0} Vehicles
          </span>
        </div>

        {/* Processing Speed FPS */}
        <div className="tactical-card rounded-xl p-4 border border-emerald-500/40 bg-emerald-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-emerald-300 uppercase font-bold">Inference Speed</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-emerald-300 mt-2">
            {detectionData?.fps_speed ? `${detectionData.fps_speed}` : '—'} <span className="text-xs font-normal">FPS</span>
          </p>
          <span className="text-[10px] font-mono text-slate-400 mt-1">
            {detectionData?.processing_time_secs ? `${detectionData.processing_time_secs}s runtime` : 'Ready'}
          </span>
        </div>
      </div>

      {/* Main Two-Column View: Processed Video Viewport & Detection Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Processed Video Screen with HUD Overlays */}
        <div className="xl:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              Processed Video Stream & Bounding Box HUD
            </h3>
            {detectionData?.annotated_video_url && (
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                Annotated Video Active
              </span>
            )}
          </div>

          <div className="tactical-card rounded-2xl overflow-hidden border border-police-700/80">
            <div className="relative aspect-video bg-police-950 flex items-center justify-center overflow-hidden">
              {/* Radar scanner line when running */}
              {isProcessing && <div className="radar-sweep" />}

              {videoSrc ? (
                <video
                  key={videoSrc}
                  src={videoSrc}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain relative z-10"
                />
              ) : (
                <div className="text-center p-12 relative z-10 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-police-900/90 border border-police-700 flex items-center justify-center mx-auto text-cyan-400">
                    <Scan className="w-8 h-8 animate-pulse text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-mono font-bold text-white uppercase">
                      No Detection Run Logged Yet
                    </p>
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      Click "Run YOLO AI Detection" above to process this CCTV stream and render bounding boxes.
                    </p>
                  </div>
                </div>
              )}

              {/* Viewport Top Left Protocol Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-2 z-20 pointer-events-none">
                <span className="px-2 py-0.5 rounded bg-police-950/90 text-cyan-300 font-mono text-[10px] font-bold border border-police-700">
                  YOLOv8 + OPENCV
                </span>
                <StatusBadge
                  status={detectionData?.status || 'IDLE'}
                  variant={detectionData?.status === 'COMPLETED' ? 'online' : 'info'}
                  size="xs"
                />
              </div>
            </div>

            {/* Video Footer Telemetry */}
            <div className="p-4 bg-police-900/80 flex items-center justify-between text-xs font-mono border-t border-police-800">
              <div className="flex items-center gap-3 text-slate-400">
                <span>Total Detected: <strong className="text-white">{detectionData?.total_detections ?? 0}</strong></span>
                <span>•</span>
                <span>Vehicles: <strong className="text-cyan-300">{detectionData?.total_vehicles ?? 0}</strong></span>
                <span>•</span>
                <span>Persons: <strong className="text-emerald-300">{detectionData?.person_count ?? 0}</strong></span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Avg FPS: {detectionData?.fps_speed || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Detection Event Timeline Log */}
        <div className="xl:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Detection Event Timeline ({filteredDetections.length})
            </h3>
          </div>

          {/* Timeline Filter Controls */}
          <div className="tactical-card rounded-xl p-3 border border-police-700/60 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={timelineSearch}
                onChange={(e) => setTimelineSearch(e.target.value)}
                placeholder="Search detection ID or class..."
                className="w-full bg-police-950 border border-police-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Class Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              {['ALL', 'VEHICLES', 'PERSONS', 'CAR', 'MOTORCYCLE', 'BUS', 'TRUCK'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterClass(filter)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    filterClass === filter
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'bg-police-900 text-slate-400 hover:text-white border border-police-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Scrollable Container */}
          <div className="tactical-card rounded-2xl border border-police-700/70 p-3 max-h-[480px] overflow-y-auto space-y-2">
            {filteredDetections.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                No detections logged for current filters.
              </div>
            ) : (
              filteredDetections.map((det) => {
                const bbox = typeof det.bounding_box === 'string' ? JSON.parse(det.bounding_box) : det.bounding_box;
                return (
                  <div
                    key={det.id || det.detection_id}
                    className="p-3 rounded-xl bg-police-950/80 border border-police-800/90 hover:border-cyan-500/40 transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-police-900 border border-police-800 shrink-0 mt-0.5">
                        {getClassIcon(det.object_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.2 rounded font-mono text-[10px] uppercase font-bold border ${getClassPill(det.object_type)}`}>
                            {det.object_type}
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            {det.detection_id}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                          <span>Frame #{det.frame_number}</span>
                          <span>•</span>
                          <span>T: {det.video_timestamp_secs?.toFixed(1)}s</span>
                          <span>•</span>
                          <span className="text-slate-500">
                            BBox: [{bbox?.x1}, {bbox?.y1}, {bbox?.x2}, {bbox?.y2}]
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {Math.round(det.confidence * 100)}% Conf
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectionResults;
