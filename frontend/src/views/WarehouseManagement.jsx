import React, { useState, useEffect } from 'react';
import {
  Building2, Thermometer, Layers, Truck, CheckCircle2,
  Clock, Package, Plus, MapPin, Phone
} from 'lucide-react';
import { api } from '../services/api';

export default function WarehouseManagement({ warehouses = [] }) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(1);
  const [operationsData, setOperationsData] = useState(null);

  useEffect(() => {
    if (selectedWarehouseId) {
      loadOperations(selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

  const loadOperations = async (id) => {
    try {
      const data = await api.getWarehouseOperations(id);
      setOperationsData(data);
    } catch (e) {
      console.error("Error loading warehouse operations", e);
    }
  };

  const selectedWh = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0] || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Intermodal Logistics Hubs, Cross-Docks & Cold Warehouses</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Warehouse Operations & Yard Bay Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Capacity occupancy tracking, cold storage zone temperatures, loading bay queues, and gate in/out logs.
          </p>
        </div>
      </div>

      {/* Warehouse Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouses.map(wh => (
          <button
            key={wh.id}
            onClick={() => setSelectedWarehouseId(wh.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedWarehouseId === wh.id
                ? 'bg-blue-50/70 border-blue-500 shadow-md ring-1 ring-blue-500'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                {wh.code}
              </span>
              <span className="text-[11px] font-bold text-blue-600">
                {wh.cold_storage_temp_celsius}°C Cold Room
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{wh.name}</h4>
            <p className="text-xs text-slate-500 flex items-center mt-0.5">
              <MapPin className="w-3 h-3 mr-1 text-slate-400" />
              {wh.city}, {wh.country}
            </p>

            <div className="mt-3 pt-2 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Utilization:</span>
                <span className="font-bold text-slate-800">{wh.utilization_percent}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${wh.utilization_percent}%` }}
                ></div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detailed Facility Operations */}
      {operationsData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Loading Bays Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Loading & Unloading Dock Bays</span>
              <span className="text-xs font-normal text-slate-500">Live Yard Staging</span>
            </h3>

            <div className="space-y-3">
              {operationsData.loading_bays?.map(bay => (
                <div key={bay.bay_id} className="p-3 rounded-xl border bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900">{bay.bay_id}</span>
                      <span className="text-slate-500 font-medium">({bay.type})</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 font-semibold">
                      {bay.vehicle ? `Vehicle: ${bay.vehicle} • ${bay.operation}` : 'Dock Available / Empty'}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    bay.status === 'OCCUPIED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {bay.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warehouse Inventory Records */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Pallet Inventory & Staged Cargo</span>
              <span className="text-xs font-normal text-slate-500">Zone-Coded</span>
            </h3>

            <div className="space-y-2.5">
              {operationsData.inventory_records?.map(item => (
                <div key={item.sku} className="p-3 rounded-xl border bg-slate-50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-600">{item.sku}</span>
                    <span className="font-bold text-slate-800">{item.pallets} Pallets</span>
                  </div>
                  <div className="font-bold text-slate-900">{item.description}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold">{item.zone}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gate In / Out Logistics Log */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>RFID Gate Entry & Dispatch Logs</span>
              <span className="text-xs font-normal text-slate-500">Security Verified</span>
            </h3>

            <div className="space-y-2.5">
              {operationsData.gate_activity_logs?.map((gate, i) => (
                <div key={i} className="p-3 rounded-xl border bg-slate-50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{gate.gate}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      gate.action === 'GATE_IN' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {gate.action}
                    </span>
                  </div>
                  <div className="text-slate-600">Vehicle: <b>{gate.vehicle}</b> (Driver: {gate.driver})</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t">
                    <span>{new Date(gate.time).toLocaleTimeString()}</span>
                    <span className="text-emerald-600 font-bold">Seal: {gate.seal_status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
