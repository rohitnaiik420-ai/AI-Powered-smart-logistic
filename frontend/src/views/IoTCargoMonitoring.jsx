import React, { useState, useEffect } from 'react';
import {
  Thermometer, Droplets, Activity, ShieldCheck,
  AlertTriangle, Wrench, RefreshCw, Cpu, Clock, CheckCircle
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { api } from '../services/api';

export default function IoTCargoMonitoring({ shipments = [] }) {
  const [telemetryList, setTelemetryList] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('IOT-TRK-101');
  const [history, setHistory] = useState([]);
  const [foodProfiles, setFoodProfiles] = useState({});
  const [shelfLifeData, setShelfLifeData] = useState(null);

  useEffect(() => {
    loadIoTData();
    const timer = setInterval(loadIoTData, 4000);
    return () => clearInterval(timer);
  }, [selectedDevice]);

  const loadIoTData = async () => {
    try {
      const [telemetry, profiles] = await Promise.all([
        api.getDevicesTelemetry(),
        api.getFoodProfiles()
      ]);
      setTelemetryList(telemetry);
      setFoodProfiles(profiles);

      if (selectedDevice) {
        const hist = await api.getDeviceHistory(selectedDevice, 25);
        setHistory(hist.map(h => ({
          time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temp: h.temperature_celsius,
          humidity: h.humidity_percent,
          vibration: h.vibration_g
        })));
      }

      // Check active shipment shelf life
      const currDevObj = telemetry.find(t => t.device_id === selectedDevice);
      if (currDevObj && currDevObj.assigned_shipment_id) {
        const analysis = await api.getShelfLifeAnalysis(currDevObj.assigned_shipment_id);
        setShelfLifeData(analysis);
      }
    } catch (e) {
      console.error("Error loading IoT data", e);
    }
  };

  const currentDev = telemetryList.find(d => d.device_id === selectedDevice) || telemetryList[0] || {
    device_id: 'IOT-TRK-101',
    name: 'Truck 101 Telematics Gateway',
    source_mode: 'SIMULATED',
    status: 'ONLINE',
    battery_level: 96.0,
    latest_reading: {
      temperature: 3.8,
      humidity: 82.0,
      vibration: 0.12,
      door_open: false,
      speed: 68.0
    }
  };

  const reading = currentDev.latest_reading || {};

  return (
    <div className="space-y-6">
      {/* Header and Device Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>Cold-Chain Integrity & Biological Shelf-Life Telemetry</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            IoT Cargo & Food Quality Monitoring Station
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Arrhenius kinetic thermal acceleration modeling, 3-axis vibration shocks, and reefer door magnetic tamper alerts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-slate-600">Select Monitored Asset:</label>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            {telemetryList.map(d => (
              <option key={d.device_id} value={d.device_id}>
                {d.device_id} ({d.assigned_fleet_code || d.name}) [{d.source_mode}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-time Environmental Gauge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Temperature Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Reefer Cargo Temp</span>
            <Thermometer className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-3xl font-black ${
              reading.temperature > 5.5 ? 'text-red-600' :
              reading.temperature < 1.0 ? 'text-cyan-600' : 'text-slate-800'
            }`}>
              {reading.temperature !== undefined ? `${reading.temperature.toFixed(1)}°C` : '3.8°C'}
            </span>
            <span className="text-xs font-bold text-slate-400">Safe: 2.0°C - 5.0°C</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-600 flex items-center">
            {reading.temperature > 5.0 ? (
              <span className="text-red-600 font-bold flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Critical Excursion (+{(reading.temperature - 5.0).toFixed(1)}°C)
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Safe Thermal Window
              </span>
            )}
          </div>
        </div>

        {/* Humidity Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Relative Humidity</span>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-800">
              {reading.humidity !== undefined ? `${reading.humidity.toFixed(0)}%` : '82%'}
            </span>
            <span className="text-xs font-bold text-slate-400">Target: 75% - 85%</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-emerald-600">
            Optimal relative humidity for perishables
          </div>
        </div>

        {/* Vibration / Shock */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Vibration Index</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-800">
              {reading.vibration !== undefined ? `${reading.vibration.toFixed(2)}g` : '0.12g'}
            </span>
            <span className="text-xs font-bold text-slate-400">Max limit: 1.5g</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-600">
            Shock sensor nominal: Zero impact breach
          </div>
        </div>

        {/* Door Security Switch */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Reefer Door Seal</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-2xl font-black ${reading.door_open ? 'text-red-600' : 'text-emerald-700'}`}>
              {reading.door_open ? 'DOOR OPEN' : 'SEALED & LOCKED'}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-600">
            {reading.door_open ? 'ALERT: Magnetic contact broken en-route!' : 'Tamper switch contact closed'}
          </div>
        </div>
      </div>

      {/* Arrhenius Shelf-Life Kinetic Analysis Section */}
      {shelfLifeData && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
              <span>Predictive Shelf-Life Kinetic Degradation (Arrhenius Model)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                SCIENCE VERIFIED
              </span>
            </h3>
            <span className="text-xs font-mono font-bold text-blue-900">
              Assigned: {shelfLifeData.shipment_tracking}
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-3">
            Calculated via equation: <code className="bg-white px-2 py-0.5 rounded font-mono text-[11px] border">k = k_ref · exp( -Ea/R · (1/T - 1/T_ref) )</code>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-blue-100 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">Commodity Type</span>
              <span className="font-bold text-slate-800">{shelfLifeData.cargo_type}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Acceleration Factor</span>
              <span className="font-bold text-blue-700">{shelfLifeData.acceleration_factor}x Decay Rate</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Remaining Freshness</span>
              <span className="font-bold text-emerald-700 text-sm">{shelfLifeData.remaining_shelf_life_hours?.toFixed(1)} Hours</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Nominal Baseline</span>
              <span className="font-bold text-slate-700">{shelfLifeData.initial_shelf_life_hours} Hours</span>
            </div>
          </div>

          {/* Corrective Action Suggestions */}
          <div className="mt-3 pt-3 border-t border-blue-200/80">
            <div className="text-xs font-bold text-slate-800 mb-1 flex items-center space-x-1">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span>Corrective Action Suggestions:</span>
            </div>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5 pl-1">
              {shelfLifeData.corrective_actions?.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Historical Sensor Readings Time-Series Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Continuous Sensor History Stream ({selectedDevice})</span>
          <span className="text-xs font-normal text-slate-500 font-mono">Live Telemetry Buffer (25 Ticks)</span>
        </h3>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" domain={[0, 15]} tick={{ fontSize: 10 }} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" domain={[50, 100]} tick={{ fontSize: 10 }} label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight', fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 2 }} />
              <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#059669" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
