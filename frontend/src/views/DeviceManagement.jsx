import React, { useState, useEffect } from 'react';
import {
  HardDrive, Cpu, Plus, Key, RefreshCw, Copy, Check,
  Radio, CheckCircle2, AlertTriangle, Code, Terminal
} from 'lucide-react';
import { api } from '../services/api';

export default function DeviceManagement() {
  const [devices, setDevices] = useState([]);
  const [modeFilter, setModeFilter] = useState('ALL');
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);

  const [newDevice, setNewDevice] = useState({
    device_id: 'ESP32-COLD-HW02',
    name: 'Reefer Trailer 104 Sensor Pod',
    device_type: 'CARGO_MONITOR',
    source_mode: 'HARDWARE',
    firmware_version: 'v1.1.0-prod'
  });

  useEffect(() => {
    loadDevices();
  }, [modeFilter]);

  const loadDevices = async () => {
    try {
      const data = await api.getDevices(modeFilter);
      setDevices(data);
    } catch (e) {
      console.error("Error loading devices", e);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.registerDevice(newDevice);
      setRegisterModalOpen(false);
      alert("Device registered successfully! Auth token generated.");
      loadDevices();
    } catch (err) {
      alert("Error registering device: " + err.message);
    }
  };

  const handleRegenerateToken = async (deviceId) => {
    if (!confirm(`Regenerate authentication token for ${deviceId}? Current hardware sessions will be invalidated.`)) return;
    try {
      await api.regenerateDeviceToken(deviceId);
      alert("Token regenerated successfully.");
      loadDevices();
    } catch (e) {
      alert("Error regenerating token: " + e.message);
    }
  };

  const handleCopy = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Register */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>Bi-Modal Edge Architecture: Zero-Refactor Hardware Readiness</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            IoT Edge Gateway & Device Management Registry
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Register and provision physical hardware (ESP32, Quectel LTE GPS, SHT31, ADXL345) and virtual simulation sensors.
            Both pipelines stream through the standardized unified backend ingestion engine.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700"
          >
            <option value="ALL">All Modes</option>
            <option value="HARDWARE">Physical Hardware Only</option>
            <option value="SIMULATED">Simulated Virtual Only</option>
          </select>

          <button
            onClick={() => setRegisterModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Register Edge Device</span>
          </button>
        </div>
      </div>

      {/* Hardware Connection Protocol Contract Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 font-mono">
            <Terminal className="w-4 h-4" />
            <span>Standardized Ingestion Protocol Contract (REST & MQTT)</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
            MQTT BROKER READY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 font-bold mb-1">REST API Ingestion Fallback</div>
            <div className="text-blue-400">POST /api/v1/telemetry/ingest</div>
            <div className="text-slate-400">Headers: <span className="text-amber-400">X-Device-Token: &lt;token&gt;</span></div>
            <div className="text-slate-400">Content-Type: application/json</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 font-bold mb-1">MQTT Telemetry Topic</div>
            <div className="text-emerald-400">v1/devices/{'{device_id}'}/telemetry</div>
            <div className="text-slate-400">QoS: 1 (At Least Once Delivery)</div>
            <div className="text-slate-400">Keep-Alive Heartbeat: 60 seconds</div>
          </div>
        </div>
      </div>

      {/* Devices Master Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Registered Telematics Nodes & Gateways</h3>
          <span className="text-xs text-slate-500 font-mono">Total Provisioned: {devices.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Device ID</th>
                <th className="py-3 px-4">Device Name</th>
                <th className="py-3 px-4">Operating Mode</th>
                <th className="py-3 px-4">Assigned Entity</th>
                <th className="py-3 px-4">Authentication Token</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Ping</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {devices.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{d.device_id}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    <div>{d.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{d.device_type} • {d.firmware_version}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.source_mode === 'HARDWARE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {d.source_mode === 'HARDWARE' ? 'PHYSICAL HARDWARE' : 'SIMULATED'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {d.assigned_fleet_code || d.assigned_shipment_id || 'Unassigned / Standby'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <span className="truncate max-w-[120px] bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {d.auth_token}
                      </span>
                      <button
                        onClick={() => handleCopy(d.auth_token)}
                        className="text-slate-400 hover:text-blue-600"
                        title="Copy Token"
                      >
                        {copiedToken === d.auth_token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                      ONLINE
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(d.last_ping).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRegenerateToken(d.device_id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition-all"
                    >
                      Regen Token
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER NEW EDGE DEVICE MODAL */}
      {registerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-blue-600" />
              <span>Register New Edge Device</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configures credentials for physical ESP32/microcontroller or a virtual simulator agent.
            </p>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Operating Mode</label>
                <select
                  value={newDevice.source_mode}
                  onChange={(e) => setNewDevice({ ...newDevice, source_mode: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white font-bold"
                >
                  <option value="HARDWARE">Physical Hardware (ESP32, Cellular Gateway)</option>
                  <option value="SIMULATED">Virtual Simulation Stream</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Unique Device ID</label>
                <input
                  type="text"
                  value={newDevice.device_id}
                  onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Device Descriptive Name</label>
                <input
                  type="text"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Device Type</label>
                  <select
                    value={newDevice.device_type}
                    onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="CARGO_MONITOR">Cargo Cold Monitor</option>
                    <option value="FLEET_TELEMATICS">Fleet Telematics Hub</option>
                    <option value="WAREHOUSE_BEACON">Warehouse RFID Beacon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Firmware Version</label>
                  <input
                    type="text"
                    value={newDevice.firmware_version}
                    onChange={(e) => setNewDevice({ ...newDevice, firmware_version: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow"
                >
                  Register Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
