import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.all_models import Warehouse
from ..schemas.all_schemas import WarehouseResponse

router = APIRouter(prefix="/warehouses", tags=["Warehouse Management"])

@router.get("/", response_model=List[WarehouseResponse])
def list_warehouses(db: Session = Depends(get_db)):
    warehouses = db.query(Warehouse).all()
    results = []
    for wh in warehouses:
        util = round((wh.occupied_capacity_sqft / wh.total_capacity_sqft) * 100.0, 1) if wh.total_capacity_sqft else 0.0
        results.append(WarehouseResponse(
            id=wh.id,
            code=wh.code,
            name=wh.name,
            city=wh.city,
            country=wh.country,
            lat=wh.lat,
            lng=wh.lng,
            total_capacity_sqft=wh.total_capacity_sqft,
            occupied_capacity_sqft=wh.occupied_capacity_sqft,
            utilization_percent=util,
            has_cold_storage=wh.has_cold_storage,
            cold_storage_temp_celsius=wh.cold_storage_temp_celsius,
            manager_name=wh.manager_name,
            contact=wh.contact
        ))
    return results

@router.get("/{warehouse_id}/operations")
def get_warehouse_operations(warehouse_id: int, db: Session = Depends(get_db)):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    # Activity and bays
    return {
        "warehouse": {
            "id": wh.id,
            "code": wh.code,
            "name": wh.name,
            "cold_storage_temp": wh.cold_storage_temp_celsius,
            "utilization": round((wh.occupied_capacity_sqft / wh.total_capacity_sqft) * 100.0, 1)
        },
        "loading_bays": [
            {"bay_id": "BAY-01", "type": "REEFER_COLD_DOCK", "status": "OCCUPIED", "vehicle": "TRK-101", "operation": "UNLOADING_PERISHABLES"},
            {"bay_id": "BAY-02", "type": "REEFER_COLD_DOCK", "status": "AVAILABLE", "vehicle": None, "operation": "IDLE"},
            {"bay_id": "BAY-03", "type": "DRY_FREIGHT_DOCK", "status": "OCCUPIED", "vehicle": "TRK-103", "operation": "STAGING_FOR_RAIL"},
            {"bay_id": "BAY-04", "type": "INTERMODAL_CONTAINER_CRANE", "status": "AVAILABLE", "vehicle": None, "operation": "IDLE"}
        ],
        "inventory_records": [
            {"sku": "SKU-MILK-900", "description": "Grade-A Pasteurized Milk (Cartons)", "zone": "Zone A - Deep Chill (2°C)", "pallets": 48, "entry_date": "2026-11-12"},
            {"sku": "SKU-SEAFOOD-412", "description": "Frozen Atlantic Salmon Fillets", "zone": "Zone B - Cryo Freezing (-18°C)", "pallets": 26, "entry_date": "2026-11-10"},
            {"sku": "SKU-PHARMA-101", "description": "Insulin & Biologic Vials", "zone": "Zone C - Cleanroom Cold (4°C)", "pallets": 14, "entry_date": "2026-11-13"}
        ],
        "gate_activity_logs": [
            {"gate": "Gate 1 (Inbound)", "vehicle": "TRK-101", "driver": "Rajesh Kumar", "action": "GATE_IN", "time": "2026-11-13T07:15:00Z", "seal_status": "VERIFIED"},
            {"gate": "Gate 2 (Outbound)", "vehicle": "TRK-102", "driver": "Amitabh Sen", "action": "GATE_OUT", "time": "2026-11-13T08:30:00Z", "seal_status": "VERIFIED"}
        ]
    }
