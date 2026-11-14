import React, { useState, useEffect } from 'react';
import {
  Bell, Shield, Activity, Radio, Cpu, User,
  ChevronDown, AlertTriangle, Layers
} from 'lucide-react';

export const USER_ROLES = [
  { id: 'SUPER_ADMIN', name: 'Super Admin', desc: 'Full System Access & Architecture Control' },
  { id: 'LOGISTICS_OWNER', name: 'Logistics Owner', desc: 'Command Control Tower & Approvals' },
  { id: 'FLEET_MANAGER', name: 'Fleet Manager', desc: 'Road, Rail & Sea Vehicle Dispatch' },
  { id: 'DRIVER_OPERATOR', name: 'Driver / Operator', desc: 'Road Cab & Locopilot Interface' },
  { id: 'WAREHOUSE_MANAGER', name: 'Warehouse Manager', desc: 'Bay Loading, Cross-Dock & Storage' },
  { id: 'IOT_MANAGER', name: 'IoT Telemetry Lead', desc: 'Sensors, ESP32 Gateway & Thresholds' },
  { id: 'CUSTOMER', name: 'Enterprise Customer', desc: 'Shipment Tracking & Delivery Proof' }
];

export default function Navbar({
  currentRole,
  onRoleChange,
  activeAlertsCount = 0,
  onNavigateToAlerts,
  simulationState = {}
}) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeRoleObj = USER_ROLES.find(r => r.id === currentRole) || USER_ROLES[1];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      {/* Left: Branding & Operating Mode Badge */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-700 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center space-x-2">
              <span>AGY MULTIMODAL LOGISTICS</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                Control Tower v1.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Road • Rail • Sea Intermodal Platform</p>
          </div>
        </div>

        {/* Bi-Modal Architecture Indicator */}
        <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-200">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>MODE A: SIMULATED</span>
          </div>
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
            <Cpu className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <span>ESP32 Hardware Ready</span>
          </div>
        </div>
      </div>

      {/* Right: Live Telemetry Status, Role Switcher, Alerts & Profile */}
      <div className="flex items-center space-x-4">
        {/* Real-time Clock & Simulator Status */}
        <div className="hidden sm:flex flex-col text-right text-xs">
          <span className="font-mono font-bold text-slate-700">{currentTime} UTC</span>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center justify-end">
            <Radio className="w-3 h-3 mr-1 animate-pulse" />
            Sim Rate: {simulationState.speed_multiplier || 1}x Speed
          </span>
        </div>

        {/* Quick Alerts Button */}
        <button
          onClick={onNavigateToAlerts}
          className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
          title="Active Alerts"
        >
          <Bell className="w-4 h-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* Role-Based Access Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition-all text-left"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              {activeRoleObj.name.charAt(0)}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-800">{activeRoleObj.name}</div>
              <div className="text-[10px] text-slate-500 font-medium">Switch Role</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Select Active Persona (RBAC)
              </div>
              <div className="max-h-72 overflow-y-auto">
                {USER_ROLES.map(role => (
                  <button
                    key={role.id}
                    onClick={() => {
                      onRoleChange(role.id);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex flex-col hover:bg-blue-50 transition-colors ${
                      currentRole === role.id ? 'bg-blue-50/70 border-l-4 border-blue-600 font-semibold' : ''
                    }`}
                  >
                    <span className="text-slate-800 font-bold">{role.name}</span>
                    <span className="text-[11px] text-slate-500">{role.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
