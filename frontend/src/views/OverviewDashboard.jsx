import React from 'react';
import {
  Package, Navigation, Cpu, AlertTriangle, CheckCircle,
  Clock, Truck, Train, Ship, ArrowUpRight, ShieldCheck, Activity
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import MapComponent from '../components/MapComponent';

export default function OverviewDashboard({
  metrics,
  fleetList = [],
  warehouses = [],
  shipments = [],
  alerts = [],
  onNavigateTab
}) {
  const kpis = metrics?.kpis || {
    total_shipments: 4,
    active_shipments: 4,
    delivered_shipments: 12,
    delayed_shipments: 1,
    total_vehicles: 7,
    active_fleet: 6,
    active_iot_devices: 6,
    critical_alerts: 1,
    avg_fleet_health: 93.5
  };

  const modalDistData = [
    { name: 'Road Express', value: metrics?.modal_distribution?.road || 1, color: '#3b82f6' },
    { name: 'Freight Rail', value: metrics?.modal_distribution?.rail || 1, color: '#059669' },
    { name: 'Maritime Sea', value: metrics?.modal_distribution?.sea || 1, color: '#0284c7' },
    { name: 'Smart Multimodal', value: metrics?.modal_distribution?.multimodal || 1, color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Control Tower Status Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-200 tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Centralized Multimodal Logistics Control Tower</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Operational Overview & Real-Time Monitoring
          </h2>
          <p className="text-xs text-blue-200 mt-1 max-w-xl">
            Coordinating unified freight across Road, Rail, and Sea networks. Real-time telemetry,
            AI route Pareto optimization, and Arrhenius food cold-chain compliance.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onNavigateTab('shipments')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <span>+ Create Shipment</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigateTab('simulation')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <span>Simulation Cockpit</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-[11px] font-semibold flex items-center justify-between">
            <span>Total Shipments</span>
            <Package className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-1">{kpis.total_shipments}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">+100% On Schedule</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-[11px] font-semibold flex items-center justify-between">
            <span>Active Shipments</span>
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-1">{kpis.active_shipments}</div>
          <div className="text-[10px] text-blue-600 font-medium mt-0.5">Underway In-Transit</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-[11px] font-semibold flex items-center justify-between">
            <span>Delivered</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-1">{kpis.delivered_shipments}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">SLA Verified</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-[11px] font-semibold flex items-center justify-between">
            <span>Delayed</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-1">{kpis.delayed_shipments}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">Port / Rail Queue</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-[11px] font-semibold flex items-center justify-between">
            <span>Total Fleet</span>
            <Navigation className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-1">{kpis.total_vehicles}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Road, Rail & Sea</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-[11px] font-semibold flex items-center justify-between">
            <span>Active Fleet</span>
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-1">{kpis.active_fleet}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">85% Utilization</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-[11px] font-semibold flex items-center justify-between">
            <span>Active IoT</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-1">{kpis.active_iot_devices}</div>
          <div className="text-[10px] text-cyan-600 font-medium mt-0.5">ESP32 & Sensors</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-[11px] font-semibold flex items-center justify-between">
            <span>Critical Alerts</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="text-xl font-black text-red-600 mt-1">{kpis.critical_alerts}</div>
          <div className="text-[10px] text-red-500 font-medium mt-0.5">Action Required</div>
        </div>
      </div>

      {/* Main Interactive Map & Transport Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <span>LIVE GLOBAL MULTIMODAL FLEET TRACKER</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    REAL-TIME STREAMING
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Interactive GIS visualization of Road highway convoys, WDFC railway freight, and Arabian Sea maritime container liners.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('fleet')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center"
              >
                View Full Fleet Details &rarr;
              </button>
            </div>

            <MapComponent
              fleetList={fleetList}
              warehouses={warehouses}
              height="440px"
            />
          </div>
        </div>

        {/* Modal Distribution & Cold Chain Status */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Modal Transport Distribution
            </h4>
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modalDistData}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {modalDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {modalDistData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value} shipments</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Cold Chain & IoT Health
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Reefer Temp Compliance</span>
                <span className="font-bold text-emerald-600">98.4% Nominal</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98.4%' }}></div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600">Mean Fleet Health</span>
                <span className="font-bold text-blue-600">{kpis.avg_fleet_health}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${kpis.avg_fleet_health}%` }}></div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600">Sensor Packet Reliability</span>
                <span className="font-bold text-indigo-600">99.8% (MQTT)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '99.8%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Active Shipments & Critical Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Shipments Table */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Recent Shipment Operations</h3>
            <button
              onClick={() => onNavigateTab('shipments')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              All Shipments &rarr;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-3">Tracking ID</th>
                  <th className="py-2.5 px-3">Corridor</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Cargo</th>
                  <th className="py-2.5 px-3">Progress</th>
                  <th className="py-2.5 px-3">Shelf Life</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {shipments.slice(0, 4).map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{s.tracking_number}</td>
                    <td className="py-2.5 px-3 text-slate-700">{s.origin} &rarr; {s.destination}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.transport_mode === 'ROAD' ? 'bg-blue-100 text-blue-800' :
                        s.transport_mode === 'RAIL' ? 'bg-emerald-100 text-emerald-800' :
                        s.transport_mode === 'SEA' ? 'bg-cyan-100 text-cyan-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {s.transport_mode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{s.cargo_type}</td>
                    <td className="py-2.5 px-3">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden inline-block mr-2">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${s.progress_percent}%` }}></div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">{Math.round(s.progress_percent)}%</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-emerald-700">
                      {s.remaining_shelf_life_hours?.toFixed(0)}h rem
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Alert Marquee */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Real-Time Incident Stream</span>
            </h3>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Manage &rarr;
            </button>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 3).map(a => (
              <div
                key={a.id}
                className={`p-3 rounded-lg border text-xs ${
                  a.severity === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-900' :
                  a.severity === 'HIGH' ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1 font-bold">
                  <span className="font-mono">{a.alert_code}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-bold">{a.severity}</span>
                </div>
                <div className="font-bold text-slate-800">{a.title}</div>
                <div className="text-[11px] text-slate-600 mt-1">{a.message}</div>
                <div className="mt-2 text-[10px] bg-white/70 p-1.5 rounded font-medium text-slate-700">
                  <span className="font-bold text-blue-700">Recommended Action:</span> {a.recommended_action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
