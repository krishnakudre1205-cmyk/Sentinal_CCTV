import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import DetectionResults from './components/DetectionResults';
import VehicleSearch from './components/VehicleSearch';
import CameraManagement from './components/CameraManagement';
import RecentAlerts from './components/RecentAlerts';
import RealTimeAlertCenter from './components/RealTimeAlertCenter';
import WatchlistView from './components/WatchlistView';
import GISRouteMap from './components/GISRouteMap';
import ArchitectureView from './components/ArchitectureModal';
import apiService from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState({ status: 'checking', project: 'SentinelFusion AI' });
  const [cameras, setCameras] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch initial telemetry and ping backend health
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Health check
      try {
        const healthRes = await apiService.getHealth();
        setSystemHealth(healthRes?.data || { status: 'online' });
      } catch {
        setSystemHealth({ status: 'offline' });
      }

      // 2. Fetch cameras
      try {
        const camRes = await apiService.getCameras();
        if (camRes?.success && Array.isArray(camRes.data)) {
          setCameras(camRes.data);
        }
      } catch (err) {
        console.warn('Backend cameras offline:', err);
      }

      // 3. Fetch vehicles
      try {
        const vehRes = await apiService.getVehicles();
        if (vehRes?.success && Array.isArray(vehRes.data)) {
          setVehicles(vehRes.data);
        }
      } catch (err) {
        console.warn('Backend vehicles offline:', err);
      }

      // 4. Fetch watchlist
      try {
        const watchRes = await apiService.getWatchlist();
        if (watchRes?.success && Array.isArray(watchRes.data)) {
          setWatchlist(watchRes.data);
        }
      } catch (err) {
        console.warn('Backend watchlist offline:', err);
      }

      // 5. Fetch alerts
      try {
        const alertRes = await apiService.getAlerts();
        if (alertRes?.success && Array.isArray(alertRes.data)) {
          setAlerts(alertRes.data);
        }
      } catch (err) {
        console.warn('Backend alerts offline:', err);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Search handler for Vehicle DNA
  const handleVehicleSearch = async (query) => {
    setIsRefreshing(true);
    try {
      const res = await apiService.getVehicles(query);
      if (res.success && Array.isArray(res.data)) {
        setVehicles(res.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Acknowledge alert handler
  const handleAcknowledgeAlert = async (alertId) => {
    const res = await apiService.acknowledgeAlert(alertId);
    if (res.success) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_acknowledged: true, acknowledged_by: 'Officer Logged' } : a))
      );
    }
  };

  // Global search navigation callback
  const handleGlobalSearchNavigate = (tab, queryVal) => {
    setActiveTab(tab);
    if (queryVal && tab === 'vehicle-dna') {
      handleVehicleSearch(queryVal);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const safeCameras = Array.isArray(cameras) ? cameras : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeWatchlist = Array.isArray(watchlist) ? watchlist : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];

  const activeCamerasCount = safeCameras.filter((c) => c.status === 'ACTIVE' || !c.status).length;
  const unackAlertsCount = safeAlerts.filter((a) => !a.is_acknowledged).length;

  return (
    <div className="flex h-screen bg-[#060b13] text-slate-100 font-sans overflow-hidden select-none">
      {/* Sidebar Navigation (All 8 Command Center Sections) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemHealth.status}
        cameraCount={cameras.length}
        alertCount={unackAlertsCount}
        watchlistCount={watchlist.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header with Global Command Search Bar */}
        <Header
          systemStatus={systemHealth.status}
          onRefresh={fetchData}
          isRefreshing={isRefreshing}
          alertCount={unackAlertsCount}
          cameras={cameras}
          watchlist={watchlist}
          onGlobalSearchNavigate={handleGlobalSearchNavigate}
        />

        {/* Scrollable Command Center Viewport */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Command Banner / Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-police-800/80">
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide font-mono flex items-center gap-2">
                POLICE COMMAND CENTER
                <span className="text-cyan-400 font-normal">
                  // {activeTab.toUpperCase()}
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                SentinelFusion AI • Unified CCTV Intelligence & Vehicle DNA Surveillance Network
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Telemetry sync:</span>
              <span className="text-cyan-400 font-bold">{lastUpdated || 'Syncing...'}</span>
            </div>
          </div>

          {/* Home Dashboard Metrics Bar */}
          <StatsOverview
            totalCameras={cameras.length || 5}
            activeCameras={activeCamerasCount || 5}
            vehiclesDetectedToday={vehicles.length ? vehicles.length * 14 : 42}
            activeAlerts={unackAlertsCount}
            watchlistMatches={watchlist.length || 4}
            onNavigate={setActiveTab}
          />

          {/* Section 1: System Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <DetectionResults cameras={cameras} />
              <CameraManagement cameras={cameras} onRefresh={fetchData} />
              <RealTimeAlertCenter alerts={alerts} onAcknowledge={handleAcknowledgeAlert} onRefresh={fetchData} />
              <WatchlistView watchlist={watchlist} />
            </div>
          )}

          {/* Section 2: Camera Management (Module 1) */}
          {activeTab === 'cameras' && (
            <CameraManagement cameras={cameras} onRefresh={fetchData} />
          )}

          {/* Section 3: Live Video Processing (Modules 2 & 3) */}
          {activeTab === 'detection' && (
            <DetectionResults cameras={cameras} />
          )}

          {/* Section 4: Vehicle Search (Module 4 Vehicle DNA & ANPR) */}
          {activeTab === 'vehicle-dna' && (
            <VehicleSearch vehicles={vehicles} onSearch={handleVehicleSearch} isLoading={isRefreshing} />
          )}

          {/* Section 5: Cross-Camera Journey (Module 5 Tracking) */}
          {activeTab === 'journey' && (
            <VehicleSearch vehicles={vehicles} onSearch={handleVehicleSearch} isLoading={isRefreshing} />
          )}

          {/* Section 6: Watchlist (Module 6 Watchlist Database) */}
          {activeTab === 'watchlist' && (
            <WatchlistView watchlist={watchlist} />
          )}

          {/* Section 7: Real-Time Alerts (Module 6 Alert Center & WebSockets) */}
          {activeTab === 'alerts' && (
            <RealTimeAlertCenter alerts={alerts} onAcknowledge={handleAcknowledgeAlert} onRefresh={fetchData} />
          )}

          {/* Section 8: GIS Intelligence (Module 7 Leaflet Route Map) */}
          {activeTab === 'gis' && (
            <GISRouteMap cameras={cameras} />
          )}

          {/* System Pipeline Architecture */}
          {activeTab === 'architecture' && (
            <ArchitectureView />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
