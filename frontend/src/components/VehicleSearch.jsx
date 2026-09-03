import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Dna, 
  MapPin, 
  Clock, 
  Video, 
  Sparkles, 
  Eye, 
  AlertTriangle,
  Fingerprint,
  Layers,
  Compass,
  FileText,
  CheckCircle2,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import CrossCameraTimeline from './CrossCameraTimeline';
import GISRouteMap from './GISRouteMap';
import apiService from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const VehicleSearch = ({ vehicles = [], onSearch, isLoading }) => {
  const [query, setQuery] = useState('GJ01AB1234');
  const [searchMode, setSearchMode] = useState('ANPR'); // 'ANPR', 'TRACKING', 'DNA'
  const [anprResults, setAnprResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [activePreviewImage, setActivePreviewImage] = useState(null);
  const [journeyData, setJourneyData] = useState(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  const [cameraList, setCameraList] = useState([]);

  useEffect(() => {
    const loadCameras = async () => {
      try {
        const res = await apiService.getCameras();
        if (res.success && res.data) {
          setCameraList(res.data);
        }
      } catch (err) {
        console.warn('Error fetching cameras for GIS map:', err);
      }
    };
    loadCameras();
  }, []);

  const fetchVehicleJourney = async (targetId) => {
    if (!targetId || !targetId.trim()) return;
    setIsTrackingLoading(true);
    try {
      const res = await apiService.getVehicleJourney(targetId.trim());
      if (res.success && res.data) {
        setJourneyData(res.data);
      }
    } catch (err) {
      console.warn('Error fetching vehicle journey:', err);
    } finally {
      setIsTrackingLoading(false);
    }
  };

  // Execute ANPR Search via API
  const handleANPRSearch = async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await apiService.searchVehiclesByPlate(searchQuery.trim());
      if (res.success && Array.isArray(res.data)) {
        setAnprResults(res.data);
        if (res.data.length > 0) {
          setSelectedResult(res.data[0]);
        } else {
          setSelectedResult(null);
        }
      }
    } catch (err) {
      console.warn('Error running ANPR plate search:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    handleANPRSearch('GJ01AB1234');
    fetchVehicleJourney('GJ01AB1234');
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchMode === 'TRACKING') {
      fetchVehicleJourney(query);
    } else if (searchMode === 'ANPR') {
      handleANPRSearch(query);
    } else if (onSearch) {
      onSearch(query);
    }
  };

  const resolveUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & ANPR Search Bar */}
      <div className="tactical-card rounded-2xl p-6 border border-police-700/60 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
                <FileText className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
                  ANPR Vehicle & Plate Search Engine
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Module 3 Active
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Search vehicle license plates with full support for exact numbers, partial queries, and wildcards (<code className="text-cyan-300">?</code> for single char, <code className="text-cyan-300">*</code> for multi-char).
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switch & Search Form */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-police-950 p-1 rounded-xl border border-police-700 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSearchMode('ANPR')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  searchMode === 'ANPR'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ANPR Plate Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchMode('TRACKING');
                  fetchVehicleJourney(query || 'GJ01AB1234');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  searchMode === 'TRACKING'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cross-Camera Journey
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('DNA')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  searchMode === 'DNA'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vehicle DNA Profiles
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchMode === 'ANPR' ? "e.g. GJ01AB1234 or GJ01AB12??" : "Search DNA ID or color..."}
                  className="w-full bg-police-950/90 border border-police-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(0,210,255,0.2)] flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSearching ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Search</span>
              </button>
            </form>
          </div>
        </div>

        {/* Quick Wildcard Filter Buttons */}
        <div className="mt-4 pt-3.5 border-t border-police-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 text-[11px]">Wildcard Samples:</span>
            {[
              { label: 'Exact Plate', q: 'GJ01AB1234' },
              { label: 'Partial Wildcard (??)', q: 'GJ01AB12??' },
              { label: 'State Prefix (*)', q: 'GJ01*' },
              { label: 'Delhi Checkpoint', q: 'DL01CA9988' },
              { label: 'Maharashtra', q: 'MH12DE4567' }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setQuery(item.q);
                  handleANPRSearch(item.q);
                }}
                className="px-2.5 py-1 rounded-lg bg-police-900 hover:bg-police-800 text-slate-300 hover:text-cyan-300 border border-police-700/60 text-[11px] transition-colors"
              >
                {item.q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-cyan-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Wildcard syntax: <code className="bg-police-900 px-1 py-0.5 rounded text-white">?</code> = 1 char, <code className="bg-police-900 px-1 py-0.5 rounded text-white">*</code> = multi chars</span>
          </div>
        </div>
      </div>

      {/* ANPR Plate Search Results View */}
      {searchMode === 'ANPR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: List of ANPR Plate Appearances */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span>PLATE MATCHES ({anprResults.length})</span>
              <span>OCR CONFIDENCE</span>
            </div>

            {anprResults.length === 0 ? (
              <div className="tactical-card rounded-xl p-8 text-center text-slate-400 border border-police-800">
                <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium font-mono text-white">No Plate Detections Logged</p>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Run AI Detection in Module 2 or try searching with wildcards like <code className="text-cyan-400">GJ*</code>
                </p>
              </div>
            ) : (
              anprResults.map((item) => {
                const isSelected = selectedResult?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedResult(item)}
                    className={`tactical-card rounded-xl p-4 cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? 'border-cyan-400 bg-police-800/90 shadow-[0_0_20px_rgba(0,210,255,0.2)]'
                        : 'border-police-700/50 hover:border-cyan-500/40 bg-police-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-base text-cyan-300 tracking-wider">
                            {item.plate_number}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-police-800 text-slate-300 border border-police-700">
                            {item.vehicle_type}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{item.camera_name} ({item.department})</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          {Math.round(item.confidence * 100)}% CONF
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-police-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {item.location_name}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        RAW OCR: <span className="text-slate-300 font-semibold">{item.raw_ocr_text || item.plate_number}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Evidence Inspection Card & GIS Location */}
          <div className="lg:col-span-7">
            {selectedResult ? (
              <div className="tactical-card rounded-2xl p-6 border border-police-700/60 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-police-800 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-cyan-400 animate-pulse" />
                      <h4 className="text-lg font-bold text-white font-mono tracking-wider">
                        {selectedResult.plate_number}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      ANPR Detection Record #{selectedResult.vehicle_detection_id || selectedResult.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="VERIFIED PLATE" variant="online" size="sm" />
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      {Math.round(selectedResult.confidence * 100)}% OCR Confidence
                    </span>
                  </div>
                </div>

                {/* Evidence Image Viewer Grid: Vehicle Snapshot & Plate Crop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Vehicle Snapshot Evidence */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      Vehicle ROI Snapshot
                    </span>
                    <div
                      onClick={() => setActivePreviewImage(resolveUrl(selectedResult.evidence_frame))}
                      className="aspect-video bg-police-950 rounded-xl overflow-hidden border border-police-700 relative group cursor-pointer flex items-center justify-center"
                    >
                      {selectedResult.evidence_frame ? (
                        <img
                          src={resolveUrl(selectedResult.evidence_frame)}
                          alt="Vehicle Evidence"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-center p-4 text-slate-500 font-mono text-xs">
                          No Vehicle Snapshot Image Available
                        </div>
                      )}
                      <div className="absolute inset-0 bg-police-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* License Plate Crop */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Cropped License Plate OCR
                    </span>
                    <div
                      onClick={() => setActivePreviewImage(resolveUrl(selectedResult.plate_crop_url))}
                      className="aspect-video bg-police-950 rounded-xl overflow-hidden border border-police-700 relative group cursor-pointer flex items-center justify-center"
                    >
                      {selectedResult.plate_crop_url ? (
                        <img
                          src={resolveUrl(selectedResult.plate_crop_url)}
                          alt="Plate Crop"
                          className="w-full h-full object-contain bg-black p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-center p-4 text-slate-500 font-mono text-xs">
                          Cropped Plate Image Saved to /uploads
                        </div>
                      )}
                      <div className="absolute inset-0 bg-police-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ANPR Detection Metadata Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-police-950/80 border border-police-800">
                    <span className="text-[10px] text-slate-500 uppercase">Normalized Plate</span>
                    <p className="text-sm font-bold text-cyan-300 mt-0.5">{selectedResult.plate_number}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-police-950/80 border border-police-800">
                    <span className="text-[10px] text-slate-500 uppercase">Raw OCR Text</span>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">{selectedResult.raw_ocr_text || 'SAME'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-police-950/80 border border-police-800">
                    <span className="text-[10px] text-slate-500 uppercase">Vehicle Class</span>
                    <p className="text-sm font-bold text-amber-300 mt-0.5 capitalize">{selectedResult.vehicle_type}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-police-950/80 border border-police-800">
                    <span className="text-[10px] text-slate-500 uppercase">Department</span>
                    <p className="text-sm font-bold text-emerald-300 mt-0.5">{selectedResult.department}</p>
                  </div>
                </div>

                {/* Location & Surveillance Telemetry */}
                <div className="p-4 rounded-xl bg-police-950/90 border border-police-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-cyan-400" />
                      Source Camera: <strong className="text-white">{selectedResult.camera_name}</strong>
                    </span>
                    <span>Camera ID #{selectedResult.camera_id}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      Location: {selectedResult.location_name}
                    </span>
                    <span>Geo: [{selectedResult.latitude?.toFixed(4)}, {selectedResult.longitude?.toFixed(4)}]</span>
                  </div>
                </div>

                {/* Quick Cross-Camera Journey Trigger */}
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setSearchMode('TRACKING');
                      setQuery(selectedResult.plate_number);
                      fetchVehicleJourney(selectedResult.plate_number);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,210,255,0.2)] flex items-center justify-center gap-2"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Reconstruct Cross-Camera Journey Timeline (Module 5)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="tactical-card rounded-xl p-12 text-center text-slate-500 border border-police-800">
                <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-400">Select an ANPR Plate detection item to inspect</p>
                <p className="text-xs text-slate-600 mt-1 font-mono">
                  View evidence crop, raw vs normalized text, and camera location.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Module 5 & 7: GIS Route Map & Cross-Camera Journey View */}
      {searchMode === 'TRACKING' && (
        <div className="space-y-6">
          <GISRouteMap cameras={cameraList} journey={journeyData} />
          <CrossCameraTimeline journeyData={journeyData} isLoading={isTrackingLoading} />
        </div>
      )}

      {/* Image Preview Modal */}
      {activePreviewImage && (
        <div
          onClick={() => setActivePreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-cyan-500/50 shadow-2xl">
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

export default VehicleSearch;
