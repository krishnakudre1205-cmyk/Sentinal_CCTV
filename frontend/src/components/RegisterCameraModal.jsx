import React, { useState } from 'react';
import { 
  X, 
  Video, 
  Building2, 
  MapPin, 
  Radio, 
  Globe, 
  CheckCircle, 
  AlertCircle,
  Shield,
  Layers
} from 'lucide-react';
import apiService from '../services/api';

const DEPARTMENTS = [
  'Police Department',
  'Home Department',
  'RTO Department',
  'Municipal Department',
  'Food and Civil Supplies Department',
];

export const RegisterCameraModal = ({ isOpen, onClose, onCameraAdded }) => {
  const [formData, setFormData] = useState({
    camera_name: '',
    department: 'Police Department',
    location_name: '',
    latitude: '28.6139',
    longitude: '77.2090',
    source_type: 'RTSP',
    source_url: '',
    status: 'ACTIVE',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.camera_name.trim()) {
      setErrorMsg('Camera Name is required');
      return;
    }
    if (!formData.location_name.trim()) {
      setErrorMsg('Location Name is required');
      return;
    }
    if (!formData.source_url.trim()) {
      setErrorMsg('Source URL or file path is required');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude) || 0.0,
        longitude: parseFloat(formData.longitude) || 0.0,
      };

      const res = await apiService.registerCamera(payload);
      if (res.success) {
        setSuccessMsg(`Camera "${res.data.camera_name}" registered successfully!`);
        setTimeout(() => {
          onCameraAdded(res.data);
          onClose();
        }, 1000);
      } else {
        setErrorMsg(res.error || 'Failed to register camera');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="tactical-card w-full max-w-xl rounded-2xl border border-police-700/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-police-900/90 border-b border-police-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Register CCTV Camera Source
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Add RTSP Network Stream or Video File to Surveillance Registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-police-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-mono">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Camera Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                Camera Identifier / Name *
              </label>
              <input
                type="text"
                name="camera_name"
                value={formData.camera_name}
                onChange={handleChange}
                placeholder="e.g. Ring Road Junction 4 ANPR Cam-01"
                className="w-full bg-police-950 border border-police-700/80 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                required
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Government Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full bg-police-950 border border-police-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Source Protocol / Type *
              </label>
              <select
                name="source_type"
                value={formData.source_type}
                onChange={handleChange}
                className="w-full bg-police-950 border border-police-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
              >
                <option value="RTSP">RTSP Network Stream (rtsp://)</option>
                <option value="FILE">Local / Server Video File (FILE)</option>
              </select>
            </div>

            {/* Location Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Location Name / Sector Address *
              </label>
              <input
                type="text"
                name="location_name"
                value={formData.location_name}
                onChange={handleChange}
                placeholder="e.g. Sector 4 North Toll Plaza Outer Intersect"
                className="w-full bg-police-950 border border-police-700/80 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                required
              />
            </div>

            {/* Source URL */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Source Stream URL / File URI *
              </label>
              <input
                type="text"
                name="source_url"
                value={formData.source_url}
                onChange={handleChange}
                placeholder={
                  formData.source_type === 'RTSP'
                    ? 'rtsp://127.0.0.1:8554/live/sector4_cam1'
                    : '/uploads/cctv_sample.mp4'
                }
                className="w-full bg-police-950 border border-police-700/80 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                required
              />
              <p className="text-[10px] text-slate-500 font-mono">
                {formData.source_type === 'RTSP'
                  ? 'Format: rtsp://<host>:<port>/<stream_path> or http:// IP camera stream'
                  : 'Path relative to backend server or uploaded video folder'}
              </p>
            </div>

            {/* Latitude & Longitude */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Latitude Coordinates
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="28.6139"
                className="w-full bg-police-950 border border-police-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Longitude Coordinates
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="77.2090"
                className="w-full bg-police-950 border border-police-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-police-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-police-800 hover:bg-police-700 text-xs font-mono text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-mono font-bold text-white shadow-[0_0_15px_rgba(0,210,255,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Validating Adapter...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Register Camera
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterCameraModal;
