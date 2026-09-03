import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Film, 
  Building2, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  FileVideo,
  HardDrive
} from 'lucide-react';
import apiService from '../services/api';

const DEPARTMENTS = [
  'Police Department',
  'Home Department',
  'RTO Department',
  'Municipal Department',
  'Food and Civil Supplies Department',
];

export const UploadVideoModal = ({ isOpen, onClose, onVideoUploaded }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [cameraName, setCameraName] = useState('');
  const [department, setDepartment] = useState('Police Department');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('28.6139');
  const [longitude, setLongitude] = useState('77.2090');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (file) => {
    if (!file) return;
    const allowedExts = ['mp4', 'avi', 'mkv', 'mov', 'webm'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
      setErrorMsg(`Invalid file type. Allowed: ${allowedExts.join(', ')}`);
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    if (!cameraName) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setCameraName(`CCTV Feed - ${baseName}`);
    }
    if (!locationName) {
      setLocationName('Sector Ingestion Checkpoint');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedFile) {
      setErrorMsg('Please select a CCTV video file to upload');
      return;
    }
    if (!cameraName.trim()) {
      setErrorMsg('Camera Name is required');
      return;
    }
    if (!locationName.trim()) {
      setErrorMsg('Location Name is required');
      return;
    }

    setIsUploading(true);
    setUploadProgress(25);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('camera_name', cameraName);
      formData.append('department', department);
      formData.append('location_name', locationName);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);

      setUploadProgress(60);
      const res = await apiService.uploadVideo(formData);
      setUploadProgress(100);

      if (res.success) {
        setSuccessMsg(`Video "${selectedFile.name}" (${res.data.file_size_mb} MB) uploaded & camera registered!`);
        setTimeout(() => {
          onVideoUploaded(res.data.camera);
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Upload failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during video upload');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="tactical-card w-full max-w-xl rounded-2xl border border-police-700/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-police-900/90 border-b border-police-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Upload CCTV Video Recording
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Ingest Recorded Footage for Vehicle Tracking & Analytics
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

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/10'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-police-700/80 hover:border-cyan-500/50 bg-police-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.avi,.mkv,.mov,.webm,video/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <FileVideo className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-white truncate max-w-sm mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] font-mono text-emerald-400 mt-0.5">
                    {formatFileSize(selectedFile.size)} • Ready for ingestion
                  </p>
                </div>
                <span className="inline-block text-[10px] font-mono text-slate-400 underline hover:text-white">
                  Click to replace file
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-police-800 text-cyan-400 flex items-center justify-center mx-auto border border-police-700">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-slate-200">
                    Drag and drop CCTV video file here, or <span className="text-cyan-400">browse</span>
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    Supports MP4, AVI, MKV, MOV, WebM (Max 500 MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Camera Name / Feed Title *
              </label>
              <input
                type="text"
                value={cameraName}
                onChange={(e) => setCameraName(e.target.value)}
                placeholder="e.g. Grain Depot Gate 2 CCTV"
                className="w-full bg-police-950 border border-police-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Government Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-police-950 border border-police-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Location Name / Landmark *
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Central Food Silo Warehouse Complex"
                className="w-full bg-police-950 border border-police-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-police-950 border border-police-700/80 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-police-950 border border-police-700/80 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-cyan-400">
                <span>Ingesting Video Stream...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-police-950 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-police-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg bg-police-800 hover:bg-police-700 text-xs font-mono text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-mono font-bold text-white shadow-[0_0_15px_rgba(0,210,255,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Ingesting Stream...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload & Ingest Video
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadVideoModal;
