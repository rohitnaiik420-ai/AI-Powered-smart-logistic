import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.all_models import IoTDevice, DeviceSourceMode, DeviceStatus
from ..schemas.all_schemas import IoTDeviceCreate, IoTDeviceResponse

router = APIRouter(prefix="/devices", tags=["Device Management"])

@router.get("/", response_model=List[IoTDeviceResponse])
def list_devices(source_mode: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(IoTDevice)
    if source_mode and source_mode != "ALL":
        query = query.filter(IoTDevice.source_mode == source_mode)
    return query.order_by(IoTDevice.last_ping.desc()).all()

@router.post("/", response_model=IoTDeviceResponse)
def register_device(payload: IoTDeviceCreate, db: Session = Depends(get_db)):
    """
    Registers a new physical (ESP32/GPS/SHT31) or virtual simulation IoT edge device.
    Generates a secure auth token (X-Device-Token) for MQTT/REST data ingestion.
    """
    existing = db.query(IoTDevice).filter(IoTDevice.device_id == payload.device_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Device with this ID already registered.")

    token = f"hw_tok_{uuid.uuid4().hex[:16]}" if payload.source_mode == DeviceSourceMode.HARDWARE else f"sim_tok_{uuid.uuid4().hex[:16]}"
    
    dev = IoTDevice(
        device_id=payload.device_id,
        name=payload.name,
        device_type=payload.device_type,
        source_mode=payload.source_mode,
        status=DeviceStatus.ONLINE,
        auth_token=token,
        battery_level=100.0,
        firmware_version=payload.firmware_version,
        ip_address="192.168.1.200" if payload.source_mode == DeviceSourceMode.HARDWARE else "127.0.0.1",
        last_ping=datetime.datetime.utcnow(),
        assigned_shipment_id=payload.assigned_shipment_id,
        assigned_fleet_code=payload.assigned_fleet_code
    )
    db.add(dev)
    db.commit()
    db.refresh(dev)
    return dev

@router.post("/{device_id}/regenerate-token")
def regenerate_token(device_id: str, db: Session = Depends(get_db)):
    dev = db.query(IoTDevice).filter(IoTDevice.device_id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")

    new_token = f"{'hw' if dev.source_mode == DeviceSourceMode.HARDWARE else 'sim'}_tok_{uuid.uuid4().hex[:16]}"
    dev.auth_token = new_token
    db.commit()
    return {"device_id": dev.device_id, "new_auth_token": new_token}
