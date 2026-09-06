import React, { useState, useMemo } from 'react';
import { 
  Video, 
  PlusCircle, 
  Upload, 
  Building2, 
  MapPin, 
  Radio, 
  Film, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  Layers,
  LayoutGrid,
  List,
  Shield,
  Activity
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import RegisterCameraModal from './RegisterCameraModal';
import UploadVideoModal from './UploadVideoModal';
import CameraStreamModal from './CameraStreamModal';
import apiService from '../services/api';

const SAMPLE_DEPARTMENTS = [
  'All Departments',
  'Police Department',
  'Home Department',
  'RTO Department',
  'Municipal Department',
  'Food and Civil Supplies Department',
];

export const CameraManagement = ({ cameras = [], onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedSourceType, setSelectedSourceType] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [inspectedCamera, setInspectedCamera] = useState(null);

  // Deletion feedback
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Department counts
  const deptCounts = useMemo(() => {
    const counts = {};
    cameras.forEach((c) => {
      counts[c.department] = (counts[c.department] || 0) + 1;
    });
    return counts;
  }, [cameras]);

  // Filtered cameras list
  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      const matchesSearch =
        searchQuery === '' ||
        cam.camera_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.source_url.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        selectedDept === 'All Departments' || cam.department === selectedDept;

      const matchesSource =
        selectedSourceType === 'ALL' || cam.source_type === selectedSourceType;

      return matchesSearch && matchesDept && matchesSource;
    });
  }, [cameras, searchQuery, selectedDept, selectedSourceType]);

  const handleDelete = async (cameraId, cameraName) => {
    if (!window.confirm(`Are you sure you want to remove camera "${cameraName}"?`)) {
      return;
    }

    setDeletingId(cameraId);
    try {
      const res = await apiService.deleteCamera(cameraId);
      if (res.success) {
        setNotification({ type: 'success', message: `Camera "${cameraName}" deleted.` });
        onRefresh();
      } else {
        setNotification({ type: 'error', message: res.error || 'Failed to delete camera' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setDeletingId(null);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const getDeptColor = (dept) => {
    switch (dept) {
      case 'Police Department':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'Home Department':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'RTO Department':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Municipal Department':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Food and Civil Supplies Department':
        return 'text-violet-400 bg-violet-500/10 border-violet-500/30';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Action Buttons */}
      <div className="tactical-card rounded-2xl p-6 border border-police-700/60 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
                  CCTV Camera Registry & Video Ingestion
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Module 1 Ready
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Unified Registry for RTSP Streams, Traffic Ingestion Nodes, and Recorded CCTV Video Uploads.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-police-800 hover:bg-police-700 text-white font-mono text-xs font-semibold border border-police-700/80 hover:border-cyan-500/40 transition-all duration-200 flex items-center gap-2 shadow-md group"
            >
              <Upload className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Upload CCTV Video</span>
            </button>

            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold shadow-[0_0_20px_rgba(0,210,255,0.3)] transition-all duration-200 flex items-center gap-2 group"
            >
              <PlusCircle className="w-4 h-4 text-white group-hover:rotate-90 transition-transform" />
              <span>Register Camera</span>
            </button>
          </div>
        </div>

        {/* Department Chips Summary Bar */}
        <div className="mt-5 pt-4 border-t border-police-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 mr-2 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Departments:
          </span>
          {SAMPLE_DEPARTMENTS.map((dept) => {
            const isSelected = selectedDept === dept;
            const count = dept === 'All Departments' ? cameras.length : deptCounts[dept] || 0;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,210,255,0.2)]'
                    : 'bg-police-950/80 hover:bg-police-800 text-slate-400 hover:text-slate-200 border border-police-800'
                }`}
              >
                <span>{dept}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-police-900 border border-police-700/60 font-bold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-mono flex items-center gap-2.5 border transition-all animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Search, Filter & View Mode Controls */}
      <div className="tactical-card rounded-xl p-4 border border-police-700/60 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by camera name, location, or RTSP URL..."
            className="w-full bg-police-950/90 border border-police-700/70 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        {/* Source Type Filter & View Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value)}
              className="bg-police-950 border border-police-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Source Types</option>
              <option value="RTSP">RTSP Streams Only</option>
              <option value="FILE">Video Files Only</option>
            </select>
          </div>

          {/* Grid / Table View Switcher */}
          <div className="flex items-center bg-police-950 p-0.5 rounded-lg border border-police-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Matrix Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Surveillance Registry Table"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Camera Matrix Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCameras.map((cam) => {
            const isFile = cam.source_type === 'FILE';
            return (
              <div
                key={cam.id}
                className="tactical-card rounded-xl overflow-hidden border border-police-700/60 flex flex-col group hover:border-cyan-500/50 transition-all duration-200"
              >
                {/* Visual Radar Screen Canvas */}
                <div className="relative aspect-video bg-police-950 border-b border-police-800 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2d4f15_1px,transparent_1px),linear-gradient(to_bottom,#1b2d4f15_1px,transparent_1px)] bg-[size:20px_20px]" />
                  
                  {cam.status === 'ACTIVE' && <div className="radar-sweep" />}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                    <span className="px-2 py-0.5 rounded bg-police-950/90 text-cyan-400 font-mono text-[10px] font-bold border border-police-700">
                      ID #{cam.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold border ${
                      isFile 
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' 
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {cam.source_type}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 z-10">
                    <StatusBadge
                      status={cam.status}
                      variant={cam.status === 'ACTIVE' ? 'online' : 'offline'}
                      size="xs"
                    />
                  </div>

                  {/* Center Node Graphic */}
                  <div className="relative z-0 text-center p-4 space-y-1.5">
                    <div className="w-12 h-12 rounded-full bg-police-900/90 border border-police-700 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.1)] group-hover:scale-110 transition-transform">
                      {isFile ? (
                        <Film className="w-5 h-5 text-violet-400" />
                      ) : (
                        <Radio className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 truncate max-w-xs mx-auto">
                      {cam.source_url}
                    </p>
                  </div>

                  {/* Bottom Telemetry Bar */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-police-950/80 px-2 py-0.5 rounded border border-police-800/80">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      {Number(cam.latitude || 28.6139).toFixed(4)}, {Number(cam.longitude || 77.2090).toFixed(4)}
                    </span>
                    <span className="text-emerald-400">Adapter: Active</span>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-4 bg-police-900/70 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white font-sans group-hover:text-cyan-300 transition-colors">
                      {cam.camera_name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-mono">
                      <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className={`px-1.5 py-0.2 rounded text-[10px] border ${getDeptColor(cam.department)}`}>
                        {cam.department}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {cam.location_name}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-police-800/80 flex items-center justify-between">
                    <button
                      onClick={() => setInspectedCamera(cam)}
                      className="px-3 py-1.5 rounded-lg bg-police-800 hover:bg-police-700 text-cyan-300 text-xs font-mono border border-police-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect Stream
                    </button>

                    <button
                      onClick={() => handleDelete(cam.id, cam.camera_name)}
                      disabled={deletingId === cam.id}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Camera"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Surveillance Registry Table View */
        <div className="tactical-card rounded-xl border border-police-700/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-police-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-police-800">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Camera Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Location & Coordinates</th>
                  <th className="px-4 py-3">Source Type</th>
                  <th className="px-4 py-3">Source URL</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-police-800/80 text-slate-300">
                {filteredCameras.map((cam) => (
                  <tr key={cam.id} className="hover:bg-police-900/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-cyan-400">#{cam.id}</td>
                    <td className="px-4 py-3 font-sans font-bold text-white">
                      {cam.camera_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${getDeptColor(cam.department)}`}>
                        {cam.department}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>{cam.location_name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({Number(cam.latitude || 28.6139).toFixed(4)}, {Number(cam.longitude || 77.2090).toFixed(4)})
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-police-800 text-slate-300 border border-police-700">
                        {cam.source_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 truncate max-w-xs text-slate-400" title={cam.source_url}>
                      {cam.source_url}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={cam.status}
                        variant={cam.status === 'ACTIVE' ? 'online' : 'offline'}
                        size="xs"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setInspectedCamera(cam)}
                          className="p-1.5 rounded bg-police-800 hover:bg-police-700 text-cyan-300 border border-police-700 transition-colors"
                          title="View Stream"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cam.id, cam.camera_name)}
                          disabled={deletingId === cam.id}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Camera"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCameras.length === 0 && (
        <div className="tactical-card rounded-xl p-12 text-center text-slate-400 border border-police-800">
          <Video className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-white">No cameras match your current filters</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or department filter.
          </p>
        </div>
      )}

      {/* Modals */}
      <RegisterCameraModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onCameraAdded={() => {
          onRefresh();
          setNotification({ type: 'success', message: 'New camera successfully registered!' });
          setTimeout(() => setNotification(null), 3500);
        }}
      />

      <UploadVideoModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onVideoUploaded={() => {
          onRefresh();
          setNotification({ type: 'success', message: 'CCTV Video uploaded and registered!' });
          setTimeout(() => setNotification(null), 3500);
        }}
      />

      <CameraStreamModal
        camera={inspectedCamera}
        isOpen={!!inspectedCamera}
        onClose={() => setInspectedCamera(null)}
      />
    </div>
  );
};

export default CameraManagement;
