import React from 'react';
import { 
  Video, 
  Radio, 
  MapPin, 
  Play, 
  PlusCircle, 
  Activity, 
  AlertCircle,
  Eye,
  Settings2
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export const CameraGrid = ({ cameras = [], onRegisterCamera }) => {
  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            CCTV Video Ingestion & Stream Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Heterogeneous RTSP Cameras, Traffic Junction Sensors, and Video File Pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 bg-police-950/80 px-3 py-1.5 rounded-lg border border-police-800">
            Total Feeds: <span className="text-cyan-400 font-bold">{cameras.length}</span>
          </span>
        </div>
      </div>

      {/* Camera Feeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
        {cameras.map((cam) => (
          <div
            key={cam.id}
            className="tactical-card rounded-xl overflow-hidden border border-police-700/60 flex flex-col group hover:border-cyan-500/50 transition-all duration-200"
          >
            {/* Video Viewport / Radar Canvas Placeholder */}
            <div className="relative aspect-video bg-police-950/90 border-b border-police-800 flex items-center justify-center overflow-hidden">
              {/* Tactical Radar Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2d4f15_1px,transparent_1px),linear-gradient(to_bottom,#1b2d4f15_1px,transparent_1px)] bg-[size:24px_24px]" />
              
              {/* Radar Scanner Line */}
              {cam.is_active && <div className="radar-sweep" />}

              {/* Viewport Overlay Info */}
              <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                <span className="px-2 py-0.5 rounded bg-police-950/90 text-cyan-400 font-mono text-[10px] font-bold border border-police-700">
                  CAM-{String(cam.id).padStart(2, '0')}
                </span>
                <span className="px-2 py-0.5 rounded bg-police-950/90 text-slate-300 font-mono text-[10px] border border-police-700">
                  {cam.resolution} @ {cam.fps} FPS
                </span>
              </div>

              <div className="absolute top-3 right-3 z-10">
                <StatusBadge 
                  status={cam.is_active ? 'LIVE FEED' : 'STANDBY'} 
                  variant={cam.is_active ? 'online' : 'offline'} 
                  size="xs" 
                />
              </div>

              {/* Center Stream Mock Animation */}
              <div className="relative z-0 text-center p-6 space-y-2">
                <div className="w-14 h-14 rounded-full bg-police-900/90 border border-police-700/80 flex items-center justify-center mx-auto text-cyan-400/80 shadow-[0_0_20px_rgba(0,210,255,0.1)] group-hover:scale-110 transition-transform">
                  <Radio className={`w-6 h-6 ${cam.is_active ? 'animate-pulse text-cyan-400' : 'text-slate-600'}`} />
                </div>
                <div>
                  <p className="text-xs font-mono text-slate-300 font-medium">
                    {cam.source_type.toUpperCase()} Stream Ingestion
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 truncate max-w-xs mx-auto">
                    {cam.stream_url}
                  </p>
                </div>
              </div>

              {/* Bottom Stream Telemetry Bar */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-police-950/80 px-2.5 py-1 rounded border border-police-800/80">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  AI Tracking: Standby (Mod 2)
                </span>
                <span className="text-cyan-400">ByteTrack Buffer: OK</span>
              </div>
            </div>

            {/* Camera Details Footer */}
            <div className="p-4 bg-police-900/70 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-sm font-bold text-white font-sans group-hover:text-cyan-300 transition-colors">
                  {cam.name}
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {cam.location_name} ({cam.latitude?.toFixed(4)}, {cam.longitude?.toFixed(4)})
                </p>
              </div>

              <div className="pt-2 border-t border-police-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-[11px] text-slate-500">
                  Protocol: {cam.source_type}
                </span>
                <button 
                  className="px-2.5 py-1 rounded bg-police-800 hover:bg-police-700 text-cyan-300 text-[11px] border border-police-700 flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  Stream Intel
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CameraGrid;
