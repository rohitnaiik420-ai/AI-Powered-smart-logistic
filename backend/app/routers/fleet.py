from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.all_models import FleetEntity, FleetType, FleetStatus, MaintenanceRecord, Alert
from ..schemas.all_schemas import FleetEntityResponse

router = APIRouter(prefix="/fleet", tags=["Fleet & Logistics Tracking"])

@router.get("/", response_model=List[FleetEntityResponse])
def list_fleet(
    type: Optional[str] = None, # TRUCK, TRAIN, VESSEL, ALL
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FleetEntity)
    if type and type != "ALL":
        query = query.filter(FleetEntity.fleet_type == type)
    if status and status != "ALL":
        query = query.filter(FleetEntity.status == status)
    return query.all()

@router.get("/road")
def get_road_fleet(db: Session = Depends(get_db)):
    """Road fleet with GPS telemetry, driver info, unexpected stoppage/deviation detection"""
    trucks = db.query(FleetEntity).filter(FleetEntity.fleet_type == FleetType.TRUCK).all()
    results = []
    for t in trucks:
        # Detect unexpected stoppage (speed == 0 while active)
        is_stopped = (t.current_speed < 1.0 and t.status == FleetStatus.ACTIVE)
        # Check active alerts
        active_alerts = db.query(Alert).filter(Alert.fleet_code == t.code, Alert.status == "ACTIVE").all()

        results.append({
            "id": t.id,
            "code": t.code,
            "name": t.name,
            "driver_name": t.operator_name,
            "driver_contact": t.operator_contact,
            "status": t.status,
            "current_lat": t.current_lat,
            "current_lng": t.current_lng,
            "speed_kmh": t.current_speed,
            "heading": t.heading,
            "fuel_percent": t.fuel_level,
            "health_score": t.health_score,
            "remaining_useful_life_days": t.remaining_useful_life_days,
            "iot_device_id": t.iot_device_id,
            "unexpected_stop_detected": is_stopped,
            "route_deviation_detected": False,
            "active_alerts_count": len(active_alerts),
            "simulated": True
        })
    return results

@router.get("/rail")
def get_rail_fleet(db: Session = Depends(get_db)):
    """Rail freight fleet with rake telemetry, wagon tracking, delay notifications"""
    trains = db.query(FleetEntity).filter(FleetEntity.fleet_type == FleetType.TRAIN).all()
    results = []
    for tr in trains:
        is_delayed = (tr.status == FleetStatus.DELAYED or tr.current_speed < 5.0)
        results.append({
            "id": tr.id,
            "code": tr.code,
            "name": tr.name,
            "locopilot": tr.operator_name,
            "locopilot_contact": tr.operator_contact,
            "status": tr.status,
            "current_lat": tr.current_lat,
            "current_lng": tr.current_lng,
            "speed_kmh": tr.current_speed,
            "heading": tr.heading,
            "power_efficiency": tr.fuel_level,
            "capacity_kg": tr.capacity_kg,
            "rake_composition": "45 Refrigerated Double-Stack Wagons",
            "current_station": "Western Freight Corridor Interlocking Siding",
            "next_station": "JNPT Rail Marine Yard",
            "delay_minutes": 25 if is_delayed else 0,
            "health_score": tr.health_score,
            "simulated": True
        })
    return results

@router.get("/sea")
def get_sea_fleet(db: Session = Depends(get_db)):
    """Maritime fleet with AIS vessel tracking, port arrival/departure status, berth delays"""
    vessels = db.query(FleetEntity).filter(FleetEntity.fleet_type == FleetType.VESSEL).all()
    results = []
    for v in vessels:
        results.append({
            "id": v.id,
            "code": v.code,
            "name": v.name,
            "mmsi": v.operator_contact,
            "captain": v.operator_name,
            "status": v.status,
            "current_lat": v.current_lat,
            "current_lng": v.current_lng,
            "speed_knots": round(v.current_speed * 0.539957, 1), # km/h to knots
            "heading": v.heading,
            "bunker_fuel_percent": v.fuel_level,
            "capacity_teu": 8500 if "8,500" in v.name else 12000,
            "departure_port": "Jawaharlal Nehru Port (JNPT)",
            "destination_port": "Jebel Ali Port (Dubai)",
            "port_dwell_status": "BERTH_PILOT_QUEUE" if v.current_speed < 3.0 else "UNDERWAY_TRANSIT",
            "estimated_berth_delay_hours": 2.5 if v.current_speed < 3.0 else 0.0,
            "health_score": v.health_score,
            "ais_source": "SIMULATED_AIS_BROKER"
        })
    return results
