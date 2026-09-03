import React from 'react';
import { 
  ShieldAlert, 
  Video, 
  Dna, 
  FileWarning, 
  Layers, 
  Radio, 
  Cpu, 
  Activity,
  Scan,
  Compass,
  Navigation,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, systemStatus, cameraCount, alertCount, watchlistCount }) => {
  const menuItems = [
    { id: 'overview', label: 'System Overview', icon: Activity, badge: null },
    { id: 'cameras', label: 'Camera Management', icon: Video, badge: cameraCount || '5' },
    { id: 'detection', label: 'Live Video Processing', icon: Scan, badge: 'YOLOv8', badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' },
    { id: 'vehicle-dna', label: 'Vehicle Search', icon: Dna, badge: 'DNA' },
    { id: 'journey', label: 'Cross-Camera Journey', icon: Compass, badge: 'Mod 5', badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40' },
    { id: 'watchlist', label: 'Watchlist', icon: FileWarning, badge: watchlistCount || '4' },
    { id: 'alerts', label: 'Real-Time Alerts', icon: ShieldAlert, badge: alertCount || '3', badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' },
    { id: 'gis', label: 'GIS Intelligence', icon: Navigation, badge: 'Leaflet', badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' },
    { id: 'architecture', label: 'System Architecture', icon: Layers, badge: 'Doc' },
  ];

  return (
    <aside className="w-64 bg-police-900/95 border-r border-police-700/50 flex flex-col h-screen select-none z-20 backdrop-blur-md">
      {/* Brand Header */}
      <div className="p-5 border-b border-police-700/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,210,255,0.4)]">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-police-950 rounded-full" />
          </div>
          <div>
            <h1 className="font-extrabold tracking-wider text-base text-white flex items-center gap-1.5 font-sans">
              SENTINEL<span className="text-cyan-400">FUSION</span>
            </h1>
            <p className="text-[10px] font-mono text-cyan-400/90 uppercase tracking-widest font-bold">
              POLICE COMMAND CENTER
            </p>
          </div>
        </div>
      </div>

      {/* System Operational Status Pill */}
      <div className="px-4 py-2.5 bg-police-950/80 border-b border-police-800 font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Backend Core:
          </span>
          <span className={`inline-flex items-center gap-1 font-bold ${systemStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span className={`w-2 h-2 rounded-full ${systemStatus === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'}`} />
            {systemStatus ? systemStatus.toUpperCase() : 'ONLINE'}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
          Command Sections
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,210,255,0.15)] font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-police-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md ${
                    item.badgeColor || 'bg-police-800 text-slate-300 border border-police-700/60'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Module Release Footer */}
      <div className="p-4 border-t border-police-700/50 bg-police-950/80">
        <div className="rounded-xl bg-police-900/90 border border-police-700/60 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Command System:</span>
            <span className="text-cyan-400 font-bold">MODULE 8</span>
          </div>
          <div className="w-full bg-police-950 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full w-full rounded-full" />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Unified Command Center</span>
            <span className="text-emerald-400 font-bold">READY</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
