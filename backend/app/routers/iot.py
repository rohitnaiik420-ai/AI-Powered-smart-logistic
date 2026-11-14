from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.all_models import IoTDevice, TelemetryRecord, Shipment, DeviceStatus, Alert
from ..schemas.all_schemas import TelemetryRecordResponse
from ..services.shelf_life_model import FOOD_PARAMETERS, ArrheniusShelfLifePredictor

router = APIRouter(prefix="/iot", tags=["IoT Cargo & Quality Monitoring"])

@router.get("/devices-telemetry")
def get_all_devices_telemetry(db: Session = Depends(get_db)):
    """Fetches latest telemetry snapshot for all IoT devices"""
    devices = db.query(IoTDevice).all()
    results = []
    for d in devices:
        last_rec = db.query(TelemetryRecord).filter(
            TelemetryRecord.device_id == d.device_id
        ).order_by(TelemetryRecord.timestamp.desc()).first()

        results.append({
            "device_id": d.device_id,
            "name": d.name,
            "device_type": d.device_type,
            "source_mode": d.source_mode, # SIMULATED or HARDWARE
            "status": d.status,
            "battery_level": d.battery_level,
            "last_ping": d.last_ping.isoformat() if d.last_ping else None,
            "assigned_shipment_id": d.assigned_shipment_id,
            "assigned_fleet_code": d.assigned_fleet_code,
            "latest_reading": {
                "temperature": last_rec.temperature_celsius if last_rec else 3.8,
                "humidity": last_rec.humidity_percent if last_rec else 82.0,
                "vibration": last_rec.vibration_g if last_rec else 0.1,
                "door_open": last_rec.door_open if last_rec else False,
                "lat": last_rec.latitude if last_rec else 24.5,
                "lng": last_rec.longitude if last_rec else 73.7,
                "speed": last_rec.speed_kmh if last_rec else 65.0,
                "timestamp": last_rec.timestamp.isoformat() if last_rec else None
            }
        })
    return results

@router.get("/history/{device_id}", response_model=List[TelemetryRecordResponse])
def get_device_history(device_id: str, limit: int = 50, db: Session = Depends(get_db)):
    """Time-series telemetry readings for charts and analytics"""
    records = db.query(TelemetryRecord).filter(
        TelemetryRecord.device_id == device_id
    ).order_by(TelemetryRecord.timestamp.desc()).limit(limit).all()
    return list(reversed(records))

@router.get("/food-profiles")
def get_food_profiles():
    """Returns validated biological food parameters and safe cold-chain limits"""
    return FOOD_PARAMETERS

@router.get("/shelf-life-analysis/{shipment_tracking}")
def analyze_shelf_life(shipment_tracking: str, db: Session = Depends(get_db)):
    """Computes dynamic Arrhenius kinetic decay curve and corrective suggestions"""
    shp = db.query(Shipment).filter(Shipment.tracking_number == shipment_tracking).first()
    if not shp:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Fetch last reading
    last_rec = db.query(TelemetryRecord).filter(
        TelemetryRecord.device_id == shp.iot_device_id
    ).order_by(TelemetryRecord.timestamp.desc()).first()

    curr_temp = last_rec.temperature_celsius if last_rec else shp.ideal_temp_min + 1.0
    acc_factor = ArrheniusShelfLifePredictor.calculate_acceleration_factor(shp.cargo_type, curr_temp)

    # Corrective action generation
    corrective_actions = []
    if curr_temp > shp.ideal_temp_max:
        corrective_actions.append("Decrease reefer thermostat by 2°C to suppress microbial spoilage.")
        corrective_actions.append("Inspect secondary condenser fan motor and re-charge R452A refrigerant if necessary.")
        corrective_actions.append("Schedule expedited direct cross-dock at next intermodal transfer point.")
    elif curr_temp < shp.ideal_temp_min:
        corrective_actions.append("Engage reefer cycle defrost mode to prevent cargo surface frost crystallization.")
    else:
        corrective_actions.append("Cold chain nominal: Continue standard monitoring interval.")

    return {
        "shipment_tracking": shp.tracking_number,
        "cargo_type": shp.cargo_type,
        "current_temperature_celsius": curr_temp,
        "ideal_temp_range": f"{shp.ideal_temp_min}°C to {shp.ideal_temp_max}°C",
        "initial_shelf_life_hours": shp.shelf_life_hours_initial,
        "remaining_shelf_life_hours": shp.remaining_shelf_life_hours,
        "acceleration_factor": acc_factor,
        "biological_decay_rate": f"{acc_factor:.2f}x standard velocity",
        "corrective_actions": corrective_actions
    }
