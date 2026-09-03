import React from 'react';
import { 
  FileWarning, 
  ShieldAlert, 
  Plus, 
  Clock, 
  Car, 
  Search, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export const WatchlistView = ({ watchlist = [] }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-amber-400" />
            Active Law Enforcement Watchlist Targets
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time flagged plates, Amber alerts, and wanted suspect vehicles monitored across all CCTV nodes.
          </p>
        </div>

        <span className="text-xs font-mono text-slate-400 bg-police-950/80 px-3 py-1.5 rounded-lg border border-police-800">
          Monitored Targets: <span className="text-amber-400 font-bold">{watchlist.length}</span>
        </span>
      </div>

      {/* Watchlist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchlist.map((item) => (
          <div
            key={item.id}
            className="tactical-card rounded-xl p-5 border border-police-700/60 flex flex-col justify-between hover:border-amber-500/50 transition-all duration-200"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {item.category}
                  </span>
                  <h4 className="text-base font-bold text-white font-sans mt-0.5">
                    {item.target_name}
                  </h4>
                </div>
                <StatusBadge 
                  status={item.severity.toUpperCase()} 
                  variant={item.severity} 
                  size="xs" 
                />
              </div>

              <div className="mt-4 p-3 rounded-lg bg-police-950/80 border border-police-800 space-y-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400">Target Plate:</span>
                  <span className="text-white font-bold bg-police-800 px-2 py-0.5 rounded border border-police-700">
                    {item.license_plate}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400">Vehicle Profile:</span>
                  <span className="text-cyan-300 capitalize">
                    {item.vehicle_color} {item.vehicle_type}
                  </span>
                </div>
              </div>

              {item.notes && (
                <p className="text-xs text-slate-400 mt-3 italic font-sans">
                  "{item.notes}"
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-police-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Status: Active Monitoring</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Armed
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchlistView;
