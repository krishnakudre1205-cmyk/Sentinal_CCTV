import React from 'react';
import { 
  X, 
  Video, 
  Radio, 
  MapPin, 
  Building2, 
  Activity, 
  Clock, 
  Layers, 
  Compass,
  CheckCircle2
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const CameraStreamModal = ({ camera, isOpen, onClose }) => {
  if (!isOpen || !camera) return null;

  const isFile = camera.source_type === 'FILE';
  const videoSrc = isFile && camera.source_url.startsWith('/uploads/')
    ? `${API_BASE_URL}${camera.source_url}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="tactical-card w-full max-w-3xl rounded-2xl border border-police-700 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-police-900 border-b border-police-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono">
                  {camera.camera_name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-police-800 text-cyan-300 border border-police-700">
                  ID: #{camera.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                {camera.department}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-police-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Screen / Stream Canvas */}
        <div className="relative aspect-video bg-police-950 flex items-center justify-center overflow-hidden border-b border-police-800">
          {/* Tactical Radar Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2d4f20_1px,transparent_1px),linear-gradient(to_bottom,#1b2d4f20_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Radar Sweep Line */}
          {camera.status === 'ACTIVE' && <div className="radar-sweep" />}

          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              autoPlay
              loop
              className="w-full h-full object-contain relative z-10"
            />
          ) : (
            <div className="text-center p-8 relative z-10 space-y-3">
              <div className="w-16 h-16 rounded-full bg-police-900/90 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_25px_rgba(0,210,255,0.2)]">
                <Radio className="w-8 h-8 animate-pulse text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-mono font-bold text-white uppercase">
                  {camera.source_type} Stream Ingestion Active
                </p>
                <p className="text-xs font-mono text-cyan-400/90 mt-1 max-w-md mx-auto truncate">
                  {camera.source_url}
                </p>
              </div>
              <p className="text-[11px] font-mono text-slate-500">
                Connected via {camera.source_type === 'RTSP' ? 'RTSPCameraAdapter' : 'FileCameraAdapter'}
              </p>
            </div>
          )}

          {/* Stream Overlay HUD */}
          <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
            <span className="px-2 py-0.5 rounded bg-police-950/90 text-cyan-300 font-mono text-[10px] font-bold border border-police-700">
              PROTOCOL: {camera.source_type}
            </span>
            <StatusBadge 
              status={camera.status} 
              variant={camera.status === 'ACTIVE' ? 'online' : 'offline'} 
              size="xs" 
            />
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-slate-300 bg-police-950/90 px-3 py-1.5 rounded-lg border border-police-800/80 z-20">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              {camera.location_name} ({camera.latitude?.toFixed(4)}, {camera.longitude?.toFixed(4)})
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Ingestion Buffer: Normal
            </span>
          </div>
        </div>

        {/* Telemetry Footer */}
        <div className="p-4 bg-police-900/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-police-950/80 border border-police-800">
            <span className="text-[10px] text-slate-400 uppercase">Department</span>
            <p className="font-bold text-white truncate mt-0.5">{camera.department}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-police-950/80 border border-police-800">
            <span className="text-[10px] text-slate-400 uppercase">Source Type</span>
            <p className="font-bold text-cyan-300 mt-0.5">{camera.source_type}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-police-950/80 border border-police-800">
            <span className="text-[10px] text-slate-400 uppercase">AI Pipeline (Mod 2)</span>
            <p className="font-bold text-emerald-400 mt-0.5">YOLO/ByteTrack Ready</p>
          </div>
          <div className="p-2.5 rounded-lg bg-police-950/80 border border-police-800">
            <span className="text-[10px] text-slate-400 uppercase">Registered</span>
            <p className="font-bold text-slate-300 mt-0.5">
              {camera.created_at ? new Date(camera.created_at).toLocaleDateString() : 'Live'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraStreamModal;
