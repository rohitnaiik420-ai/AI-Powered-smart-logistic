from fastapi import APIRouter
from typing import Dict, Any
from ..schemas.all_schemas import SimulationControlRequest, AnomalyInjectionRequest
from ..services.simulation_service import simulation_manager

router = APIRouter(prefix="/simulation", tags=["Simulation Control Center"])

@router.get("/state")
def get_simulation_state():
    return {
        "is_running": simulation_manager.is_running,
        "speed_multiplier": simulation_manager.speed_multiplier,
        "tick_count": simulation_manager.tick_count,
        "active_anomalies": simulation_manager.active_anomalies,
        "assets_progress": simulation_manager.entity_progress
    }

@router.post("/control")
def control_simulation(payload: SimulationControlRequest):
    action = payload.action.upper()
    if action == "START":
        simulation_manager.start()
    elif action == "PAUSE":
        simulation_manager.pause()
    elif action == "RESET":
        simulation_manager.reset()
    elif action == "SPEED_SET" and payload.speed_multiplier:
        simulation_manager.set_speed(payload.speed_multiplier)

    return {
        "status": "UPDATED",
        "action": action,
        "is_running": simulation_manager.is_running,
        "speed_multiplier": simulation_manager.speed_multiplier
    }

@router.post("/anomaly")
def inject_simulation_anomaly(payload: AnomalyInjectionRequest):
    """
    Chaos injection for cold-chain breakdown, port congestion, rail signaling delays,
    truck mechanical seizure, and unauthorized door tampering.
    """
    simulation_manager.inject_anomaly(
        anomaly_type=payload.anomaly_type.upper(),
        entity_code=payload.entity_code
    )
    return {
        "status": "ANOMALY_TRIGGERED",
        "anomaly_type": payload.anomaly_type,
        "active_anomalies": simulation_manager.active_anomalies
    }
