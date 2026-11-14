import React from 'react';
import {
  Shield, Key, Lock, CheckCircle2, XCircle, Users,
  Terminal, Server, Globe, Cpu, Radio
} from 'lucide-react';
import { USER_ROLES } from '../components/Navbar';

const PERMISSIONS = [
  { module: 'Overview Dashboard', admin: true, owner: true, fleet: true, driver: false, wh: false, iot: false, cust: false },
  { module: 'Shipment Create & Lifecycle', admin: true, owner: true, fleet: true, driver: false, wh: false, iot: false, cust: true },
  { module: 'AI Route Solver & Approval', admin: true, owner: true, fleet: false, driver: false, wh: false, iot: false, cust: false },
  { module: 'Fleet Telematics & Dispatch', admin: true, owner: true, fleet: true, driver: true, wh: false, iot: false, cust: false },
  { module: 'IoT Cargo & Cold Chain Monitoring', admin: true, owner: true, fleet: true, driver: true, wh: true, iot: true, cust: true },
  { module: 'Predictive Maintenance Work Orders', admin: true, owner: true, fleet: true, driver: false, wh: false, iot: true, cust: false },
  { module: 'Incident Triage & Alert Resolution', admin: true, owner: true, fleet: true, driver: false, wh: true, iot: true, cust: false },
  { module: 'Warehouse Bays & Inventory Management', admin: true, owner: true, fleet: false, driver: false, wh: true, iot: false, cust: false },
  { module: 'Device Provisioning & Token Management', admin: true, owner: false, fleet: false, driver: false, wh: false, iot: true, cust: false },
  { module: 'Simulation Cockpit & Chaos Engine', admin: true, owner: true, fleet: false, driver: false, wh: false, iot: false, cust: false },
  { module: 'Executive Reports & CSV Data Export', admin: true, owner: true, fleet: true, driver: false, wh: true, iot: false, cust: true },
];

export default function SettingsRBAC({ currentRole, onRoleChange }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Enterprise Security, RBAC & Protocol Configurations</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Role-Based Access Control & System Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Granular access enforcement across 7 enterprise stakeholder personas.
          </p>
        </div>
      </div>

      {/* Active Persona Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span>Active Persona Preset Switcher</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {USER_ROLES.map(role => (
            <button
              key={role.id}
              onClick={() => onRoleChange(role.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                currentRole === role.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs font-extrabold">{role.name}</div>
              <div className={`text-[11px] mt-1 ${currentRole === role.id ? 'text-blue-100' : 'text-slate-500'}`}>
                {role.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RBAC Permissions Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Enterprise Role-Based Permissions Matrix</h3>
          <span className="text-xs text-slate-500 font-mono">Enforced across APIs & UI</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3 px-4">System Capability / Module</th>
                <th className="py-3 px-2 text-center">Super Admin</th>
                <th className="py-3 px-2 text-center">Logistics Owner</th>
                <th className="py-3 px-2 text-center">Fleet Mgr</th>
                <th className="py-3 px-2 text-center">Driver</th>
                <th className="py-3 px-2 text-center">WH Mgr</th>
                <th className="py-3 px-2 text-center">IoT Lead</th>
                <th className="py-3 px-2 text-center">Customer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {PERMISSIONS.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-800">{p.module}</td>
                  <td className="py-2.5 px-2 text-center">{p.admin ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center">{p.owner ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center">{p.fleet ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center">{p.driver ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center">{p.wh ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center">{p.iot ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2.5 px-2 text-center">{p.cust ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backend & Broker Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-3">
          <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
            <Server className="w-4 h-4 text-blue-600" />
            <span>FastAPI Backend Gateway</span>
          </h4>
          <div className="space-y-1.5 font-mono text-slate-600 bg-slate-50 p-3 rounded-lg border">
            <div>HOST: 127.0.0.1:8000</div>
            <div>STATUS: RUNNING (UVICORN ASGI)</div>
            <div>DATABASE: SQLite (PostGIS / Postgres Schema Ready)</div>
            <div>OPTIMIZER ENGINE: Google OR-Tools v9.15</div>
            <div>WEBSOCKET BROADCAST: /ws/live (Active)</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-3">
          <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>IoT MQTT Ingestion Broker Specification</span>
          </h4>
          <div className="space-y-1.5 font-mono text-slate-600 bg-slate-50 p-3 rounded-lg border">
            <div>DEFAULT BROKER PORT: 1883 (TCP) / 8883 (TLS)</div>
            <div>INGESTION TOPIC: v1/devices/+/telemetry</div>
            <div>CLIENT COMPLIANCE: ESP32, Arduino MQTT, Paho-MQTT</div>
            <div>REST INGEST FALLBACK: POST /api/v1/telemetry/ingest</div>
            <div>TOKEN HEADER: X-Device-Token</div>
          </div>
        </div>
      </div>
    </div>
  );
}
