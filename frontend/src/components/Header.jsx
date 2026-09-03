import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Clock, 
  Bell, 
  RefreshCw,
  Search,
  X,
  Video,
  Dna,
  FileWarning,
  Compass,
  ArrowRight
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export const Header = ({
  systemStatus,
  onRefresh,
  isRefreshing,
  alertCount,
  cameras = [],
  watchlist = [],
  onGlobalSearchNavigate
}) => {
  const [time, setTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatUTC = (date) => {
    return date.toUTCString().slice(17, 25) + ' UTC';
  };

  const formatLocal = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Filter global search results across cameras, plates/identities, and watchlist targets
  const q = searchQuery.trim().toLowerCase();
  
  const matchedCameras = q
    ? cameras.filter(
        (c) =>
          (c.camera_name && c.camera_name.toLowerCase().includes(q)) ||
          (c.department && c.department.toLowerCase().includes(q)) ||
          (c.location_name && c.location_name.toLowerCase().includes(q))
      )
    : [];

  const matchedWatchlist = q
    ? watchlist.filter(
        (w) =>
          (w.target_name && w.target_name.toLowerCase().includes(q)) ||
          (w.plate_number && w.plate_number.toLowerCase().includes(q)) ||
          (w.license_plate && w.license_plate.toLowerCase().includes(q)) ||
          (w.category && w.category.toLowerCase().includes(q)) ||
          (w.reason && w.reason.toLowerCase().includes(q))
      )
    : [];

  // Default sample plates for quick search
  const samplePlates = ['GJ01AB1234', 'DL01CA9988', 'HR26DK8890', 'MH12DE4567'];
  const matchedPlates = q
    ? samplePlates.filter((p) => p.toLowerCase().includes(q))
    : [];

  const hasResults = matchedCameras.length > 0 || matchedWatchlist.length > 0 || matchedPlates.length > 0;

  const handleSelectResult = (tab, queryVal) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (onGlobalSearchNavigate) {
      onGlobalSearchNavigate(tab, queryVal);
    }
  };

  return (
    <header className="h-16 bg-police-900/90 border-b border-police-700/50 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-30 select-none">
      {/* Title & Subtitle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(0,210,255,0.2)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold tracking-wider text-white uppercase font-mono">
                SentinelFusion AI
              </h2>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/40">
                COMMAND CENTER v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              Unified Law Enforcement CCTV & Vehicle Intelligence Platform
            </p>
          </div>
        </div>
      </div>

      {/* Center Global Command Search Bar */}
      <div ref={searchContainerRef} className="flex-1 max-w-lg mx-6 relative">
        <div className="relative flex items-center bg-police-950/90 border border-police-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(0,210,255,0.25)] transition-all">
          <Search className="w-4 h-4 text-cyan-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Global Command Search (Plate, DNA ID, Camera, Department, Date)..."
            className="w-full bg-transparent text-white placeholder-slate-500 font-mono focus:outline-none text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Search Results Overlay Modal */}
        {isSearchOpen && q && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-police-950 border border-police-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 font-mono text-xs max-h-[75vh] overflow-y-auto">
            <div className="p-3 bg-police-900/90 border-b border-police-800 flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-bold text-cyan-400 uppercase tracking-wider">
                Global Search Results ({matchedCameras.length + matchedWatchlist.length + matchedPlates.length})
              </span>
              <span>Search query: "{searchQuery}"</span>
            </div>

            {!hasResults ? (
              <div className="p-6 text-center text-slate-500">
                <p className="font-bold text-white mb-1">No Matching Command Records Found</p>
                <p className="text-[11px] text-slate-400">
                  Try searching plates like <code className="text-cyan-300">GJ01AB1234</code>, camera <code className="text-cyan-300">Toll Plaza</code>, or target <code className="text-cyan-300">Stolen</code>
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {/* Plate & Identity Matches */}
                {matchedPlates.length > 0 && (
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold px-2 mb-1 flex items-center gap-1.5">
                      <Dna className="w-3.5 h-3.5 text-cyan-400" />
                      Vehicle Plate & DNA Identity Matches
                    </div>
                    {matchedPlates.map((plate) => (
                      <div
                        key={plate}
                        onClick={() => handleSelectResult('journey', plate)}
                        className="p-2.5 rounded-xl hover:bg-police-800/80 cursor-pointer flex items-center justify-between text-slate-200 border border-transparent hover:border-cyan-500/40 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cyan-300 text-sm tracking-wider">{plate}</span>
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded">
                            VDNA-{plate}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          Inspect Journey <ArrowRight className="w-3 h-3 text-cyan-400" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Watchlist Target Matches */}
                {matchedWatchlist.length > 0 && (
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold px-2 mb-1 flex items-center gap-1.5">
                      <FileWarning className="w-3.5 h-3.5 text-rose-400" />
                      Watchlist Target Matches
                    </div>
                    {matchedWatchlist.map((target) => (
                      <div
                        key={target.id}
                        onClick={() => handleSelectResult('watchlist', target.plate_number || target.license_plate)}
                        className="p-2.5 rounded-xl hover:bg-police-800/80 cursor-pointer flex items-center justify-between text-slate-200 border border-transparent hover:border-rose-500/40 transition-all"
                      >
                        <div>
                          <div className="font-bold text-white">{target.target_name}</div>
                          <div className="text-[11px] text-slate-400">
                            Plate: <span className="text-rose-300 font-bold">{target.plate_number || target.license_plate}</span> | Reason: {target.reason || target.category}
                          </div>
                        </div>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold uppercase">
                          {target.priority || 'HIGH'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CCTV Camera Matches */}
                {matchedCameras.length > 0 && (
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold px-2 mb-1 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-amber-400" />
                      Camera & Location Matches
                    </div>
                    {matchedCameras.map((cam) => (
                      <div
                        key={cam.id}
                        onClick={() => handleSelectResult('cameras', cam.camera_name)}
                        className="p-2.5 rounded-xl hover:bg-police-800/80 cursor-pointer flex items-center justify-between text-slate-200 border border-transparent hover:border-amber-500/40 transition-all"
                      >
                        <div>
                          <div className="font-bold text-sky-300">{cam.camera_name}</div>
                          <div className="text-[11px] text-slate-400">
                            Department: {cam.department} | Location: {cam.location_name}
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                          ACTIVE
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Telemetry & Status Controls */}
      <div className="flex items-center gap-4">
        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-police-950/80 border border-police-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{formatLocal(time)}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">{formatUTC(time)}</span>
        </div>

        {/* Live System Status */}
        <div className="flex items-center gap-2">
          {systemStatus === 'online' ? (
            <StatusBadge status="System Online" variant="online" size="sm" />
          ) : (
            <StatusBadge status="Backend Offline" variant="offline" size="sm" />
          )}
        </div>

        {/* Manual Refresh Ping */}
        <button
          onClick={onRefresh}
          title="Refresh command center telemetry"
          className="p-2 rounded-xl bg-police-800 hover:bg-police-700 text-slate-300 hover:text-cyan-300 border border-police-700 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};

export default Header;
