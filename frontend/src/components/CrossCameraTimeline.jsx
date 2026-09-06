import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Clock,
  Video,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Maximize2,
  ChevronRight,
  ArrowRight,
  Car,
  Activity,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import EvidenceImage from './EvidenceImage';
import { getMediaUrl } from '../services/api';

export const CrossCameraTimeline = ({ journeyData, isLoading }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [activePreviewImage, setActivePreviewImage] = useState(null);

  if (isLoading) {
    return (
      <div className="tactical-card rounded-2xl p-12 text-center border border-police-800 space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-mono text-cyan-300">Reconstructing Cross-Camera Vehicle Journey...</p>
        <p className="text-xs text-slate-500 font-mono">Running Vehicle DNA multi-signal correlation across CCTV nodes</p>
      </div>
    );
  }

  if (!journeyData || !journeyData.timeline || journeyData.timeline.length === 0) {
    return (
      <div className="tactical-card rounded-2xl p-10 text-center border border-police-800 space-y-3">
        <Compass className="w-10 h-10 text-slate-600 mx-auto" />
        <h4 className="text-base font-bold text-white font-mono">No Cross-Camera Journey Recorded</h4>
        <p className="text-xs text-slate-400 font-mono">
          Enter a license plate (e.g. <code className="text-cyan-300">GJ01AB1234</code>) or select a Vehicle DNA profile to reconstruct multi-camera sightings.
        </p>
      </div>
    );
  }

  const { plate_number, vehicle_type, color, total_camera_stops, match_summary, timeline } = journeyData;

  const renderBadge = (matchLevel) => {
    switch (matchLevel) {
      case 'Confirmed Match':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Confirmed Match
          </span>
        );
      case 'High Confidence Match':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,210,255,0.2)]">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            High Confidence Match
          </span>
        );
      case 'Possible Match':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Possible Match
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {matchLevel}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Summary Header */}
      <div className="tactical-card rounded-2xl p-6 border border-police-700/60 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white font-mono tracking-wider">
                    {plate_number || 'UNREADABLE PLATE'}
                  </h2>
                  <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-md bg-police-800 text-slate-300 border border-police-700">
                    {vehicle_type} • {color}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-2">
                  <span>Cross-Camera Journey Tracking</span>
                  <span className="text-cyan-400 font-bold">• Module 5 Active</span>
                </p>
              </div>
            </div>
          </div>

          {/* Match Level Summary Badges */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-police-950/80 border border-police-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Confirmed:</span>
              <strong className="text-emerald-300 text-sm font-bold">{match_summary?.confirmed_matches || 0}</strong>
            </div>

            <div className="p-2.5 rounded-xl bg-police-950/80 border border-police-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-slate-400">High Confidence:</span>
              <strong className="text-cyan-300 text-sm font-bold">{match_summary?.high_confidence_matches || 0}</strong>
            </div>

            <div className="p-2.5 rounded-xl bg-police-950/80 border border-police-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-slate-400">Possible:</span>
              <strong className="text-amber-300 text-sm font-bold">{match_summary?.possible_matches || 0}</strong>
            </div>

            <div className="p-2.5 rounded-xl bg-police-950/80 border border-police-800 text-slate-300">
              <span>Total Stops:</span>
              <strong className="text-cyan-400 ml-1 text-sm">{total_camera_stops}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Camera Progression Flow */}
      <div className="tactical-card rounded-2xl p-6 border border-police-700/60 overflow-x-auto">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Camera Trajectory Progression Timeline
        </h3>

        <div className="flex items-center gap-3 min-w-[700px] pb-2">
          {timeline.map((node, index) => (
            <React.Fragment key={node.sequence_index}>
              <div
                onClick={() => setSelectedNode(node)}
                className={`flex-1 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedNode?.sequence_index === node.sequence_index
                    ? 'border-cyan-400 bg-police-800/90 shadow-[0_0_20px_rgba(0,210,255,0.2)]'
                    : 'border-police-700/60 bg-police-900/60 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center border border-cyan-500/40">
                    #{node.sequence_index}
                  </span>
                  <span className="font-mono text-xs font-bold text-white flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {node.timestamp}
                  </span>
                </div>

                <p className="text-xs font-mono font-semibold text-slate-200 mt-2 truncate">
                  {node.camera_name.split('—')[0] || node.camera_name}
                </p>

                <div className="mt-2.5 pt-2 border-t border-police-800 flex items-center justify-between">
                  {renderBadge(node.match_level)}
                  <span className="font-mono text-[11px] font-bold text-cyan-300">
                    {node.match_confidence_pct}
                  </span>
                </div>
              </div>

              {index < timeline.length - 1 && (
                <div className="flex flex-col items-center justify-center text-slate-500 px-1 font-mono text-[10px]">
                  <ArrowRight className="w-5 h-5 text-cyan-500/70" />
                  {timeline[index + 1].time_delta_mins > 0 && (
                    <span className="text-cyan-400/80 font-semibold mt-0.5">
                      +{timeline[index + 1].time_delta_mins}m
                    </span>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Detailed Chronological Vertical Timeline & Evidence Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Sighting Details & Spatiotemporal Corridor Telemetry
        </h3>

        <div className="relative border-l-2 border-police-700/80 ml-4 pl-6 space-y-6">
          {timeline.map((node) => {
            const isSelected = selectedNode?.sequence_index === node.sequence_index;
            const snapUrl = getMediaUrl(node.evidence_images?.snapshot_url);
            const cropUrl = getMediaUrl(node.evidence_images?.plate_crop_url);

            return (
              <div key={node.sequence_index} className="relative group">
                <div className="absolute -left-[31px] top-4 w-5 h-5 rounded-full bg-police-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(0,210,255,0.4)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                </div>

                <div
                  onClick={() => setSelectedNode(node)}
                  className={`tactical-card rounded-2xl p-5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-400 bg-police-800/90 shadow-[0_0_20px_rgba(0,210,255,0.2)]'
                      : 'border-police-700/60 bg-police-900/60 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-police-800">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-extrabold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                          STOP #{node.sequence_index}
                        </span>
                        <h4 className="text-sm font-bold text-white font-mono">
                          {node.camera_name}
                        </h4>
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{node.location_name} ({node.department})</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {renderBadge(node.match_level)}
                      <span className="font-mono font-extrabold text-sm text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                        {node.match_confidence_pct}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Metrics & Evidence Images Grid */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-mono">
                    <div className="md:col-span-7 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2.5 rounded-xl bg-police-950/80 border border-police-800">
                          <span className="text-[10px] text-slate-500 uppercase block">Time Observed</span>
                          <span className="font-bold text-white mt-0.5 block flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {node.timestamp}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-police-950/80 border border-police-800">
                          <span className="text-[10px] text-slate-500 uppercase block">Time Delta</span>
                          <span className="font-bold text-cyan-300 mt-0.5 block">
                            {node.sequence_index === 1 ? 'Start Point' : `+${node.time_delta_mins} mins`}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-police-950/80 border border-police-800">
                          <span className="text-[10px] text-slate-500 uppercase block">Distance / Speed</span>
                          <span className="font-bold text-amber-300 mt-0.5 block">
                            {node.sequence_index === 1 ? '0.0 km' : `${node.distance_km} km @ ${node.speed_kmh} km/h`}
                          </span>
                        </div>
                      </div>

                      {node.component_breakdown && (
                        <div className="p-3 rounded-xl bg-police-950/90 border border-police-800 space-y-2">
                          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            Vehicle DNA Multi-Signal Correlation Breakdown
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                            <div>Plate: <strong className="text-cyan-300">{Math.round((node.component_breakdown.plate_similarity || 0) * 100)}%</strong></div>
                            <div>Visual: <strong className="text-cyan-300">{Math.round((node.component_breakdown.visual_similarity || 0) * 100)}%</strong></div>
                            <div>Type: <strong className="text-cyan-300">{Math.round((node.component_breakdown.vehicle_type || 0) * 100)}%</strong></div>
                            <div>Color: <strong className="text-cyan-300">{Math.round((node.component_breakdown.color || 0) * 100)}%</strong></div>
                            <div>Time: <strong className="text-cyan-300">{Math.round((node.component_breakdown.time_continuity || 0) * 100)}%</strong></div>
                            <div>Route: <strong className="text-cyan-300">{Math.round((node.component_breakdown.location_feasibility || 0) * 100)}%</strong></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Evidence Images */}
                    <div className="md:col-span-5 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Vehicle Snapshot</span>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePreviewImage(snapUrl);
                          }}
                          className="aspect-video bg-police-950 rounded-xl overflow-hidden border border-police-700 relative group cursor-pointer"
                        >
                          <EvidenceImage
                            src={snapUrl}
                            alt="Vehicle Evidence"
                            fallbackText="Snapshot Unavailable"
                            className="w-full h-full"
                          />
                          <div className="absolute inset-0 bg-police-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Plate Crop OCR</span>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePreviewImage(cropUrl);
                          }}
                          className="aspect-video bg-police-950 rounded-xl overflow-hidden border border-police-700 relative group cursor-pointer"
                        >
                          <EvidenceImage
                            src={cropUrl}
                            alt="Plate Crop"
                            fallbackText="Plate Crop Unavailable"
                            className="w-full h-full"
                          />
                          <div className="absolute inset-0 bg-police-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {activePreviewImage && (
        <div
          onClick={() => setActivePreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-cyan-500/50 shadow-2xl">
            <img src={activePreviewImage} alt="Evidence Large" className="w-full h-full object-contain max-h-[80vh]" />
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

export default CrossCameraTimeline;
