import React from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('SentinelFusion React ErrorBoundary caught an exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen bg-[#060b13] text-slate-100 font-sans items-center justify-center p-6 select-none">
          <div className="max-w-xl w-full tactical-card rounded-2xl p-8 border border-rose-500/40 shadow-[0_0_40px_rgba(244,63,94,0.2)] space-y-6">
            {/* Header Badge */}
            <div className="flex items-center gap-3 border-b border-rose-500/20 pb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-wide font-mono flex items-center gap-2">
                  SENTINEL<span className="text-rose-400">FUSION</span> AI
                </h1>
                <p className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
                  Application Runtime Error Intercepted
                </p>
              </div>
            </div>

            {/* Error Details Container */}
            <div className="bg-police-950/80 rounded-xl p-4 border border-rose-500/20 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Component Error Report:</span>
              </div>
              
              <div className="p-3 bg-rose-950/30 rounded-lg text-slate-300 border border-rose-900/40 overflow-x-auto text-[11px]">
                <p className="text-rose-300 font-bold">{this.state.error?.toString() || 'Unknown React Rendering Error'}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-slate-400 text-[10px] leading-relaxed overflow-x-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400">
                The error has been isolated. The rest of the platform remains safe.
              </p>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
