const API_BASE = '/api/v1';

export const api = {
  // Overview
  getOverviewMetrics: () => fetch(`${API_BASE}/overview/metrics`).then(res => res.json()),

  // Shipments
  getShipments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/shipments/?${q}`).then(res => res.json());
  },
  getShipmentDetails: (idOrTracking) => fetch(`${API_BASE}/shipments/${idOrTracking}`).then(res => res.json()),
  createShipment: (data) => fetch(`${API_BASE}/shipments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  recordHandover: (shipmentId, data) => fetch(`${API_BASE}/shipments/${shipmentId}/handover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  confirmDelivery: (shipmentId, receiverName, notes) => fetch(`${API_BASE}/shipments/${shipmentId}/confirm-delivery?receiver_name=${encodeURIComponent(receiverName)}&notes=${encodeURIComponent(notes)}`, {
    method: 'POST'
  }).then(res => res.json()),
  getShipmentReport: (shipmentId) => fetch(`${API_BASE}/shipments/${shipmentId}/report`).then(res => res.json()),

  // Fleet
  getFleet: (type = 'ALL') => fetch(`${API_BASE}/fleet/?type=${type}`).then(res => res.json()),
  getRoadFleet: () => fetch(`${API_BASE}/fleet/road`).then(res => res.json()),
  getRailFleet: () => fetch(`${API_BASE}/fleet/rail`).then(res => res.json()),
  getSeaFleet: () => fetch(`${API_BASE}/fleet/sea`).then(res => res.json()),

  // AI Route Optimizer
  optimizeRoute: (data) => fetch(`${API_BASE}/optimizer/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  approveAndCreateShipment: (data) => fetch(`${API_BASE}/optimizer/approve-and-create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  // IoT & Quality
  getDevicesTelemetry: () => fetch(`${API_BASE}/iot/devices-telemetry`).then(res => res.json()),
  getDeviceHistory: (deviceId, limit = 50) => fetch(`${API_BASE}/iot/history/${deviceId}?limit=${limit}`).then(res => res.json()),
  getFoodProfiles: () => fetch(`${API_BASE}/iot/food-profiles`).then(res => res.json()),
  getShelfLifeAnalysis: (tracking) => fetch(`${API_BASE}/iot/shelf-life-analysis/${tracking}`).then(res => res.json()),

  // Predictive Maintenance
  getFleetHealth: () => fetch(`${API_BASE}/maintenance/fleet-health`).then(res => res.json()),
  getMaintenanceSchedules: () => fetch(`${API_BASE}/maintenance/schedules`).then(res => res.json()),
  scheduleMaintenance: (data) => fetch(`${API_BASE}/maintenance/schedule-order?fleet_code=${data.fleet_code}&service_type=${encodeURIComponent(data.service_type)}&technician_name=${encodeURIComponent(data.technician_name)}&scheduled_days_ahead=${data.scheduled_days_ahead}`, {
    method: 'POST'
  }).then(res => res.json()),

  // Alerts
  getAlerts: (status = 'ALL', severity = 'ALL') => fetch(`${API_BASE}/alerts/?status=${status}&severity=${severity}`).then(res => res.json()),
  updateAlertStatus: (alertId, data) => fetch(`${API_BASE}/alerts/${alertId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  // Warehouses
  getWarehouses: () => fetch(`${API_BASE}/warehouses/`).then(res => res.json()),
  getWarehouseOperations: (id) => fetch(`${API_BASE}/warehouses/${id}/operations`).then(res => res.json()),

  // Devices
  getDevices: (sourceMode = 'ALL') => fetch(`${API_BASE}/devices/?source_mode=${sourceMode}`).then(res => res.json()),
  registerDevice: (data) => fetch(`${API_BASE}/devices/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  regenerateDeviceToken: (deviceId) => fetch(`${API_BASE}/devices/${deviceId}/regenerate-token`, { method: 'POST' }).then(res => res.json()),

  // Simulation
  getSimulationState: () => fetch(`${API_BASE}/simulation/state`).then(res => res.json()),
  controlSimulation: (action, speedMultiplier = null) => fetch(`${API_BASE}/simulation/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, speed_multiplier: speedMultiplier })
  }).then(res => res.json()),
  injectAnomaly: (anomalyType, entityCode = null) => fetch(`${API_BASE}/simulation/anomaly`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anomaly_type: anomalyType, entity_code: entityCode })
  }).then(res => res.json()),

  // Analytics
  getAnalyticsSummary: () => fetch(`${API_BASE}/analytics/summary`).then(res => res.json()),
  getExportCsvUrl: () => `${API_BASE}/analytics/export/csv`
};

export function createWebSocketConnection(onMessage, onOpen, onClose) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/live`;
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    if (onOpen) onOpen();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch (e) {
      console.error("WS Parse error", e);
    }
  };

  socket.onclose = () => {
    if (onClose) onClose();
  };

  return socket;
}
