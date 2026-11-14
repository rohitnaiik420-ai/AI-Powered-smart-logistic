import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OverviewDashboard from './views/OverviewDashboard';
import ShipmentManagement from './views/ShipmentManagement';
import FleetTracking from './views/FleetTracking';
import RouteOptimization from './views/RouteOptimization';
import IoTCargoMonitoring from './views/IoTCargoMonitoring';
import PredictiveMaintenance from './views/PredictiveMaintenance';
import AlertsManagement from './views/AlertsManagement';
import WarehouseManagement from './views/WarehouseManagement';
import AnalyticsReports from './views/AnalyticsReports';
import DeviceManagement from './views/DeviceManagement';
import SimulationControl from './views/SimulationControl';
import SettingsRBAC from './views/SettingsRBAC';
import { api, createWebSocketConnection } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentRole, setCurrentRole] = useState('LOGISTICS_OWNER');

  // Core Platform Data States
  const [metrics, setMetrics] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [fleetList, setFleetList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [simulationState, setSimulationState] = useState({});
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    loadAllData();
  }, []);

  // Real-Time WebSocket Listener
  useEffect(() => {
    const ws = createWebSocketConnection(
      (data) => {
        setIsLiveConnected(true);
        if (data.type === 'TELEMETRY_UPDATE') {
          // Update live fleet coordinates smoothly
          setFleetList(prevFleet => {
            return prevFleet.map(f => {
              if (f.code === data.fleet?.code) {
                return {
                  ...f,
                  current_lat: data.location.lat,
                  current_lng: data.location.lng,
                  current_speed: data.location.speed,
                  heading: data.location.heading,
                  health_score: data.fleet?.health_score ?? f.health_score,
                  fuel_level: data.fleet?.fuel ?? f.fuel_level
                };
              }
              return f;
            });
          });

          // If new alert count generated, reload alerts & metrics
          if (data.new_alerts_count > 0) {
            loadAlerts();
            loadMetrics();
          }
        }
      },
      () => setIsLiveConnected(true),
      () => setIsLiveConnected(false)
    );

    // Backup polling every 6 seconds to ensure data freshness
    const interval = setInterval(() => {
      loadFleetAndShipments();
    }, 6000);

    return () => {
      if (ws) ws.close();
      clearInterval(interval);
    };
  }, []);

  const loadAllData = async () => {
    try {
      await Promise.all([
        loadMetrics(),
        loadFleetAndShipments(),
        loadWarehouses(),
        loadAlerts(),
        loadSimState()
      ]);
    } catch (e) {
      console.error("Initial load error", e);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await api.getOverviewMetrics();
      setMetrics(data);
    } catch (e) {}
  };

  const loadFleetAndShipments = async () => {
    try {
      const [f, s] = await Promise.all([
        api.getFleet('ALL'),
        api.getShipments()
      ]);
      setFleetList(f);
      setShipments(s);
    } catch (e) {}
  };

  const loadWarehouses = async () => {
    try {
      const data = await api.getWarehouses();
      setWarehouses(data);
    } catch (e) {}
  };

  const loadAlerts = async () => {
    try {
      const data = await api.getAlerts('ALL', 'ALL');
      setAlerts(data);
    } catch (e) {}
  };

  const loadSimState = async () => {
    try {
      const data = await api.getSimulationState();
      setSimulationState(data);
    } catch (e) {}
  };

  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Enterprise Control Tower Bar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeAlertsCount={activeAlertsCount}
        onNavigateToAlerts={() => setActiveTab('alerts')}
        simulationState={simulationState}
      />

      <div className="flex flex-1">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabSelect={setActiveTab}
          activeAlertsCount={activeAlertsCount}
        />

        {/* Main Operational View Container */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <OverviewDashboard
              metrics={metrics}
              fleetList={fleetList}
              warehouses={warehouses}
              shipments={shipments}
              alerts={alerts}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'shipments' && (
            <ShipmentManagement
              shipments={shipments}
              onRefresh={loadFleetAndShipments}
              onSelectShipmentForTracking={(s) => setActiveTab('fleet')}
            />
          )}

          {activeTab === 'fleet' && (
            <FleetTracking
              fleetList={fleetList}
              warehouses={warehouses}
            />
          )}

          {activeTab === 'optimizer' && (
            <RouteOptimization
              onShipmentCreated={() => {
                loadFleetAndShipments();
                loadMetrics();
              }}
            />
          )}

          {activeTab === 'iot' && (
            <IoTCargoMonitoring
              shipments={shipments}
            />
          )}

          {activeTab === 'maintenance' && (
            <PredictiveMaintenance />
          )}

          {activeTab === 'alerts' && (
            <AlertsManagement
              alerts={alerts}
              onRefresh={() => {
                loadAlerts();
                loadMetrics();
              }}
            />
          )}

          {activeTab === 'warehouses' && (
            <WarehouseManagement
              warehouses={warehouses}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsReports />
          )}

          {activeTab === 'devices' && (
            <DeviceManagement />
          )}

          {activeTab === 'simulation' && (
            <SimulationControl
              onSimulationToggled={() => {
                loadSimState();
                loadAlerts();
                loadMetrics();
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsRBAC
              currentRole={currentRole}
              onRoleChange={setCurrentRole}
            />
          )}
        </main>
      </div>
    </div>
  );
}
