import React from 'react';
import { 
  Video, 
  ShieldAlert, 
  Dna, 
  CheckCircle2, 
  FileWarning,
  Eye,
  Activity
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export const StatsOverview = ({
  totalCameras = 5,
  activeCameras = 5,
  vehiclesDetectedToday = 42,
  activeAlerts = 3,
  watchlistMatches = 4,
  onNavigate
}) => {
  const metrics = [
    {
      id: 'total-cameras',
      title: 'Total Cameras',
      value: totalCameras,
      subtitle: 'Registered CCTV Feed Nodes',
      icon: Video,
      status: 'Registry Online',
      variant: 'cyber',
      onClick: () => onNavigate('cameras'),
    },
    {
      id: 'active-cameras',
      title: 'Active Cameras',
      value: activeCameras,
      subtitle: 'Streaming RTSP / MP4',
      icon: Eye,
      status: `${activeCameras}/${totalCameras} Live`,
      variant: 'online',
      onClick: () => onNavigate('cameras'),
    },
    {
      id: 'vehicles-detected',
      title: 'Vehicles Detected Today',
      value: vehiclesDetectedToday,
      subtitle: 'ANPR & DNA Ingested',
      icon: Dna,
      status: 'Pipeline Active',
      variant: 'info',
      onClick: () => onNavigate('vehicle-dna'),
    },
    {
      id: 'active-alerts',
      title: 'Active Alerts',
      value: activeAlerts,
      subtitle: 'Unacknowledged Dispatch',
      icon: ShieldAlert,
      status: activeAlerts > 0 ? 'Action Required' : 'Sectors Clear',
      variant: activeAlerts > 0 ? 'critical' : 'online',
      onClick: () => onNavigate('alerts'),
    },
    {
      id: 'watchlist-matches',
      title: 'Watchlist Matches',
      value: watchlistMatches,
      subtitle: 'Stolen & Suspect Vehicle Hits',
      icon: FileWarning,
      status: 'Watchlist Active',
      variant: 'critical',
      onClick: () => onNavigate('watchlist'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {metrics.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            onClick={item.onClick}
            className="tactical-card tactical-card-hover rounded-2xl p-4 cursor-pointer relative overflow-hidden group border border-police-700/60 hover:border-cyan-500/60 bg-police-900/80 backdrop-blur-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {item.title}
                </p>
                <h3 className="text-2xl font-extrabold text-white mt-1 font-mono tracking-tight group-hover:text-cyan-300 transition-colors">
                  {item.value}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-police-800/90 border border-police-700/60 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-all shadow-[0_0_12px_rgba(0,210,255,0.15)]">
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-police-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-sans truncate pr-1">
                {item.subtitle}
              </span>
              <StatusBadge status={item.status} variant={item.variant} size="xs" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsOverview;
