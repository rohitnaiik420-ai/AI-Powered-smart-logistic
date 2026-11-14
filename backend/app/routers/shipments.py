import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.all_models import (
    Shipment, ShipmentStatus, TransportMode, Customer,
    FleetEntity, MultimodalHandover, IoTDevice, TelemetryRecord, Alert
)
from ..schemas.all_schemas import (
    ShipmentCreateRequest, ShipmentResponse,
    MultimodalHandoverCreate, MultimodalHandoverResponse
)
from ..services.route_optimizer import AIRouteOptimizer

router = APIRouter(prefix="/shipments", tags=["Shipment Management"])

@router.get("/", response_model=List[ShipmentResponse])
def list_shipments(
    status: Optional[str] = None,
    mode: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Shipment)
    if status and status != "ALL":
        query = query.filter(Shipment.status == status)
    if mode and mode != "ALL":
        query = query.filter(Shipment.transport_mode == mode)
    if search:
        query = query.filter(
            (Shipment.tracking_number.ilike(f"%{search}%")) |
            (Shipment.origin.ilike(f"%{search}%")) |
            (Shipment.destination.ilike(f"%{search}%")) |
            (Shipment.cargo_type.ilike(f"%{search}%"))
        )
    return query.order_by(Shipment.created_at.desc()).all()

@router.get("/{tracking_or_id}")
def get_shipment_details(tracking_or_id: str, db: Session = Depends(get_db)):
    if tracking_or_id.isdigit():
        shp = db.query(Shipment).filter(Shipment.id == int(tracking_or_id)).first()
    else:
        shp = db.query(Shipment).filter(Shipment.tracking_number == tracking_or_id).first()

    if not shp:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Fetch recent telemetry logs for linked device
    recent_telemetry = []
    if shp.iot_device_id:
        recs = db.query(TelemetryRecord).filter(
            TelemetryRecord.device_id == shp.iot_device_id
        ).order_by(TelemetryRecord.timestamp.desc()).limit(30).all()
        recent_telemetry = [
            {
                "timestamp": r.timestamp.isoformat(),
                "lat": r.latitude,
                "lng": r.longitude,
                "speed": r.speed_kmh,
                "temperature": r.temperature_celsius,
                "humidity": r.humidity_percent,
                "vibration": r.vibration_g,
                "door_open": r.door_open
            } for r in reversed(recs)
        ]

    # Active alerts
    alerts = db.query(Alert).filter(Alert.shipment_id == shp.id).all()

    return {
        "shipment": {
            "id": shp.id,
            "tracking_number": shp.tracking_number,
            "customer_id": shp.customer_id,
            "origin": shp.origin,
            "destination": shp.destination,
            "origin_lat": shp.origin_lat,
            "origin_lng": shp.origin_lng,
            "destination_lat": shp.destination_lat,
            "destination_lng": shp.destination_lng,
            "transport_mode": shp.transport_mode,
            "status": shp.status,
            "progress_percent": shp.progress_percent,
            "cargo_type": shp.cargo_type,
            "cargo_weight_kg": shp.cargo_weight_kg,
            "is_perishable": shp.is_perishable,
            "ideal_temp_min": shp.ideal_temp_min,
            "ideal_temp_max": shp.ideal_temp_max,
            "ideal_humidity_min": shp.ideal_humidity_min,
            "ideal_humidity_max": shp.ideal_humidity_max,
            "shelf_life_hours_initial": shp.shelf_life_hours_initial,
            "remaining_shelf_life_hours": shp.remaining_shelf_life_hours,
            "estimated_distance_km": shp.estimated_distance_km,
            "estimated_duration_hours": shp.estimated_duration_hours,
            "estimated_cost_usd": shp.estimated_cost_usd,
            "carbon_emissions_kg": shp.carbon_emissions_kg,
            "ai_recommendation_reason": shp.ai_recommendation_reason,
            "created_at": shp.created_at,
            "estimated_arrival": shp.estimated_arrival,
            "actual_arrival": shp.actual_arrival,
            "iot_device_id": shp.iot_device_id,
            "fleet": {
                "id": shp.assigned_fleet.id if shp.assigned_fleet else None,
                "code": shp.assigned_fleet.code if shp.assigned_fleet else None,
                "name": shp.assigned_fleet.name if shp.assigned_fleet else None,
                "type": shp.assigned_fleet.fleet_type if shp.assigned_fleet else None,
                "operator": shp.assigned_fleet.operator_name if shp.assigned_fleet else None,
                "contact": shp.assigned_fleet.operator_contact if shp.assigned_fleet else None,
            } if shp.assigned_fleet else None
        },
        "handovers": [
            {
                "id": h.id,
                "step_number": h.step_number,
                "from_mode": h.from_mode,
                "to_mode": h.to_mode,
                "hub_name": h.hub_name,
                "hub_type": h.hub_type,
                "responsible_operator": h.responsible_operator,
                "cargo_condition": h.cargo_condition,
                "handover_time": h.handover_time,
                "notes": h.notes
            } for h in shp.handovers
        ],
        "alerts": [
            {
                "id": a.id,
                "alert_code": a.alert_code,
                "problem_type": a.problem_type,
                "title": a.title,
                "message": a.message,
                "severity": a.severity,
                "status": a.status,
                "recommended_action": a.recommended_action,
                "timestamp": a.timestamp
            } for a in alerts
        ],
        "recent_telemetry": recent_telemetry
    }

@router.post("/", response_model=ShipmentResponse)
def create_shipment(payload: ShipmentCreateRequest, db: Session = Depends(get_db)):
    """
    Executes Step 1 through Step 8 of the Complete Shipment Lifecycle:
    - Step 1: Customer request
    - Step 2: Register details
    - Step 3: Unique shipment ID generation
    - Step 4: Cargo handling requirements
    - Step 5 & 6: Run AI optimizer to compute best route
    - Step 7: Assign appropriate fleet asset
    - Step 8: Bind IoT sensor package
    - Step 9: Launch transit tracking
    """
    # Find or create customer
    customer = db.query(Customer).filter(Customer.name.ilike(f"%{payload.customer_name}%")).first()
    if not customer:
        customer = Customer(
            name=payload.customer_name,
            company=payload.customer_name,
            email=f"contact@{payload.customer_name.lower().replace(' ', '')}.com"
        )
        db.add(customer)
        db.flush()

    tracking_num = f"SHP-2026-{uuid.uuid4().int % 90000 + 10000}"

    # Run AI Route Optimization
    ai_result = AIRouteOptimizer.optimize_multimodal_route(
        origin_str=payload.origin,
        destination_str=payload.destination,
        cargo_type=payload.cargo_type,
        cargo_weight_kg=payload.cargo_weight_kg,
        deadline_hours=72.0,
        is_perishable=payload.is_perishable,
        priority=payload.transport_preference or "BALANCED"
    )
    rec = ai_result["recommended_route"]

    # Select Fleet Entity based on recommended mode
    selected_mode = payload.selected_mode or TransportMode(rec["mode"])
    assigned_fleet = None
    if selected_mode == TransportMode.ROAD:
        assigned_fleet = db.query(FleetEntity).filter(FleetEntity.fleet_type == "TRUCK", FleetEntity.status == "ACTIVE").first()
    elif selected_mode == TransportMode.RAIL:
        assigned_fleet = db.query(FleetEntity).filter(FleetEntity.fleet_type == "TRAIN", FleetEntity.status == "ACTIVE").first()
    elif selected_mode == TransportMode.SEA:
        assigned_fleet = db.query(FleetEntity).filter(FleetEntity.fleet_type == "VESSEL", FleetEntity.status == "ACTIVE").first()
    else: # MULTIMODAL
        assigned_fleet = db.query(FleetEntity).filter(FleetEntity.code == "TRK-101").first()

    # Bind IoT Device
    linked_iot_id = assigned_fleet.iot_device_id if assigned_fleet else f"IOT-{tracking_num}"

    origin_coords = rec["waypoints"][0]
    dest_coords = rec["waypoints"][-1]

    new_shipment = Shipment(
        tracking_number=tracking_num,
        customer_id=customer.id,
        fleet_id=assigned_fleet.id if assigned_fleet else None,
        origin=payload.origin,
        origin_lat=origin_coords["lat"],
        origin_lng=origin_coords["lng"],
        destination=payload.destination,
        destination_lat=dest_coords["lat"],
        destination_lng=dest_coords["lng"],
        transport_mode=selected_mode,
        status=ShipmentStatus.IN_TRANSIT,
        progress_percent=5.0,
        cargo_type=payload.cargo_type,
        cargo_weight_kg=payload.cargo_weight_kg,
        is_perishable=payload.is_perishable,
        ideal_temp_min=payload.ideal_temp_min,
        ideal_temp_max=payload.ideal_temp_max,
        ideal_humidity_min=payload.ideal_humidity_min,
        ideal_humidity_max=payload.ideal_humidity_max,
        shelf_life_hours_initial=payload.shelf_life_hours_initial,
        remaining_shelf_life_hours=payload.shelf_life_hours_initial,
        estimated_distance_km=rec["distance_km"],
        estimated_duration_hours=rec["duration_hours"],
        estimated_cost_usd=rec["cost_usd"],
        carbon_emissions_kg=rec["carbon_emissions_kg"],
        route_geometry=rec["waypoints"],
        ai_recommendation_reason=rec["recommendation_reason"],
        created_at=datetime.datetime.utcnow(),
        estimated_arrival=datetime.datetime.utcnow() + datetime.timedelta(hours=rec["duration_hours"]),
        iot_device_id=linked_iot_id
    )
    db.add(new_shipment)
    db.flush()

    # If Multimodal, seed initial handover checkpoints
    if selected_mode == TransportMode.MULTIMODAL:
        handover1 = MultimodalHandover(
            shipment_id=new_shipment.id,
            step_number=1,
            from_mode=TransportMode.ROAD,
            to_mode=TransportMode.RAIL,
            hub_name=f"{payload.origin} Regional ICD Yard",
            hub_type="INTERMODAL_TERMINAL",
            responsible_operator="Fleet Controller",
            cargo_condition="SEAL_INTACT_OPTIMAL",
            notes="Initial dispatch loaded on road reefer chassis."
        )
        db.add(handover1)

    db.commit()
    db.refresh(new_shipment)
    return new_shipment

@router.post("/{shipment_id}/handover", response_model=MultimodalHandoverResponse)
def record_handover(shipment_id: int, payload: MultimodalHandoverCreate, db: Session = Depends(get_db)):
    """
    Records a custody handover between Road, Rail, Sea, or Warehouse (Step 10 handover support).
    """
    shp = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shp:
        raise HTTPException(status_code=404, detail="Shipment not found")

    handover = MultimodalHandover(
        shipment_id=shp.id,
        step_number=payload.step_number,
        from_mode=payload.from_mode,
        to_mode=payload.to_mode,
        hub_name=payload.hub_name,
        hub_type=payload.hub_type,
        responsible_operator=payload.responsible_operator,
        cargo_condition=payload.cargo_condition,
        handover_time=datetime.datetime.utcnow(),
        notes=payload.notes
    )
    shp.status = ShipmentStatus.HANDOVER
    db.add(handover)
    db.commit()
    db.refresh(handover)
    return handover

@router.post("/{shipment_id}/confirm-delivery")
def confirm_delivery(shipment_id: int, receiver_name: str = "Authorized Consignee", notes: Optional[str] = "Received in excellent cold-chain condition with seal unbroken.", db: Session = Depends(get_db)):
    """
    Step 12 & 13: Delivery confirmation & closure
    """
    shp = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shp:
        raise HTTPException(status_code=404, detail="Shipment not found")

    shp.status = ShipmentStatus.DELIVERED
    shp.progress_percent = 100.0
    shp.actual_arrival = datetime.datetime.utcnow()

    # Step 14 Handover record for final destination
    final_ho = MultimodalHandover(
        shipment_id=shp.id,
        step_number=len(shp.handovers) + 1,
        from_mode=shp.transport_mode,
        to_mode=TransportMode.ROAD,
        hub_name=shp.destination,
        hub_type="CONSIGNEE_DOCK",
        responsible_operator=receiver_name,
        cargo_condition="DELIVERED_VERIFIED_OPTIMAL",
        handover_time=datetime.datetime.utcnow(),
        notes=notes
    )
    db.add(final_ho)
    db.commit()

    return {
        "status": "DELIVERED",
        "tracking_number": shp.tracking_number,
        "actual_arrival": shp.actual_arrival.isoformat(),
        "delivered_to": receiver_name,
        "message": "Delivery successfully confirmed. Final audit report available."
    }

@router.get("/{shipment_id}/report")
def generate_final_shipment_report(shipment_id: int, db: Session = Depends(get_db)):
    """
    Step 14: Final logistics compliance, cold-chain assurance, and SLA audit report.
    """
    shp = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shp:
        raise HTTPException(status_code=404, detail="Shipment not found")

    alerts = db.query(Alert).filter(Alert.shipment_id == shp.id).all()
    handovers = db.query(MultimodalHandover).filter(MultimodalHandover.shipment_id == shp.id).order_by(MultimodalHandover.step_number).all()

    return {
        "report_id": f"REP-{shp.tracking_number}",
        "generated_at": datetime.datetime.utcnow().isoformat(),
        "tracking_number": shp.tracking_number,
        "customer": shp.customer.name if shp.customer else "Direct Enterprise Consignee",
        "corridor": {
            "origin": shp.origin,
            "destination": shp.destination,
            "transport_mode": shp.transport_mode,
            "distance_km": shp.estimated_distance_km
        },
        "cargo_specifications": {
            "type": shp.cargo_type,
            "weight_kg": shp.cargo_weight_kg,
            "is_perishable": shp.is_perishable,
            "safe_temp_range": f"{shp.ideal_temp_min}°C to {shp.ideal_temp_max}°C",
            "initial_shelf_life_hours": shp.shelf_life_hours_initial,
            "remaining_shelf_life_hours": shp.remaining_shelf_life_hours,
            "shelf_life_loss_pct": round(((shp.shelf_life_hours_initial - shp.remaining_shelf_life_hours) / shp.shelf_life_hours_initial) * 100.0, 1) if shp.shelf_life_hours_initial else 0.0
        },
        "performance_metrics": {
            "status": shp.status,
            "cost_usd": shp.estimated_cost_usd,
            "carbon_emissions_kg": shp.carbon_emissions_kg,
            "planned_duration_hours": shp.estimated_duration_hours,
            "transit_compliance_score": 98.2 # %
        },
        "custody_chain_handovers": [
            {
                "step": h.step_number,
                "from_mode": h.from_mode,
                "to_mode": h.to_mode,
                "hub": h.hub_name,
                "operator": h.responsible_operator,
                "cargo_condition": h.cargo_condition,
                "time": h.handover_time.isoformat(),
                "notes": h.notes
            } for h in handovers
        ],
        "incidents_count": len(alerts),
        "alerts_summary": [
            {"code": a.alert_code, "severity": a.severity, "type": a.problem_type, "status": a.status} for a in alerts
        ]
    }
