import React, { useState } from 'react';
import { ImageOff, ShieldAlert } from 'lucide-react';

export const EvidenceImage = ({ 
  src, 
  alt = "Evidence Image", 
  className = "", 
  fallbackText = "Evidence Unavailable",
  showPlaceholderOnMissing = true
}) => {
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src || hasError) {
    if (!showPlaceholderOnMissing) return null;
    return (
      <div className={`bg-police-950/90 border border-police-800 rounded-lg flex flex-col items-center justify-center p-3 text-slate-500 font-mono text-[11px] select-none ${className}`}>
        <ImageOff className="w-5 h-5 text-slate-600 mb-1" />
        <span className="text-[10px] text-slate-500 font-semibold">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-police-950/80 rounded-lg border border-police-800 ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-police-950/90 animate-pulse flex items-center justify-center text-slate-500 font-mono text-[10px]">
          <span>Loading Media...</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

export default EvidenceImage;
