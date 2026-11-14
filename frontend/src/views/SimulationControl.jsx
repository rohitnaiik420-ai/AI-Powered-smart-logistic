import React, { useState, useEffect } from 'react';
import {
  Play, Pause, RotateCcw, Zap, AlertTriangle, ShieldCheck,
  Activity, Thermometer, Truck, Train, Ship, CheckCircle2,
  Gauge, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function SimulationControl({ onSimulationToggled }) {
  const [simState, setSimState] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    loadSimState();
    const interval = setInterval(loadSimState, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadSimState = async () => {
    try {
      const state = await api.getSimulationState();
      setSimState(state);
    } catch (e) {
      console.error("Error loading simulation state", e);
    }
  };

  const handleControl = async (action, speed = null) => {
    setLoadingAction(true);
    try {
      await api.controlSimulation(action, speed);
      await loadSimState();
      if (onSimulationToggled) onSimulationToggled();
    } catch (e) {
      alert("Error updating simulation: " + e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleInjectAnomaly = async (type) => {
    setLoadingAction(true);
    try {
      await api.injectAnomaly(type);
      await loadSimState();
    } catch (e) {
      alert("Error injecting anomaly: " + e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const isRunning = simState?.is_running ?? true;
  const currentSpeed = simState?.speed_multiplier ?? 1.0;
  const activeAnomalies = simState?.active_anomalies || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>Real-Time Chaos Engineering & Trajectory Simulation Engine</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Simulation Control Cockpit & Anomaly Injector
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Drive live vehicle GPS trajectories, simulate cold-chain thermal failures, rail track delays, and maritime harbour queues.
            All simulated events automatically flow through the unified ingestion pipeline.
          </p>
        </div>

        {/* Master Action Buttons */}
        <div className="flex items-center space-x-2.5">
          {isRunning ? (
            <button
              onClick={() => handleControl('PAUSE')}
              disabled={loadingAction}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1.5 transition-all"
            >
              <Pause className="w-4 h-4" />
              <span>Pause Simulation</span>
            </button>
          ) : (
            <button
              onClick={() => handleControl('START')}
              disabled={loadingAction}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1.5 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Resume Simulation</span>
            </button>
          )}

          <button
            onClick={() => handleControl('RESET')}
            disabled={loadingAction}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 flex items-center space-x-1.5 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Clock</span>
          </button>
        </div>
      </div>

      {/* Simulator Telemetry & Speed Multiplier Controller */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
              Simulation Clock & Ingestion Heartbeat
            </div>
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-black font-mono">
                Tick #{simState?.tick_count || 0}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                {isRunning ? 'ACTIVE WORKER LOOP' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Emulating Road (TRK-101..103), Rail (TRN-804..902), and Sea (VSL-ATLANTIS..PACIFIC)
            </p>
          </div>

          {/* Speed Multiplier Toggles */}
          <div>
            <span className="text-xs font-bold text-slate-300 block mb-2">Simulation Clock Multiplier:</span>
            <div className="flex items-center space-x-2">
              {[
                { speed: 1.0, label: '1x (Real-time)' },
                { speed: 5.0, label: '5x Fast' },
                { speed: 10.0, label: '10x Turbo' },
                { speed: 20.0, label: '20x Hyper' }
              ].map(s => (
                <button
                  key={s.speed}
                  onClick={() => handleControl('SPEED_SET', s.speed)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                    currentSpeed === s.speed
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chaos Engineering & Anomaly Triggering Matrix */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Chaos Engineering: Dynamic Anomaly Injection Matrix</span>
            </h3>
            <p className="text-xs text-slate-500">
              Click an anomaly trigger below to immediately simulate realistic equipment failures, delays, or thermal breaches.
            </p>
          </div>

          {/* Restore Normal Button */}
          <button
            onClick={() => handleInjectAnomaly('NORMAL_CONDITIONS')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1.5 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Restore All Nominal Conditions</span>
          </button>
        </div>

        {/* Anomaly Trigger Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Cold Chain Failure */}
          <div className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
            'REEFER_FAILURE' in activeAnomalies ? 'bg-red-50 border-red-300 ring-2 ring-red-400' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-700 flex items-center">
                <Thermometer className="w-4 h-4 mr-1" /> Cold-Chain Failure
              </span>
              {'REEFER_FAILURE' in activeAnomalies && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white animate-pulse">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-slate-600 text-[11px]">
              Forces reefer temperature to +12°C. Triggers immediate temperature alert and accelerates Arrhenius food quality decay!
            </p>
            <button
              onClick={() => handleInjectAnomaly('REEFER_FAILURE')}
              className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs shadow-sm"
            >
              Trigger Reefer Malfunction
            </button>
          </div>

          {/* 2. Vehicle Mechanical Breakdown */}
          <div className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
            'TRUCK_BREAKDOWN' in activeAnomalies ? 'bg-red-50 border-red-300 ring-2 ring-red-400' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-700 flex items-center">
                <Truck className="w-4 h-4 mr-1" /> Vehicle Breakdown
              </span>
              {'TRUCK_BREAKDOWN' in activeAnomalies && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white animate-pulse">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-slate-600 text-[11px]">
              Spikes coolant to 112°C, drops oil pressure to 21 psi, halts speed to 0 km/h, and creates a predictive maintenance emergency alert.
            </p>
            <button
              onClick={() => handleInjectAnomaly('TRUCK_BREAKDOWN')}
              className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs shadow-sm"
            >
              Trigger Engine Failure
            </button>
          </div>

          {/* 3. Door Tamper Breach */}
          <div className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
            'DOOR_TAMPER' in activeAnomalies ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-700 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" /> Reefer Door Breach
              </span>
              {'DOOR_TAMPER' in activeAnomalies && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-600 text-white animate-pulse">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-slate-600 text-[11px]">
              Sets door_open=true while vehicle is moving at high speed. Fires security tampering incident notification.
            </p>
            <button
              onClick={() => handleInjectAnomaly('DOOR_TAMPER')}
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs shadow-sm"
            >
              Trigger Door Opening
            </button>
          </div>

          {/* 4. Rail Siding Delay */}
          <div className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
            'RAIL_DELAY' in activeAnomalies ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-700 flex items-center">
                <Train className="w-4 h-4 mr-1" /> Railway Siding Delay
              </span>
              {'RAIL_DELAY' in activeAnomalies && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-600 text-white animate-pulse">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-slate-600 text-[11px]">
              Halts freight rake TRN-804 at interlocking signal siding. Generates station delay notification and adjusts ETA.
            </p>
            <button
              onClick={() => handleInjectAnomaly('RAIL_DELAY')}
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs shadow-sm"
            >
              Trigger Railway Stoppage
            </button>
          </div>

          {/* 5. Maritime Port Congestion */}
          <div className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
            'PORT_CONGESTION' in activeAnomalies ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-700 flex items-center">
                <Ship className="w-4 h-4 mr-1" /> Port Berth Congestion
              </span>
              {'PORT_CONGESTION' in activeAnomalies && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-600 text-white animate-pulse">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-slate-600 text-[11px]">
              Slows container liner VSL-ATLANTIS to 1 knot at outer harbour pilotage station. Fires +2.5 hour berth delay alert.
            </p>
            <button
              onClick={() => handleInjectAnomaly('PORT_CONGESTION')}
              className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-bold text-xs shadow-sm"
            >
              Trigger Port Queue Delay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
