import React, { useState } from 'react';
import {
  Cpu, ArrowRight, CheckCircle2, Clock, DollarSign,
  TrendingUp, ShieldCheck, Leaf, AlertTriangle, Layers,
  Truck, Train, Ship, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { api } from '../services/api';

export default function RouteOptimization({ onShipmentCreated }) {
  const [formData, setFormData] = useState({
    origin: 'Delhi',
    destination: 'Mumbai',
    cargo_type: 'Dairy Products',
    cargo_weight_kg: 8500,
    deadline_hours: 48,
    is_perishable: true,
    priority: 'BALANCED' // BALANCED, FASTEST, CHEAPEST, GREENEST
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);

  const handleOptimize = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApprovalStatus(null);
    try {
      const res = await api.optimizeRoute(formData);
      setResult(res);
    } catch (err) {
      alert("Error optimizing route: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!result) return;
    try {
      await api.approveAndCreateShipment({
        customer_name: 'AI Optimization Direct Dispatch',
        origin: formData.origin,
        destination: formData.destination,
        cargo_type: formData.cargo_type,
        cargo_weight_kg: formData.cargo_weight_kg,
        is_perishable: formData.is_perishable,
        ideal_temp_min: 2.0,
        ideal_temp_max: 6.0,
        shelf_life_hours_initial: 168.0,
        transport_preference: formData.priority,
        selected_mode: result.recommended_route.mode
      });
      setApprovalStatus("APPROVED_DISPATCHED");
      if (onShipmentCreated) onShipmentCreated();
    } catch (err) {
      alert("Error approving shipment: " + err.message);
    }
  };

  // Compile comparison data for chart
  const comparisonData = result ? [
    result.recommended_route,
    ...result.alternative_routes
  ].map(r => ({
    name: r.mode,
    cost: r.cost_usd,
    time_h: r.duration_hours,
    co2: r.carbon_emissions_kg,
    risk: r.perishable_risk_score
  })) : [];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Google OR-Tools Mixed-Integer Linear Programming (MILP)</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Multi-Criteria Multimodal Route Optimizer
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Solves multi-objective Pareto trade-off optimization between Financial Cost ($), Transit Time (hours),
            Carbon Emissions (kg CO2), and Arrhenius Shelf-Life Spoilage Risk across Road, Rail, and Sea modes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Parameters Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Corridor & Cargo Inputs
          </h3>

          <form onSubmit={handleOptimize} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Origin Node</label>
                <select
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white"
                >
                  <option value="Delhi">Delhi (Inland Depot)</option>
                  <option value="Ahmedabad">Ahmedabad (Cross-dock)</option>
                  <option value="Mumbai">Mumbai (Deepwater Port)</option>
                  <option value="Chennai">Chennai (Coastal Port)</option>
                  <option value="Kolkata">Kolkata (Port Terminal)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Destination Node</label>
                <select
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white"
                >
                  <option value="Mumbai">Mumbai (Consignee Terminal)</option>
                  <option value="Dubai">Dubai (Jebel Ali Freezone)</option>
                  <option value="Delhi">Delhi (Distribution Hub)</option>
                  <option value="Rotterdam">Rotterdam (Europe Gateway)</option>
                  <option value="Singapore">Singapore (PSA Terminal)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Cargo Classification</label>
              <select
                value={formData.cargo_type}
                onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
                className="w-full px-3 py-1.5 border rounded-lg bg-white"
              >
                <option value="Dairy Products">Dairy Products (High Perishable)</option>
                <option value="Fresh Seafood">Fresh Seafood (Extreme Cold Risk)</option>
                <option value="Chilled Meat">Chilled Meat</option>
                <option value="Fresh Fruits & Vegetables">Fresh Fruits & Vegetables</option>
                <option value="Vaccines & Pharmaceuticals">Vaccines & Pharmaceuticals</option>
                <option value="General Cargo / Standard">Dry Bulk / General Cargo</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Payload Weight (kg)</label>
                <input
                  type="number"
                  value={formData.cargo_weight_kg}
                  onChange={(e) => setFormData({ ...formData, cargo_weight_kg: parseFloat(e.target.value) })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">SLA Deadline (hours)</label>
                <input
                  type="number"
                  value={formData.deadline_hours}
                  onChange={(e) => setFormData({ ...formData, deadline_hours: parseFloat(e.target.value) })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Pareto Optimization Preference</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'BALANCED', label: 'Balanced' },
                  { id: 'FASTEST', label: 'Fastest SLA' },
                  { id: 'CHEAPEST', label: 'Lowest Cost' },
                  { id: 'GREENEST', label: 'Eco / Green' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p.id })}
                    className={`p-2 rounded-lg border text-center font-bold text-xs transition-all ${
                      formData.priority === p.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-all flex items-center justify-center space-x-2"
            >
              <Cpu className="w-4 h-4" />
              <span>{loading ? 'Solving Constraints...' : 'Run OR-Tools Solver'}</span>
            </button>
          </form>
        </div>

        {/* AI Recommendations & Comparison Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          {!result ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
              <Cpu className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-pulse" />
              <h4 className="text-base font-bold text-slate-800">Ready for Optimization</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Configure your origin, destination, cargo perishable criteria, and click "Run OR-Tools Solver"
                to generate mathematically optimal Pareto routes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recommended Route Winner Card */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 p-5 rounded-2xl border-2 border-emerald-500 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Recommended Route</span>
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {result.recommended_route.mode}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-emerald-900">
                      ${result.recommended_route.cost_usd}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold">Total Estimated Cost</div>
                  </div>
                </div>

                <h3 className="text-base font-black text-slate-900 mb-1">
                  {result.recommended_route.label}
                </h3>

                <p className="text-xs text-slate-700 mb-3 bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                  <span className="font-bold text-emerald-800">Solver Rationale: </span>
                  {result.recommended_route.recommendation_reason}
                </p>

                {/* Metric Badges */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs bg-white p-2.5 rounded-xl border border-emerald-200">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Distance</span>
                    <span className="font-bold text-slate-800">{result.recommended_route.distance_km} km</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Transit Time</span>
                    <span className="font-bold text-blue-700">{result.recommended_route.duration_hours}h</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">CO2 Footprint</span>
                    <span className="font-bold text-emerald-700">{result.recommended_route.carbon_emissions_kg} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Reliability</span>
                    <span className="font-bold text-indigo-700">{result.recommended_route.reliability_score}%</span>
                  </div>
                </div>

                {/* Owner Approval Trigger */}
                <div className="mt-4 pt-3 border-t border-emerald-200 flex items-center justify-between">
                  <div className="text-xs text-emerald-900 font-semibold">
                    {approvalStatus ? (
                      <span className="text-emerald-700 font-bold flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                        Approved by Logistics Owner: Dispatched to active fleet
                      </span>
                    ) : (
                      <span>Pending logistics owner approval to lock dispatch</span>
                    )}
                  </div>

                  {!approvalStatus && (
                    <button
                      onClick={handleApprove}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center space-x-1"
                    >
                      <span>Approve & Dispatch Route</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Side-by-Side Alternative Routes Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.alternative_routes.map((alt, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{alt.mode}</span>
                      <span className="font-mono font-bold text-slate-900">${alt.cost_usd}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-800 line-clamp-1">{alt.label}</div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] bg-slate-50 p-2 rounded text-slate-600">
                      <div>Time: <b>{alt.duration_hours}h</b></div>
                      <div>Dist: <b>{alt.distance_km} km</b></div>
                      <div>CO2: <b>{alt.carbon_emissions_kg} kg</b></div>
                      <div>Risk: <b>{alt.perishable_risk_score}</b></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparative Bar Chart: Cost vs Transit Time */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Comparative Analysis: Cost ($) vs Transit Time (Hours)
                </h4>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="cost" name="Cost (USD)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="time_h" name="Transit Time (h)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
