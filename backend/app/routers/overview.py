from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.all_models import (
    Shipment, ShipmentStatus, FleetEntity, FleetStatus, FleetType,
    TransportMode, IoTDevice, DeviceStatus, Alert, AlertSeverity, AlertStatus
)

router = APIRouter(prefix="/overview", tags=["Overview Dashboard"])

@router.get("/metrics")
def get_overview_metrics(db: Session = Depends(get_db)):
    total_shipments = db.query(Shipment).count()
    active_shipments = db.query(Shipment).filter(
        Shipment.status.in_([ShipmentStatus.IN_TRANSIT, ShipmentStatus.HANDOVER, ShipmentStatus.OUT_FOR_DELIVERY])
    ).count()
    delivered_shipments = db.query(Shipment).filter(Shipment.status == ShipmentStatus.DELIVERED).count()
    delayed_shipments = db.query(Shipment).filter(Shipment.status == ShipmentStatus.DELAYED).count()

    total_vehicles = db.query(FleetEntity).count()
    active_fleet = db.query(FleetEntity).filter(FleetEntity.status == FleetStatus.ACTIVE).count()
    
    total_iot = db.query(IoTDevice).count()
    active_iot = db.query(IoTDevice).filter(IoTDevice.status == DeviceStatus.ONLINE).count()

    critical_alerts = db.query(Alert).filter(
        Alert.severity == AlertSeverity.CRITICAL,
        Alert.status == AlertStatus.ACTIVE
    ).count()
    total_active_alerts = db.query(Alert).filter(Alert.status == AlertStatus.ACTIVE).count()

    # Modal Distribution
    road_count = db.query(Shipment).filter(Shipment.transport_mode == TransportMode.ROAD).count()
    rail_count = db.query(Shipment).filter(Shipment.transport_mode == TransportMode.RAIL).count()
    sea_count = db.query(Shipment).filter(Shipment.transport_mode == TransportMode.SEA).count()
    multimodal_count = db.query(Shipment).filter(Shipment.transport_mode == TransportMode.MULTIMODAL).count()

    # Fleet type breakdown
    truck_count = db.query(FleetEntity).filter(FleetEntity.fleet_type == FleetType.TRUCK).count()
    train_count = db.query(FleetEntity).filter(FleetEntity.fleet_type == FleetType.TRAIN).count()
    vessel_count = db.query(FleetEntity).filter(FleetEntity.fleet_type == FleetType.VESSEL).count()

    # Average fleet health
    all_fleet = db.query(FleetEntity).all()
    avg_fleet_health = sum(f.health_score for f in all_fleet) / len(all_fleet) if all_fleet else 90.0

    return {
        "kpis": {
            "total_shipments": total_shipments,
            "active_shipments": active_shipments,
            "delivered_shipments": delivered_shipments,
            "delayed_shipments": delayed_shipments,
            "total_vehicles": total_vehicles,
            "active_fleet": active_fleet,
            "active_iot_devices": active_iot,
            "total_iot_devices": total_iot,
            "critical_alerts": critical_alerts,
            "total_active_alerts": total_active_alerts,
            "avg_fleet_health": round(avg_fleet_health, 1)
        },
        "modal_distribution": {
            "road": road_count,
            "rail": rail_count,
            "sea": sea_count,
            "multimodal": multimodal_count
        },
        "fleet_distribution": {
            "trucks": truck_count,
            "trains": train_count,
            "vessels": vessel_count
        },
        "delivery_sla_ontime_rate": 96.4 # percentage
    }
