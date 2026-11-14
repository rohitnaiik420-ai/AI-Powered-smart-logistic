import React, { useState, useEffect } from 'react';
import {
  Truck, Train, Ship, Navigation, AlertTriangle, Fuel,
  Gauge, ShieldAlert, CheckCircle2, Clock, MapPin
} from 'lucide-react';
import MapComponent from '../components/MapComponent';
import { api } from '../services/api';

export default function FleetTracking({ fleetList = [], warehouses = [] }) {
  const [activeSubTab, setActiveSubTab] = useState('ALL'); // ALL, ROAD, RAIL, SEA
  const [roadFleet, setRoadFleet] = useState([]);
  const [railFleet, setRailFleet] = useState([]);
  const [seaFleet, setSeaFleet] = useState([]);

  useEffect(() => {
    loadDetailedFleet();
  }, []);

  const loadDetailedFleet = async () => {
    try {
      const [road, rail, sea] = await Promise.all([
        api.getRoadFleet(),
        api.getRailFleet(),
        api.getSeaFleet()
      ]);
      setRoadFleet(road);
      setRailFleet(rail);
      setSeaFleet(sea);
    } catch (e) {
      console.error("Error loading fleet details", e);
    }
  };

  const displayedFleet = activeSubTab === 'ROAD' ? fleetList.filter(f => f.fleet_type === 'TRUCK') :
                         activeSubTab === 'RAIL' ? fleetList.filter(f => f.fleet_type === 'TRAIN') :
                         activeSubTab === 'SEA' ? fleetList.filter(f => f.fleet_type === 'VESSEL') : fleetList;

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <span>Multimodal Fleet Tracking Control</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time GPS telematics, railway signal tracking, and AIS maritime transponder surveillance.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeSubTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Corridors ({fleetList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('ROAD')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'ROAD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Road Trucks ({roadFleet.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('RAIL')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'RAIL' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>Rail Rakes ({railFleet.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('SEA')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'SEA' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Sea Vessels ({seaFleet.length})</span>
          </button>
        </div>
      </div>

      {/* Centralized Interactive Map */}
      <MapComponent
        fleetList={displayedFleet}
        warehouses={warehouses}
        height="460px"
      />

      {/* Sub-Module Detail Panels */}
      {/* ROAD VEHICLES SECTION */}
      {(activeSubTab === 'ALL' || activeSubTab === 'ROAD') && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>ROAD TRANSPORTATION (GPS Fleet Telematics & Driver Telemetry)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roadFleet.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {t.code}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-ping"></span>
                    SIMULATED GPS
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                  <p className="text-xs text-slate-500">Driver: <b>{t.driver_name}</b> ({t.driver_contact})</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border">
                  <div>Speed: <b className="text-slate-800">{t.speed_kmh} km/h</b></div>
                  <div>Fuel Level: <b className="text-blue-600">{t.fuel_percent}%</b></div>
                  <div>Health: <b className="text-emerald-700">{t.health_score}%</b></div>
                  <div>RUL: <b className="text-slate-800">{t.remaining_useful_life_days} days</b></div>
                </div>

                {/* Stoppage / Deviation Alert Checks */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Unexpected Stoppage:</span>
                    {t.unexpected_stop_detected ? (
                      <span className="text-red-600 font-bold flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-0.5" /> Detected (0 km/h)
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold">Clear (In Motion)</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Route Deviation:</span>
                    <span className="text-emerald-600 font-bold">On Corridor (NH48)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RAIL FREIGHT SECTION */}
      {(activeSubTab === 'ALL' || activeSubTab === 'RAIL') && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
            <Train className="w-4 h-4 text-emerald-600" />
            <span>RAIL TRANSPORTATION (Dedicated Freight Corridors & Rake Telematics)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {railFleet.map(tr => (
              <div key={tr.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {tr.code}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">SIMULATED WDFC TELEMATICS</span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{tr.name}</h4>
                  <p className="text-xs text-slate-500">Locopilot: <b>{tr.locopilot}</b> ({tr.locopilot_contact})</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border">
                  <div>Rake Speed: <b className="text-slate-800">{tr.speed_kmh} km/h</b></div>
                  <div>Power Grid Eff: <b className="text-emerald-700">{tr.power_efficiency}%</b></div>
                  <div className="col-span-2">Rake: <b className="text-slate-800">{tr.rake_composition}</b></div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Station / Block Section:</span>
                    <span className="font-semibold text-slate-800">{tr.current_station}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Signal Delay Status:</span>
                    {tr.delay_minutes > 0 ? (
                      <span className="text-amber-600 font-bold">Delayed (+{tr.delay_minutes} min at siding)</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">On Time (Clear Signal)</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEA FREIGHT SECTION */}
      {(activeSubTab === 'ALL' || activeSubTab === 'SEA') && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
            <Ship className="w-4 h-4 text-cyan-600" />
            <span>SEA TRANSPORTATION (AIS Maritime Transponders & Port Arrival Status)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seaFleet.map(v => (
              <div key={v.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                    {v.code}
                  </span>
                  <span className="text-[10px] font-bold text-cyan-700">SIMULATED AIS FEED</span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{v.name}</h4>
                  <p className="text-xs text-slate-500">Master: <b>{v.captain}</b> • MMSI: {v.mmsi}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border">
                  <div>Vessel Speed: <b className="text-slate-800">{v.speed_knots} knots</b></div>
                  <div>Heading: <b className="text-slate-800">{Math.round(v.heading)}°</b></div>
                  <div>Capacity: <b className="text-slate-800">{v.capacity_teu} TEU</b></div>
                  <div>Bunker Fuel: <b className="text-cyan-700">{v.bunker_fuel_percent}%</b></div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Voyage:</span>
                    <span className="font-semibold text-slate-800">{v.departure_port} &rarr; {v.destination_port}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Port Berth Status:</span>
                    {v.estimated_berth_delay_hours > 0 ? (
                      <span className="text-amber-600 font-bold">Anchorage Queue (+{v.estimated_berth_delay_hours}h delay)</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">Underway (Direct Berth Allotted)</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
