import io
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.all_models import Shipment, FleetEntity, Alert, MaintenanceRecord

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    shipments = db.query(Shipment).all()
    fleet = db.query(FleetEntity).all()
    alerts = db.query(Alert).all()

    total_cost = sum(s.estimated_cost_usd for s in shipments)
    total_co2 = sum(s.carbon_emissions_kg for s in shipments)
    total_ton_km = sum((s.cargo_weight_kg / 1000.0) * s.estimated_distance_km for s in shipments)
    avg_cost_per_ton_km = round(total_cost / total_ton_km, 3) if total_ton_km > 0 else 0.085

    # Monthly performance trend (simulated for executive charts)
    monthly_performance = [
        {"month": "Jun", "on_time_pct": 94.2, "cost_k_usd": 142, "co2_tons": 68},
        {"month": "Jul", "on_time_pct": 95.8, "cost_k_usd": 158, "co2_tons": 72},
        {"month": "Aug", "on_time_pct": 93.5, "cost_k_usd": 149, "co2_tons": 64},
        {"month": "Sep", "on_time_pct": 96.1, "cost_k_usd": 172, "co2_tons": 78},
        {"month": "Oct", "on_time_pct": 97.4, "cost_k_usd": 185, "co2_tons": 82},
        {"month": "Nov", "on_time_pct": 96.8, "cost_k_usd": 165, "co2_tons": 74}
    ]

    modal_cost_breakdown = [
        {"name": "Road Express", "cost": 18450, "emissions": 4250, "color": "#3B82F6"},
        {"name": "Rail Freight Corridor", "cost": 12800, "emissions": 1120, "color": "#10B981"},
        {"name": "Maritime Shipping", "cost": 8900, "emissions": 540, "color": "#06B6D4"},
        {"name": "Smart Multimodal", "cost": 21600, "emissions": 2100, "color": "#8B5CF6"}
    ]

    return {
        "kpis": {
            "total_logistics_spend_usd": total_cost,
            "total_carbon_emissions_kg": total_co2,
            "average_cost_per_ton_km": avg_cost_per_ton_km,
            "fleet_utilization_rate": 84.6,
            "cold_chain_compliance_rate": 98.4,
            "total_incidents_recorded": len(alerts)
        },
        "monthly_trends": monthly_performance,
        "modal_breakdown": modal_cost_breakdown
    }

@router.get("/export/csv")
def export_shipments_csv(db: Session = Depends(get_db)):
    """Exports all shipment audit records to CSV"""
    shipments = db.query(Shipment).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Tracking Number", "Customer ID", "Origin", "Destination",
        "Transport Mode", "Status", "Cargo Type", "Weight (kg)",
        "Perishable", "Cost (USD)", "Distance (km)", "CO2 (kg)", "Created At"
    ])

    for s in shipments:
        writer.writerow([
            s.tracking_number, s.customer_id, s.origin, s.destination,
            s.transport_mode, s.status, s.cargo_type, s.cargo_weight_kg,
            s.is_perishable, s.estimated_cost_usd, s.estimated_distance_km,
            s.carbon_emissions_kg, s.created_at.strftime("%Y-%m-%d %H:%M")
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=multimodal_logistics_shipments.csv"}
    )
