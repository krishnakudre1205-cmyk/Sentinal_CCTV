import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Radio,
  Dna,
  Check,
  Zap,
  Eye,
  Maximize2,
  Video,
  FileWarning,
  RefreshCw
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import apiService from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

const resolveUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

export const RealTimeAlertCenter = ({ alerts = [], onAcknowledge, onRefresh }) => {
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connected', 'connecting', 'disconnected'
  const [localAlerts, setLocalAlerts] = useState(alerts);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activePreviewImage, setActivePreviewImage] = useState(null);
  const wsRef = useRef(null);

  // Sync props alerts
  useEffect(() => {
    setLocalAlerts(alerts);
  }, [alerts]);

  // WebSocket Live Connection Listener
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(`${WS_BASE_URL}/ws/alerts`);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsStatus('connected');
          console.log('[WebSocket Alert Stream] Connected to command center feed.');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.alert_id) {
              setLocalAlerts((prev) => [data, ...prev.filter((a) => a.id !== data.id && a.alert_id !== data.alert_id)]);
            }
          } catch (e) {
            // Non-JSON message
          }
        };

        ws.onerror = () => {
          setWsStatus('disconnected');
        };

        ws.onclose = () => {
          setWsStatus('disconnected');
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };
      } catch (err) {
        setWsStatus('disconnected');
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Demo Simulation Trigger
  const handleSimulateStolenVehicle = async () => {
    setIsSimulating(true);
    try {
      const res = await apiService.simulateAlert('GJ01AB1234');
      if (res.success && res.data) {
        setLocalAlerts((prev) => [res.data, ...prev.filter((a) => a.id !== res.data.id)]);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Error running stolen vehicle simulation:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Filter alerts by priority
  const filteredAlerts = localAlerts.filter((alert) => {
    if (selectedPriority === 'ALL') return true;
    const prio = (alert.priority || alert.severity || 'HIGH').toUpperCase();
    return prio === selectedPriority;
  });

  const unackCount = localAlerts.filter((a) => !a.is_acknowledged).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="tactical-card rounded-2xl p-6 border border-police-700/60 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white font-mono tracking-wider">
                    Real-Time Watchlist & Alert Center
                  </h2>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    Module 6 Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Instantaneous alert dispatch triggered by ANPR watchlist hits and Vehicle DNA correlation.
                </p>
              </div>
            </div>
          </div>

          {/* WebSocket Status & Simulation Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live WS Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-police-950 border border-police-800 font-mono text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  wsStatus === 'connected'
                    ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse'
                    : 'bg-amber-400 animate-ping'
                }`}
              />
              <span className="text-slate-300 font-bold">
                {wsStatus === 'connected' ? 'WS LIVE STREAM' : 'RECONNECTING WS'}
              </span>
            </div>

            {/* Hackathon Stolen Vehicle Demo Trigger */}
            <button
              onClick={handleSimulateStolenVehicle}
              disabled={isSimulating}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center gap-2 disabled:opacity-50"
            >
              {isSimulating ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>Simulate Stolen Hit (GJ01AB1234)</span>
            </button>
          </div>
        </div>

        {/* Priority Filter Bar */}
        <div className="mt-4 pt-4 border-t border-police-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider">Priority Filter:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((prio) => (
              <button
                key={prio}
                onClick={() => setSelectedPriority(prio)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedPriority === prio
                    ? prio === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : prio === 'HIGH'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : prio === 'MEDIUM'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-700 text-white border border-slate-600'
                    : 'bg-police-950 text-slate-400 hover:text-white border border-police-800'
                }`}
              >
                {prio}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              Active Alerts: <strong className="text-rose-400">{unackCount} Unacknowledged</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Alert Feed Cards */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="tactical-card rounded-2xl p-12 text-center text-slate-500 border border-police-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-base font-bold text-white font-mono">No Active Alerts</p>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              All sectors clear. Click "Simulate Stolen Hit" above to test real-time alert dispatch.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const prio = (alert.priority || alert.severity || 'HIGH').toUpperCase();
            const isCritical = prio === 'CRITICAL';
            const isHigh = prio === 'HIGH';
            const isAcknowledged = alert.is_acknowledged;

            return (
              <div
                key={alert.id || alert.alert_id}
                className={`tactical-card rounded-2xl p-5 border transition-all relative overflow-hidden ${
                  isAcknowledged
                    ? 'border-police-800/80 bg-police-950/60 opacity-80'
                    : isCritical
                    ? 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.15)]'
                    : isHigh
                    ? 'border-amber-500/50 bg-amber-950/15'
                    : 'border-cyan-500/40 bg-cyan-950/10'
                }`}
              >
                {/* Left accent priority stripe */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isAcknowledged
                      ? 'bg-slate-700'
                      : isCritical
                      ? 'bg-rose-500'
                      : isHigh
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  }`}
                />

                <div className="pl-3 space-y-4">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-police-800">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Priority Badge */}
                        <span
                          className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-md uppercase border ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                              : isHigh
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          }`}
                        >
                          {prio} PRIORITY
                        </span>

                        <span className="font-mono text-xs font-bold text-white tracking-wide">
                          {alert.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans mt-1">{alert.message}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAcknowledged ? (
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          Ack: {alert.acknowledged_by || 'Officer Logged'}
                        </span>
                      ) : (
                        <button
                          onClick={() => onAcknowledge(alert.id)}
                          className="px-3.5 py-1.5 bg-police-800 hover:bg-police-700 text-xs font-mono font-bold text-cyan-300 hover:text-white rounded-xl border border-police-700 hover:border-cyan-500/50 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 text-cyan-400" />
                          Acknowledge Alert
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata & Evidence Image Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-mono">
                    {/* Telemetry metadata */}
                    <div className="md:col-span-7 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div className="p-2.5 rounded-xl bg-police-950/80 border border-police-800">
                          <span className="text-[10px] text-slate-500 uppercase block">Target Plate</span>
                          <span className="font-bold text-cyan-300 mt-0.5 block">{alert.plate || alert.license_plate || 'UNKNOWN'}</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-police-950/80 border border-police-800">
                          <span className="text-[10px] text-slate-500 uppercase block">Vehicle Info</span>
                          <span className="font-bold text-amber-300 mt-0.5 block">{alert.vehicle || 'Unknown Vehicle'}</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-police-950/80 border border-police-800">
                          <span className="text-[10px] text-slate-500 uppercase block">Confidence</span>
                          <span className="font-bold text-emerald-300 mt-0.5 block">{alert.confidence_pct || '95%'}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-police-950/90 border border-police-800 space-y-1.5">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-cyan-400" />
                            Source: <strong>{alert.camera_name || `Camera #${alert.camera_id || 1}`}</strong>
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : 'Just now'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            Location: {alert.location || 'North Checkpoint'}
                          </span>
                          <span>GPS: [{alert.latitude || 28.6139}, {alert.longitude || 77.2090}]</span>
                        </div>
                      </div>
                    </div>

                    {/* Evidence Image Snapshot Viewers */}
                    <div className="md:col-span-5 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Snapshot Evidence</span>
                        <div
                          onClick={() => setActivePreviewImage(resolveUrl(alert.snapshot_url || alert.evidence_image))}
                          className="aspect-video bg-police-950 rounded-xl overflow-hidden border border-police-700 relative group flex items-center justify-center cursor-pointer"
                        >
                          <img
                            src={resolveUrl(alert.snapshot_url || alert.evidence_image || '/uploads/sample_market_cctv.mp4')}
                            alt="Evidence Snapshot"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-police-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Plate Crop</span>
                        <div
                          onClick={() => setActivePreviewImage(resolveUrl(alert.plate_crop_url || '/uploads/plate_crops/sample_crop.jpg'))}
                          className="aspect-video bg-police-950 rounded-xl overflow-hidden border border-police-700 relative group flex items-center justify-center cursor-pointer"
                        >
                          <img
                            src={resolveUrl(alert.plate_crop_url || '/uploads/plate_crops/sample_crop.jpg')}
                            alt="Plate Crop"
                            className="w-full h-full object-contain p-1 bg-black group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-police-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Image Preview Modal */}
      {activePreviewImage && (
        <div
          onClick={() => setActivePreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-rose-500/50 shadow-2xl">
            <img src={activePreviewImage} alt="Enlarged Evidence" className="w-full h-full object-contain max-h-[80vh]" />
            <button
              onClick={() => setActivePreviewImage(null)}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-police-950 text-white text-xs font-mono font-bold border border-police-700"
            >
              Close [ESC]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeAlertCenter;
