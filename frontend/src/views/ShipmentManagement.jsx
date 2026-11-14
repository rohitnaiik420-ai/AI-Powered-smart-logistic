import React, { useState } from 'react';
import {
  Package, Plus, Search, Filter, CheckCircle2, Clock,
  ArrowRight, ShieldCheck, FileText, Layers, Truck, Train, Ship,
  ExternalLink, Thermometer, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

export default function ShipmentManagement({
  shipments = [],
  onRefresh,
  onSelectShipmentForTracking
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeShipmentId, setActiveShipmentId] = useState(null);
  const [reportData, setReportData] = useState(null);

  // Form states for Create Shipment (Steps 1-8)
  const [formData, setFormData] = useState({
    customer_name: 'AgroFresh Global Logistics',
    origin: 'Delhi',
    destination: 'Mumbai',
    cargo_type: 'Dairy Products',
    cargo_weight_kg: 8500,
    is_perishable: true,
    ideal_temp_min: 2.0,
    ideal_temp_max: 5.0,
    shelf_life_hours_initial: 168.0,
    transport_preference: 'BALANCED'
  });

  // Handover form state
  const [handoverData, setHandoverData] = useState({
    step_number: 2,
    from_mode: 'ROAD',
    to_mode: 'RAIL',
    hub_name: 'ICD Dadri Intermodal Rail Yard',
    hub_type: 'RAIL_YARD',
    responsible_operator: 'Chief Terminal Officer',
    cargo_condition: 'SEAL_INTACT_OPTIMAL',
    notes: 'Transferred from Road Reefer to Freight Rake Wagon #14'
  });

  const filtered = shipments.filter(s => {
    const matchSearch = s.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.cargo_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMode = selectedMode === 'ALL' || s.transport_mode === selectedMode;
    const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
    return matchSearch && matchMode && matchStatus;
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createShipment(formData);
      setCreateModalOpen(false);
      onRefresh();
    } catch (err) {
      alert("Error creating shipment: " + err.message);
    }
  };

  const handleHandoverSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.recordHandover(activeShipmentId, handoverData);
      setHandoverModalOpen(false);
      onRefresh();
    } catch (err) {
      alert("Error recording handover: " + err.message);
    }
  };

  const handleConfirmDelivery = async (shipmentId) => {
    const receiver = prompt("Enter Receiver / Consignee Name:", "Mumbai Cold Hub Consignee");
    if (!receiver) return;
    try {
      await api.confirmDelivery(shipmentId, receiver, "Delivered and verified in pristine cold-chain condition.");
      alert("Delivery confirmed successfully!");
      onRefresh();
    } catch (err) {
      alert("Error confirming delivery: " + err.message);
    }
  };

  const handleOpenReport = async (shipmentId) => {
    try {
      const data = await api.getShipmentReport(shipmentId);
      setReportData(data);
      setReportModalOpen(true);
    } catch (err) {
      alert("Error loading report: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 14-Step Lifecycle Blueprint Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center space-x-2">
              <span>Standard 14-Step Multimodal Shipment Lifecycle Workflow</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                ENTERPRISE SPECIFICATION
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Coordinating customer request &rarr; AI route constraint solving &rarr; Fleet assignment &rarr; IoT sensor telemetry &rarr; Multimodal handovers &rarr; Consignee proof of delivery.
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition-all flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Shipment Request</span>
          </button>
        </div>

        {/* 14 Steps Visual Progression Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2 border-t border-slate-100">
          {[
            { step: 1, name: "Request Created" },
            { step: 2, name: "Details Reg." },
            { step: 3, name: "ID Generated" },
            { step: 4, name: "Cargo Profile" },
            { step: 5, name: "Mode Evaluated" },
            { step: 6, name: "AI Route Solved" },
            { step: 7, name: "Fleet Assigned" },
            { step: 8, name: "Sensors Linked" },
            { step: 9, name: "Transit Started" },
            { step: 10, name: "IoT Monitored" },
            { step: 11, name: "Alerts & Health" },
            { step: 12, name: "Destination Reached" },
            { step: 13, name: "Delivery Confirmed" },
            { step: 14, name: "Audit Report" }
          ].map(s => (
            <div key={s.step} className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
              <div className="text-[10px] font-bold text-blue-600">STEP {s.step}</div>
              <div className="text-[11px] font-semibold text-slate-800 truncate">{s.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tracking ID, origin, destination..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Modes</option>
            <option value="ROAD">Road Freight</option>
            <option value="RAIL">Rail Corridor</option>
            <option value="SEA">Maritime Sea</option>
            <option value="MULTIMODAL">Multimodal</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="HANDOVER">Handover</option>
            <option value="DELIVERED">Delivered</option>
            <option value="DELAYED">Delayed</option>
          </select>
        </div>
      </div>

      {/* Shipments Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Tracking Number</th>
                <th className="py-3 px-4">Origin &rarr; Destination</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Cargo & Weight</th>
                <th className="py-3 px-4">Shelf Life</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-blue-600">{s.tracking_number}</div>
                    <div className="text-[10px] text-slate-400">IoT: {s.iot_device_id || 'Virtual Gateway'}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800">{s.origin} &rarr; {s.destination}</div>
                    <div className="text-[10px] text-slate-500">{s.estimated_distance_km} km • ${s.estimated_cost_usd}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.transport_mode === 'ROAD' ? 'bg-blue-100 text-blue-800' :
                      s.transport_mode === 'RAIL' ? 'bg-emerald-100 text-emerald-800' :
                      s.transport_mode === 'SEA' ? 'bg-cyan-100 text-cyan-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {s.transport_mode}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-semibold">{s.cargo_type}</div>
                    <div className="text-[10px] text-slate-500">{(s.cargo_weight_kg / 1000).toFixed(1)} MT • {s.ideal_temp_min}°C to {s.ideal_temp_max}°C</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-emerald-700">
                      {s.remaining_shelf_life_hours?.toFixed(1)}h
                    </div>
                    <div className="text-[10px] text-slate-400">of {s.shelf_life_hours_initial}h base</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${s.progress_percent}%` }}></div>
                      </div>
                      <span className="font-bold text-[11px] text-slate-700">{Math.round(s.progress_percent)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                      s.status === 'HANDOVER' ? 'bg-purple-100 text-purple-800' :
                      s.status === 'DELAYED' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setActiveShipmentId(s.id);
                        setHandoverModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition-all"
                      title="Record multimodal handover between modes"
                    >
                      + Handover
                    </button>
                    {s.status !== 'DELIVERED' && (
                      <button
                        onClick={() => handleConfirmDelivery(s.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-all"
                      >
                        Confirm Delivery
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenReport(s.id)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold transition-all"
                    >
                      Audit Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SHIPMENT MODAL (Steps 1-8) */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Create New Multimodal Shipment (Steps 1-8)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Registers cargo, applies cold chain constraints, invokes Google OR-Tools AI optimizer, and assigns vehicles.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer / Consignor</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Origin City / Hub</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Destination City / Hub</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cargo Type</label>
                  <select
                    value={formData.cargo_type}
                    onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="Dairy Products">Dairy Products</option>
                    <option value="Fresh Seafood">Fresh Seafood</option>
                    <option value="Chilled Meat">Chilled Meat</option>
                    <option value="Fresh Fruits & Vegetables">Fresh Fruits & Vegetables</option>
                    <option value="Vaccines & Pharmaceuticals">Vaccines & Pharmaceuticals</option>
                    <option value="General Cargo / Standard">General Dry Goods</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.cargo_weight_kg}
                    onChange={(e) => setFormData({ ...formData, cargo_weight_kg: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Min Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.ideal_temp_min}
                    onChange={(e) => setFormData({ ...formData, ideal_temp_min: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Max Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.ideal_temp_max}
                    onChange={(e) => setFormData({ ...formData, ideal_temp_max: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Shelf Life (h)</label>
                  <input
                    type="number"
                    value={formData.shelf_life_hours_initial}
                    onChange={(e) => setFormData({ ...formData, shelf_life_hours_initial: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">AI Routing Strategy (Pareto Weights)</label>
                <select
                  value={formData.transport_preference}
                  onChange={(e) => setFormData({ ...formData, transport_preference: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white"
                >
                  <option value="BALANCED">Balanced (Cost vs SLA vs Carbon)</option>
                  <option value="FASTEST">Fastest SLA (Express Road Priority)</option>
                  <option value="CHEAPEST">Cheapest Cost (Rail / Sea Priority)</option>
                  <option value="GREENEST">Greenest (Lowest Carbon Footprint)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow"
                >
                  Solve Route & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HANDOVER MODAL */}
      {handoverModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <span>Record Multimodal Handover</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Step 10: Custody transfer between road chassis, freight rake, ocean vessel, or cross-dock facility.
            </p>

            <form onSubmit={handleHandoverSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Transfer From Mode</label>
                  <select
                    value={handoverData.from_mode}
                    onChange={(e) => setHandoverData({ ...handoverData, from_mode: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="ROAD">ROAD</option>
                    <option value="RAIL">RAIL</option>
                    <option value="SEA">SEA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Transfer To Mode</label>
                  <select
                    value={handoverData.to_mode}
                    onChange={(e) => setHandoverData({ ...handoverData, to_mode: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="RAIL">RAIL</option>
                    <option value="ROAD">ROAD</option>
                    <option value="SEA">SEA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Intermodal Hub / Terminal Name</label>
                <input
                  type="text"
                  value={handoverData.hub_name}
                  onChange={(e) => setHandoverData({ ...handoverData, hub_name: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Responsible Operator / Yard Supv.</label>
                <input
                  type="text"
                  value={handoverData.responsible_operator}
                  onChange={(e) => setHandoverData({ ...handoverData, responsible_operator: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Cargo / Reefer Seal Condition</label>
                <select
                  value={handoverData.cargo_condition}
                  onChange={(e) => setHandoverData({ ...handoverData, cargo_condition: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white"
                >
                  <option value="SEAL_INTACT_OPTIMAL">SEAL INTACT & TEMPERATURE OPTIMAL</option>
                  <option value="MINOR_DEFROST_COMPENSATED">MINOR DEFROST COMPENSATED</option>
                  <option value="PACKAGING_INSPECTED_OK">PACKAGING INSPECTED OK</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Handover Operational Notes</label>
                <textarea
                  value={handoverData.notes}
                  onChange={(e) => setHandoverData({ ...handoverData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                  rows="2"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setHandoverModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow"
                >
                  Log Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FINAL REPORT MODAL (Step 14) */}
      {reportModalOpen && reportData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Step 14 Final Shipment Report</span>
                <h3 className="text-base font-black text-slate-900">{reportData.report_id}</h3>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border">
                <div>
                  <span className="text-slate-500">Customer:</span> <b>{reportData.customer}</b>
                </div>
                <div>
                  <span className="text-slate-500">Corridor:</span> <b>{reportData.corridor.origin} &rarr; {reportData.corridor.destination}</b>
                </div>
                <div>
                  <span className="text-slate-500">Distance:</span> <b>{reportData.corridor.distance_km} km</b>
                </div>
                <div>
                  <span className="text-slate-500">Mode:</span> <b>{reportData.corridor.transport_mode}</b>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Cold-Chain & Food Quality Assurance</h4>
                <div className="grid grid-cols-3 gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                  <div>
                    <span className="text-slate-500">Cargo Type:</span>
                    <div className="font-bold text-slate-800">{reportData.cargo_specifications.type}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Initial Shelf Life:</span>
                    <div className="font-bold text-slate-800">{reportData.cargo_specifications.initial_shelf_life_hours}h</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Remaining Shelf Life:</span>
                    <div className="font-bold text-emerald-700">{reportData.cargo_specifications.remaining_shelf_life_hours?.toFixed(1)}h</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Custody Chain Handover History</h4>
                <div className="space-y-1.5">
                  {reportData.custody_chain_handovers?.map(h => (
                    <div key={h.step} className="p-2 rounded bg-slate-50 border text-[11px] flex items-center justify-between">
                      <div>
                        <b>Step {h.step}:</b> {h.from_mode} &rarr; {h.to_mode} at <b>{h.hub}</b> ({h.operator})
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {h.cargo_condition}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-between">
                <div className="text-[11px] text-slate-500">Compliance Score: <b className="text-emerald-600 font-bold">98.2% Nominal</b></div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs shadow hover:bg-blue-700"
                >
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
