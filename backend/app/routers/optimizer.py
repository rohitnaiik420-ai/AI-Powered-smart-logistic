from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.all_schemas import (
    RouteOptimizationRequest, RouteOptimizationResponse,
    ShipmentCreateRequest, ShipmentResponse
)
from ..services.route_optimizer import AIRouteOptimizer
from .shipments import create_shipment

router = APIRouter(prefix="/optimizer", tags=["AI Route Optimization"])

@router.post("/route", response_model=RouteOptimizationResponse)
def calculate_optimal_routes(payload: RouteOptimizationRequest):
    """
    Solves multi-modal route optimization problem using Google OR-Tools.
    Evaluates Road, Rail, Sea, and Multimodal alternatives under SLA, cost,
    weather, port/rail congestion, emissions, and perishable degradation limits.
    """
    result = AIRouteOptimizer.optimize_multimodal_route(
        origin_str=payload.origin,
        destination_str=payload.destination,
        cargo_type=payload.cargo_type,
        cargo_weight_kg=payload.cargo_weight_kg,
        deadline_hours=payload.deadline_hours,
        is_perishable=payload.is_perishable,
        priority=payload.priority
    )
    return result

@router.post("/approve-and-create", response_model=ShipmentResponse)
def approve_and_create_shipment(payload: ShipmentCreateRequest, db: Session = Depends(get_db)):
    """
    Allows the logistics owner to approve the AI-recommended route and dispatch
    it as an active live shipment across the multimodal network.
    """
    return create_shipment(payload, db)
