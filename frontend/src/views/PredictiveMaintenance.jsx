import React, { useState, useEffect } from 'react';
import {
  Wrench, Activity, AlertTriangle, CheckCircle, Clock,
  Calendar, ShieldAlert, Cpu, Plus, FileText, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function PredictiveMaintenance() {
  const [fleetHealthData, setFleetHealthData] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedFleetCode, setSelectedFleetCode] = useState('TRK-101');
  const [serviceType, setServiceType] = useState('Brake Rotor Replacement & Pad Service');
  const [technician, setTechnician] = useState('Master Tech Suresh Patil');

  useEffect(() => {
    loadMaintenanceData();
  }, []);

  const loadMaintenanceData = async () => {
    try {
      const [health, sched] = await Promise.all([
        api.getFleetHealth(),
        api.getMaintenanceSchedules()
      ]);
      setFleetHealthData(health);
      setSchedules(sched);
    } catch (e) {
      console.error("Error loading maintenance data", e);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await api.scheduleMaintenance({
        fleet_code: selectedFleetCode,
        service_type: serviceType,
        technician_name: technician,
        scheduled_days_ahead: 10
      });
      setOrderModalOpen(false);
      alert("Proactive maintenance order created successfully!");
      loadMaintenanceData();
    } catch (err) {
      alert("Error creating order: " + err.message);
    }
  };

  const assets = fleetHealthData?.assets || [];
  const summary = fleetHealthData?.summary || {
    total_fleet_assets: 7,
    healthy_count: 5,
    warning_count: 1,
    critical_count: 1,
    avg_health_score: 91.5
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>AI Equipment Telematics & Predictive Degradation Modeling</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Predictive Maintenance & Fleet Health Tower
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time engine thermal analysis, oil pressure sensors, brake wear regression, and Remaining Useful Life (RUL) projections.
          </p>
        </div>

        <button
          onClick={() => setOrderModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Service Order</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Fleet Average Health</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{summary.avg_health_score}%</div>
          <span className="text-[11px] text-slate-400">SAE Class-A Baseline</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Healthy Units</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{summary.healthy_count} Assets</div>
          <span className="text-[11px] text-emerald-600 font-medium">Routine maintenance only</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Warning / Impending Wear</span>
          <div className="text-2xl font-black text-amber-500 mt-1">{summary.warning_count} Asset</div>
          <span className="text-[11px] text-amber-600 font-medium">Service within 30 days</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Critical Overhaul</span>
          <div className="text-2xl font-black text-red-600 mt-1">{summary.critical_count} Asset</div>
          <span className="text-[11px] text-red-500 font-medium">Immediate shop inspection</span>
        </div>
      </div>

      {/* Fleet Asset Health Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Fleet Equipment Health & RUL Projections</h3>
          <span className="text-xs text-slate-500 font-mono">Sensors: Oil Press • Coolant • Brake Lining • Vibration</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Asset Code</th>
                <th className="py-3 px-4">Equipment Name</th>
                <th className="py-3 px-4">Mode / Type</th>
                <th className="py-3 px-4">Health Score</th>
                <th className="py-3 px-4">Remaining Useful Life (RUL)</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Next Inspection</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {assets.map(a => (
                <tr key={a.code} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{a.code}</td>
                  <td className="py-3 px-4 text-slate-800 font-bold">{a.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {a.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            a.health_score < 50 ? 'bg-red-500' :
                            a.health_score < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${a.health_score}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-slate-800">{a.health_score}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-800">{a.remaining_useful_life_days} Days</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      a.urgency === 'IMMEDIATE' ? 'bg-red-100 text-red-800' :
                      a.urgency === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {a.urgency}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{a.next_service_projected}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedFleetCode(a.code);
                        setOrderModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold transition-all"
                    >
                      Book Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduled Maintenance Work Orders */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Active Maintenance Schedules & Repair Work Orders</span>
        </h3>

        <div className="space-y-2.5">
          {schedules.map(s => (
            <div key={s.id} className="p-3.5 rounded-xl border bg-slate-50/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-blue-600">ORDER-#{s.id}</span>
                  <span className="font-bold text-slate-800">{s.service_type}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                    {s.status}
                  </span>
                </div>
                <div className="text-slate-500 mt-1">
                  Lead Technician: <b>{s.technician_name}</b> • Fault Code: <code className="font-mono bg-white px-1.5 py-0.5 rounded border">{s.fault_codes}</code>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5 italic">
                  AI Recommendation: {s.ai_recommendation}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-bold text-slate-800">${s.cost_usd}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Due: {new Date(s.scheduled_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SCHEDULE MAINTENANCE MODAL */}
      {orderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              <span>Schedule Predictive Maintenance Order</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Dispatches certified field mechanic to inspect vehicle telematics and wear parts.
            </p>

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Asset</label>
                <select
                  value={selectedFleetCode}
                  onChange={(e) => setSelectedFleetCode(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white font-mono font-bold"
                >
                  {assets.map(a => (
                    <option key={a.code} value={a.code}>
                      {a.code} - {a.name} (Health: {a.health_score}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Service Task</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white"
                >
                  <option value="Brake Rotor Replacement & Pad Service">Brake Rotor Replacement & Pad Service</option>
                  <option value="Reefer Compressor Overhaul & Refrigerant Recharge">Reefer Compressor Overhaul & Refrigerant Recharge</option>
                  <option value="Engine Coolant Flush & Thermostat Replacement">Engine Coolant Flush & Thermostat Replacement</option>
                  <option value="Locomotive Pantograph & Traction Diagnostic">Locomotive Pantograph & Traction Diagnostic</option>
                  <option value="Ocean Vessel Auxiliary Generator Tune-up">Ocean Vessel Auxiliary Generator Tune-up</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Certified Technician</label>
                <input
                  type="text"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow"
                >
                  Dispatch Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
