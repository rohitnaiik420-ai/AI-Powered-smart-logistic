import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle, ShieldAlert, Clock,
  Filter, Check, UserCheck, MessageSquare, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function AlertsManagement({ alerts = [], onRefresh }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolveNote, setResolveNote] = useState('');

  const filtered = alerts.filter(a => {
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    return matchStatus && matchSeverity;
  });

  const handleAcknowledge = async (alertId) => {
    try {
      await api.updateAlertStatus(alertId, {
        status: 'ACKNOWLEDGED',
        user_name: 'Logistics Control Officer'
      });
      onRefresh();
    } catch (e) {
      alert("Error updating alert: " + e.message);
    }
  };

  const handleResolve = async (alertId) => {
    const note = prompt("Enter incident resolution corrective note:", "Inspected and restored to normal operation.");
    if (!note) return;
    try {
      await api.updateAlertStatus(alertId, {
        status: 'RESOLVED',
        action_notes: note,
        user_name: 'Logistics Control Officer'
      });
      onRefresh();
    } catch (e) {
      alert("Error resolving alert: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Intelligent Exception Management & Triage Control</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Smart Alerts & Incident Response Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated event triggers for cold-chain excursions, unexpected stoppages, rail sidings, and vessel port queues.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Incidents</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Problem Type</th>
                <th className="py-3 px-4">Incident Details</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {a.alert_code}
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      a.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 animate-pulse' :
                      a.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      a.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{a.problem_type}</td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-slate-900">{a.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-2">{a.message}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{a.location_name || 'Corridor transit'}</td>
                  <td className="py-3 px-4 text-slate-700 max-w-xs">
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200 text-[11px]">
                      {a.recommended_action}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.status === 'ACTIVE' ? 'bg-red-50 text-red-700 border border-red-200' :
                      a.status === 'ACKNOWLEDGED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 shrink-0">
                    {a.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleAcknowledge(a.id)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-bold transition-all"
                        title="Acknowledge alert"
                      >
                        Acknowledge
                      </button>
                    )}
                    {a.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolve(a.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-all"
                        title="Resolve alert with note"
                      >
                        Resolve
                      </button>
                    )}
                    {a.status === 'RESOLVED' && (
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-end">
                        <Check className="w-3.5 h-3.5 mr-0.5" /> Closed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
