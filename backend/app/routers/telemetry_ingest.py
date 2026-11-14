from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models.all_models import IoTDevice, DeviceSourceMode
from ..schemas.all_schemas import TelemetryIngestPayload
from ..services.telemetry_service import UnifiedTelemetryService

router = APIRouter(prefix="/telemetry", tags=["Standardized Ingestion Gateway"])

@router.post("/ingest")
async def ingest_telemetry_packet(
    payload: TelemetryIngestPayload,
    x_device_token: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Standardized Telemetry Ingestion Endpoint.
    Used by:
    1. Physical Edge Devices (ESP32 / Quectel LTE / Raspberry Pi Gateway)
    2. MQTT Bridge service forwards
    3. Simulation Service workers

    Validates payload schema, checks device authentication if in HARDWARE mode,
    runs Arrhenius quality models, checks alert thresholds, and dispatches to WebSockets.
    """
    # If device declares itself as physical hardware, enforce token authentication
    if payload.source_mode == DeviceSourceMode.HARDWARE:
        device = db.query(IoTDevice).filter(IoTDevice.device_id == payload.device_id).first()
        if device and device.auth_token:
            if not x_device_token or x_device_token != device.auth_token:
                raise HTTPException(status_code=401, detail="Hardware device authentication failed: Invalid X-Device-Token.")

    result = await UnifiedTelemetryService.process_telemetry(payload, db)
    return result
