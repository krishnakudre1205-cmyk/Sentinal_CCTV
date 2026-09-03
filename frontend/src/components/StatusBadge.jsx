import React from 'react';

export const StatusBadge = ({ status, variant = 'default', size = 'sm' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'online':
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'offline':
      case 'critical':
      case 'danger':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'warning':
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'info':
      case 'cyber':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-800/60 text-slate-300 border-slate-700';
    }
  };

  const getDotStyle = () => {
    switch (variant) {
      case 'online':
      case 'success':
        return 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
      case 'offline':
      case 'critical':
      case 'danger':
        return 'bg-rose-500 shadow-[0_0_8px_#f43f5e]';
      case 'warning':
      case 'high':
        return 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
      case 'info':
      case 'cyber':
        return 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]';
      default:
        return 'bg-slate-400';
    }
  };

  const sizeStyles = size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-semibold border rounded-full ${getStyles()} ${sizeStyles}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${getDotStyle()}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
