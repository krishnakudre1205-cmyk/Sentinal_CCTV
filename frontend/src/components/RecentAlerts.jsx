import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Radio, 
  Dna,
  Check
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export const RecentAlerts = ({ alerts = [], onAcknowledge }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Active Dispatch Alerts & Watchlist Hits
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time notifications triggered by ANPR plate hits and Vehicle DNA anomalies.
          </p>
        </div>

        <span className="text-xs font-mono px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
          {alerts.filter(a => !a.is_acknowledged).length} Unacknowledged
        </span>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="tactical-card rounded-xl p-8 text-center text-slate-500 border border-police-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">All Sectors Clear</p>
            <p className="text-xs text-slate-500 mt-0.5">No active priority violations detected.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isAcknowledged = alert.is_acknowledged;

            return (
              <div
                key={alert.id}
                className={`tactical-card rounded-xl p-4 transition-all duration-200 border relative overflow-hidden ${
                  isAcknowledged
                    ? 'border-police-800/80 bg-police-950/60 opacity-80'
                    : isCritical
                    ? 'border-rose-500/50 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                    : 'border-amber-500/40 bg-amber-950/15'
                }`}
              >
                {/* Left accent bar */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isAcknowledged 
                      ? 'bg-slate-700' 
                      : isCritical 
                      ? 'bg-rose-500' 
                      : 'bg-amber-400'
                  }`} 
                />

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pl-2">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">
                        {alert.title}
                      </span>
                      <StatusBadge 
                        status={alert.severity.toUpperCase()} 
                        variant={alert.severity} 
                        size="xs" 
                      />
                      <span className="text-[10px] font-mono text-cyan-400 bg-police-900 px-2 py-0.5 rounded border border-police-700">
                        {alert.alert_type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-sans">
                      {alert.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                      {alert.camera_name && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Radio className="w-3 h-3 text-cyan-400" />
                          {alert.camera_name}
                        </span>
                      )}
                      {alert.dna_id && (
                        <span className="flex items-center gap-1 text-[11px] text-cyan-300">
                          <Dna className="w-3 h-3" />
                          {alert.dna_id}
                        </span>
                      )}
                      {alert.license_plate && (
                        <span className="text-[11px] font-bold text-white bg-police-800 px-1.5 py-0.5 rounded border border-police-700">
                          Plate: {alert.license_plate}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-3 shrink-0">
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Live Feed Event
                    </span>

                    {isAcknowledged ? (
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 bg-police-900 px-2 py-1 rounded border border-police-800">
                        <Check className="w-3 h-3 text-emerald-400" />
                        Ack by: {alert.acknowledged_by || 'Officer'}
                      </span>
                    ) : (
                      <button
                        onClick={() => onAcknowledge(alert.id)}
                        className="px-3 py-1.5 bg-police-800 hover:bg-police-700 text-xs font-mono text-cyan-300 hover:text-white rounded-lg border border-police-700 hover:border-cyan-500/50 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentAlerts;
