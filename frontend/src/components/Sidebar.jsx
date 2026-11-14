import React from 'react';
import {
  LayoutDashboard, Package, Navigation, Cpu,
  ThermometerSnowflake, Wrench, AlertTriangle,
  Building2, BarChart3, HardDrive, PlayCircle, Settings
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
  { id: 'shipments', label: 'Shipment Management', icon: Package, badge: '14 Steps' },
  { id: 'fleet', label: 'Fleet & Tracking', icon: Navigation, subtitle: 'Road • Rail • Sea' },
  { id: 'optimizer', label: 'AI Route Optimization', icon: Cpu, badge: 'OR-Tools' },
  { id: 'iot', label: 'IoT Cargo Monitoring', icon: ThermometerSnowflake, subtitle: 'Cold Chain & Food' },
  { id: 'maintenance', label: 'Predictive Maintenance', icon: Wrench, subtitle: 'RUL & Health' },
  { id: 'alerts', label: 'Alerts & Incidents', icon: AlertTriangle, hasAlerts: true },
  { id: 'warehouses', label: 'Warehouse Management', icon: Building2 },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3, badge: 'Export CSV' },
  { id: 'devices', label: 'Device Management', icon: HardDrive, subtitle: 'ESP32 & Sensors' },
  { id: 'simulation', label: 'Simulation Cockpit', icon: PlayCircle, badge: 'Chaos Tools' },
  { id: 'settings', label: 'Settings & RBAC', icon: Settings }
];

export default function Sidebar({ activeTab, onTabSelect, activeAlertsCount = 0 }) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none overflow-y-auto">
      <div className="py-4">
        <div className="px-5 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Control Tower Navigation
        </div>
        <nav className="space-y-0.5 px-3">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`} />
                  <div className="text-left">
                    <div className="leading-tight">{item.label}</div>
                    {item.subtitle && (
                      <div className={`text-[10px] font-normal leading-tight mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {item.hasAlerts && activeAlertsCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-red-600' : 'bg-red-100 text-red-700'
                    }`}>
                      {activeAlertsCount}
                    </span>
                  )}
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Footer info */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
          <span className="font-semibold">Transport Stack</span>
          <span className="font-mono text-emerald-600 font-bold">ONLINE</span>
        </div>
        <div className="text-[10px] text-slate-500 space-y-0.5">
          <div>• Road: NH48 Corridor (GPS)</div>
          <div>• Rail: WDFC Heavy-Haul</div>
          <div>• Sea: Arabian Sea (AIS)</div>
        </div>
      </div>
    </aside>
  );
}
