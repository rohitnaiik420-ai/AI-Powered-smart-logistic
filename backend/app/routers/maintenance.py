import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.all_models import FleetEntity, MaintenanceRecord
from ..schemas.all_schemas import MaintenanceRecordResponse
from ..services.predictive_maintenance import PredictiveMaintenanceEngine

router = APIRouter(prefix="/maintenance", tags=["Predictive Maintenance"])

@router.get("/fleet-health")
def get_fleet_health_overview(db: Session = Depends(get_db)):
    """Fleet-wide health telemetry, RUL, diagnostic trouble codes, and urgency breakdown"""
    fleet = db.query(FleetEntity).all()
    results = []
    critical_count = 0
    warning_count = 0
    healthy_count = 0

    for f in fleet:
        if f.health_score < 50.0:
            critical_count += 1
            urgency = "IMMEDIATE"
        elif f.health_score < 75.0:
            warning_count += 1
            urgency = "HIGH"
        else:
            healthy_count += 1
            urgency = "ROUTINE"

        results.append({
            "fleet_id": f.id,
            "code": f.code,
            "name": f.name,
            "type": f.fleet_type,
            "health_score": f.health_score,
            "remaining_useful_life_days": f.remaining_useful_life_days,
            "fuel_level_percent": f.fuel_level,
            "status": f.status,
            "urgency": urgency,
            "next_service_projected": (datetime.datetime.utcnow() + datetime.timedelta(days=min(60, f.remaining_useful_life_days))).strftime("%Y-%m-%d"),
            "operator": f.operator_name
        })

    return {
        "summary": {
            "total_fleet_assets": len(fleet),
            "healthy_count": healthy_count,
            "warning_count": warning_count,
            "critical_count": critical_count,
            "avg_health_score": round(sum(f.health_score for f in fleet) / len(fleet), 1) if fleet else 90.0
        },
        "assets": results
    }

@router.get("/schedules", response_model=List[MaintenanceRecordResponse])
def get_maintenance_schedules(db: Session = Depends(get_db)):
    """Returns scheduled, in-progress, and past maintenance work orders"""
    return db.query(MaintenanceRecord).order_by(MaintenanceRecord.scheduled_date.asc()).all()

@router.post("/schedule-order")
def create_maintenance_order(
    fleet_code: str,
    service_type: str,
    technician_name: str,
    scheduled_days_ahead: int = 7,
    notes: Optional[str] = "Proactive maintenance scheduled via AI predictive analysis",
    db: Session = Depends(get_db)
):
    fleet = db.query(FleetEntity).filter(FleetEntity.code == fleet_code).first()
    if not fleet:
        raise HTTPException(status_code=404, detail="Fleet entity not found")

    order = MaintenanceRecord(
        fleet_id=fleet.id,
        service_type=service_type,
        health_score_at_service=fleet.health_score,
        rul_days_projected=fleet.remaining_useful_life_days,
        fault_codes="SCHEDULED_PREVENTIVE",
        scheduled_date=datetime.datetime.utcnow() + datetime.timedelta(days=scheduled_days_ahead),
        technician_name=technician_name,
        cost_usd=550.0,
        status="SCHEDULED",
        ai_recommendation=notes
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {
        "status": "ORDER_CREATED",
        "maintenance_id": order.id,
        "fleet_code": fleet.code,
        "scheduled_date": order.scheduled_date.isoformat(),
        "message": f"Maintenance order successfully scheduled for {fleet.code}."
    }
