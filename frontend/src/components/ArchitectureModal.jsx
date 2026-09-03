import React from 'react';
import { 
  Layers, 
  Video, 
  Cpu, 
  Scan, 
  Dna, 
  Radio, 
  Server, 
  Database, 
  ShieldAlert, 
  LayoutDashboard,
  CheckCircle,
  Clock
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export const ArchitectureView = () => {
  const pipelineSteps = [
    {
      id: 1,
      title: 'CCTV / Video Sources',
      subtitle: 'RTSP Streams, Video Uploads, USB Cams',
      status: 'Implemented',
      statusVariant: 'success',
      module: 'Mod 0',
      icon: Video,
      description: 'Stream ingestion layer handling heterogeneous camera inputs and network feeds.',
    },
    {
      id: 2,
      title: 'Camera Adapter',
      subtitle: 'OpenCV & FFmpeg normalization',
      status: 'Service Interface',
      statusVariant: 'cyber',
      module: 'Mod 1',
      icon: Radio,
      description: 'Buffer manager, automatic stream reconnection, and multi-protocol decoding.',
    },
    {
      id: 3,
      title: 'Video Processing',
      subtitle: 'Temporal Subsampling & Frame Queue',
      status: 'Service Interface',
      statusVariant: 'cyber',
      module: 'Mod 1',
      icon: Cpu,
      description: 'Frame resizing, FPS throttling (5-10 FPS), and motion ROI cropping.',
    },
    {
      id: 4,
      title: 'AI Detection Engine',
      subtitle: 'YOLO + ByteTrack Tracking',
      status: 'Service Interface',
      statusVariant: 'cyber',
      module: 'Mod 2',
      icon: Scan,
      description: 'Vehicles, persons, object localization, and spatial trajectory persistence.',
    },
    {
      id: 5,
      title: 'ANPR Engine',
      subtitle: 'PaddleOCR / Tesseract Plate Extraction',
      status: 'Service Interface',
      statusVariant: 'cyber',
      module: 'Mod 3',
      icon: Scan,
      description: 'Plate deskewing, super-resolution, character OCR, and format validation.',
    },
    {
      id: 6,
      title: 'Vehicle DNA™ Engine',
      subtitle: 'Multi-Signal Fusion & Re-ID Vectors',
      status: 'Service Interface',
      statusVariant: 'cyber',
      module: 'Mod 4',
      icon: Dna,
      description: 'The core innovation: Persistent identity across cameras combining Plate + Color + Type + Embedding.',
    },
    {
      id: 7,
      title: 'MQTT Event Pipeline',
      subtitle: 'Mosquitto High-Throughput Bus',
      status: 'Service Interface',
      statusVariant: 'cyber',
      module: 'Mod 5',
      icon: Radio,
      description: 'Decoupled edge-to-cloud pub/sub message pipeline for real-time detections.',
    },
    {
      id: 8,
      title: 'Central FastAPI Backend',
      subtitle: 'REST API & State Coordinator',
      status: 'Active (Online)',
      statusVariant: 'success',
      module: 'Mod 0',
      icon: Server,
      description: 'High-performance async Python backend providing RESTful endpoints and service orchestration.',
    },
    {
      id: 9,
      title: 'Database Layer',
      subtitle: 'SQLAlchemy + SQLite / PostgreSQL',
      status: 'Active (Initialized)',
      statusVariant: 'success',
      module: 'Mod 0',
      icon: Database,
      description: 'Persistent schema for cameras, vehicle sightings, DNA profiles, watchlist targets, and alerts.',
    },
    {
      id: 10,
      title: 'Alert & Rule Engine',
      subtitle: 'Watchlist Matching & Dispatch',
      status: 'Service Interface',
      statusVariant: 'cyber',
      module: 'Mod 6',
      icon: ShieldAlert,
      description: 'High-speed correlation for stolen vehicles, wanted suspects, and abnormal trajectory flags.',
    },
    {
      id: 11,
      title: 'Police Command Dashboard',
      subtitle: 'React + Vite + Tailwind UI',
      status: 'Active (Online)',
      statusVariant: 'success',
      module: 'Mod 0',
      icon: LayoutDashboard,
      description: 'Tactical law enforcement command interface with real-time telemetry, search, and maps.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="tactical-card rounded-xl p-5 border border-police-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-sans">
              SentinelFusion AI End-to-End System Architecture
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Modular 11-Stage Pipeline with Clean Service Interfaces and 100% Free Open-Source Technology.
            </p>
          </div>
        </div>
      </div>

      <div className="relative border-l-2 border-police-700/60 ml-4 md:ml-6 space-y-6 pl-6">
        {pipelineSteps.map((step, idx) => {
          const Icon = step.icon;
          const isMod0 = step.module === 'Mod 0';

          return (
            <div key={step.id} className="relative group">
              {/* Timeline Node Point */}
              <div 
                className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  isMod0 
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_#34d399]' 
                    : 'bg-police-950 border-cyan-500/50 text-cyan-400'
                }`}
              >
                <span className="text-[10px] font-mono font-bold">{step.id}</span>
              </div>

              {/* Node Card */}
              <div 
                className={`tactical-card rounded-xl p-4 border transition-all ${
                  isMod0 
                    ? 'border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-400/50' 
                    : 'border-police-700/50 hover:border-cyan-500/40 bg-police-900/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-police-800 border border-police-700 text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                        {step.title}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-police-800 text-cyan-300 border border-police-700">
                          {step.module}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">{step.subtitle}</p>
                    </div>
                  </div>

                  <div>
                    <StatusBadge 
                      status={step.status} 
                      variant={step.statusVariant} 
                      size="xs" 
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-sans mt-3 pt-2.5 border-t border-police-800/60">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ArchitectureView;
