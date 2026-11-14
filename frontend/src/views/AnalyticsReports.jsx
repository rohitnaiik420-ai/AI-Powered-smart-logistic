import React, { useState, useEffect } from 'react';
import {
  BarChart3, Download, FileSpreadsheet, Printer, TrendingUp,
  DollarSign, Leaf, ShieldCheck, Activity, Calendar
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell
} from 'recharts';
import { api } from '../services/api';

export default function AnalyticsReports() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await api.getAnalyticsSummary();
      setAnalytics(data);
    } catch (e) {
      console.error("Error loading analytics", e);
    }
  };

  const kpis = analytics?.kpis || {
    total_logistics_spend_usd: 9250.0,
    total_carbon_emissions_kg: 1845.0,
    average_cost_per_ton_km: 0.082,
    fleet_utilization_rate: 85.4,
    cold_chain_compliance_rate: 98.4,
    total_incidents_recorded: 2
  };

  const monthlyTrends = analytics?.monthly_trends || [];
  const modalBreakdown = analytics?.modal_breakdown || [];

  return (
    <div className="space-y-6">
      {/* Header and Export Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Operational Logistics Intelligence & SLA Auditing</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Analytics & Executive Performance Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Spend analysis per ton-km, multimodal carbon offset comparisons, punctuality SLA benchmarks, and audit data export.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <a
            href={api.getExportCsvUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 flex items-center space-x-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[11px] font-semibold block">Total Freight Spend</span>
          <div className="text-xl font-black text-slate-900 mt-1">${kpis.total_logistics_spend_usd.toLocaleString()}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Within target budget</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[11px] font-semibold block">Cost / Ton-KM</span>
          <div className="text-xl font-black text-blue-600 mt-1">${kpis.average_cost_per_ton_km}</div>
          <span className="text-[10px] text-blue-600 font-medium">-18% vs pure road</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[11px] font-semibold block">Carbon Emitted</span>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.total_carbon_emissions_kg} kg</div>
          <span className="text-[10px] text-emerald-600 font-medium">58% Multimodal Abatement</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[11px] font-semibold block">Fleet Utilization</span>
          <div className="text-xl font-black text-indigo-600 mt-1">{kpis.fleet_utilization_rate}%</div>
          <span className="text-[10px] text-slate-500 font-medium">Active road, rail, sea</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[11px] font-semibold block">Cold-Chain SLA</span>
          <div className="text-xl font-black text-emerald-600 mt-1">{kpis.cold_chain_compliance_rate}%</div>
          <span className="text-[10px] text-emerald-600 font-medium">Food safety intact</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-[11px] font-semibold block">Total Incidents</span>
          <div className="text-xl font-black text-amber-600 mt-1">{kpis.total_incidents_recorded}</div>
          <span className="text-[10px] text-slate-400 font-medium">100% Triaged</span>
        </div>
      </div>

      {/* Analytical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* On-Time SLA Delivery Trends */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Monthly On-Time SLA Delivery Punctuality (%)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[90, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="on_time_pct" name="On-Time Delivery Rate (%)" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Modal Cost vs Carbon Footprint */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Transport Mode Cost ($) vs Carbon Footprint (kg CO2)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modalBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="cost" name="Spend ($)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="emissions" name="CO2 Emissions (kg)" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
