import uuid
import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from ..models.all_models import (
    IoTDevice, TelemetryRecord, FleetEntity, Shipment, Alert,
    DeviceSourceMode, DeviceStatus, AlertSeverity, AlertStatus,
    ShipmentStatus, FleetStatus
)
from ..schemas.all_schemas import TelemetryIngestPayload
from .shelf_life_model import ArrheniusShelfLifePredictor
from .predictive_maintenance import PredictiveMaintenanceEngine

# In-memory WebSocket manager reference (set by main.py)
active_websocket_broadcaster = None

def set_websocket_broadcaster(broadcaster_func):
    global active_websocket_broadcaster
    active_websocket_broadcaster = broadcaster_func

class UnifiedTelemetryService:
    @staticmethod
    async def process_telemetry(payload: TelemetryIngestPayload, db: Session) -> Dict[str, Any]:
        """
        Unified Ingestion Pipeline for both SIMULATION and REAL HARDWARE (ESP32/MQTT/REST).
        Ensures strict schema validation, provenance tagging, threshold evaluations,
        shelf-life kinetic updates, alert generation, and real-time WebSocket fan-out.
        """
        device_id = payload.device_id
        source_mode = payload.source_mode or DeviceSourceMode.SIMULATED
        ts = payload.timestamp or datetime.datetime.utcnow()

        # 1. Device lookup or auto-registration
        device = db.query(IoTDevice).filter(IoTDevice.device_id == device_id).first()
        if not device:
            device = IoTDevice(
                device_id=device_id,
                name=f"Device {device_id}",
                device_type=payload.device_type or "CARGO_MONITOR",
                source_mode=source_mode,
                status=DeviceStatus.ONLINE,
                auth_token=f"tok_{uuid.uuid4().hex[:16]}",
                battery_level=95.0,
                firmware_version=payload.firmware_version or "v2.4.1",
                last_ping=ts
            )
            db.add(device)
            db.flush()
        else:
            device.last_ping = ts
            device.status = DeviceStatus.ONLINE
            device.source_mode = source_mode
            if payload.firmware_version:
                device.firmware_version = payload.firmware_version

        # 2. Persist Telemetry Record
        telemetry_rec = TelemetryRecord(
            device_id=device_id,
            source_mode=source_mode,
            timestamp=ts,
            latitude=payload.location.latitude,
            longitude=payload.location.longitude,
            speed_kmh=payload.location.speed_kmh,
            heading=payload.location.heading,
            altitude_m=payload.location.altitude_m,
            temperature_celsius=payload.cargo_sensors.temperature_celsius,
            humidity_percent=payload.cargo_sensors.humidity_percent,
            vibration_g=payload.cargo_sensors.vibration_g,
            door_open=payload.cargo_sensors.door_open,
            shock_detected=payload.cargo_sensors.shock_detected,
            engine_temp_celsius=payload.vehicle_diagnostics.engine_temp_celsius if payload.vehicle_diagnostics else 88.0,
            oil_pressure_psi=payload.vehicle_diagnostics.oil_pressure_psi if payload.vehicle_diagnostics else 45.0,
            battery_voltage=payload.vehicle_diagnostics.battery_voltage if payload.vehicle_diagnostics else 24.0,
            fuel_level_percent=payload.vehicle_diagnostics.fuel_level_percent if payload.vehicle_diagnostics else 80.0,
            brake_wear_percent=payload.vehicle_diagnostics.brake_wear_percent if payload.vehicle_diagnostics else 15.0
        )
        db.add(telemetry_rec)

        # 3. Update associated Fleet Entity (if linked)
        fleet = None
        if device.assigned_fleet_code:
            fleet = db.query(FleetEntity).filter(FleetEntity.code == device.assigned_fleet_code).first()
        if not fleet:
            fleet = db.query(FleetEntity).filter(FleetEntity.iot_device_id == device_id).first()

        new_alerts = []

        if fleet:
            fleet.current_lat = payload.location.latitude
            fleet.current_lng = payload.location.longitude
            fleet.current_speed = payload.location.speed_kmh
            fleet.heading = payload.location.heading
            if payload.vehicle_diagnostics:
                fleet.fuel_level = max(0.0, payload.vehicle_diagnostics.fuel_level_percent)

                # Run predictive maintenance analysis
                maint_eval = PredictiveMaintenanceEngine.evaluate_telemetry(
                    engine_temp=payload.vehicle_diagnostics.engine_temp_celsius,
                    oil_pressure=payload.vehicle_diagnostics.oil_pressure_psi,
                    battery_voltage=payload.vehicle_diagnostics.battery_voltage,
                    brake_wear_percent=payload.vehicle_diagnostics.brake_wear_percent,
                    vibration_g=payload.cargo_sensors.vibration_g
                )
                fleet.health_score = maint_eval["health_score"]
                fleet.remaining_useful_life_days = maint_eval["rul_days"]

                # If health score drops below critical threshold, generate maintenance alert
                if maint_eval["health_score"] < 50.0:
                    alert_code = f"ALT-MNT-{uuid.uuid4().hex[:6].upper()}"
                    existing_alert = db.query(Alert).filter(
                        Alert.fleet_code == fleet.code,
                        Alert.status == AlertStatus.ACTIVE,
                        Alert.problem_type == "VEHICLE_HEALTH_CRITICAL"
                    ).first()
                    if not existing_alert:
                        crit_alert = Alert(
                            alert_code=alert_code,
                            fleet_code=fleet.code,
                            problem_type="VEHICLE_HEALTH_CRITICAL",
                            title=f"Critical Equipment Health Warning ({fleet.code})",
                            message=f"Health Score degraded to {maint_eval['health_score']}%. Fault Codes: {maint_eval['fault_codes']}",
                            location_name=f"Lat {fleet.current_lat:.4f}, Lng {fleet.current_lng:.4f}",
                            lat=fleet.current_lat,
                            lng=fleet.current_lng,
                            severity=AlertSeverity.CRITICAL,
                            status=AlertStatus.ACTIVE,
                            recommended_action=maint_eval["recommendations"][0] if maint_eval["recommendations"] else "Inspect vehicle immediately.",
                            timestamp=ts
                        )
                        db.add(crit_alert)
                        new_alerts.append(crit_alert)

        # 4. Update associated Shipment & Arrhenius Food Quality
        shipment = None
        if device.assigned_shipment_id:
            shipment = db.query(Shipment).filter(Shipment.tracking_number == device.assigned_shipment_id).first()
        if not shipment:
            shipment = db.query(Shipment).filter(Shipment.iot_device_id == device_id).first()

        if shipment and shipment.status in [ShipmentStatus.IN_TRANSIT, ShipmentStatus.HANDOVER, ShipmentStatus.OUT_FOR_DELIVERY]:
            # Shelf-life decay update (assuming ~12 seconds simulation step represents 0.2 hours effective time)
            if shipment.is_perishable:
                new_shelf_life, acc_factor, assessment = ArrheniusShelfLifePredictor.update_shelf_life(
                    cargo_type=shipment.cargo_type,
                    current_remaining_hours=shipment.remaining_shelf_life_hours,
                    current_temp_celsius=payload.cargo_sensors.temperature_celsius,
                    time_elapsed_hours=0.1
                )
                shipment.remaining_shelf_life_hours = new_shelf_life

                # Temperature breach detection
                if payload.cargo_sensors.temperature_celsius > shipment.ideal_temp_max:
                    temp_breach = payload.cargo_sensors.temperature_celsius - shipment.ideal_temp_max
                    alert_code = f"ALT-TMP-{uuid.uuid4().hex[:6].upper()}"
                    existing_alert = db.query(Alert).filter(
                        Alert.shipment_id == shipment.id,
                        Alert.status == AlertStatus.ACTIVE,
                        Alert.problem_type == "HIGH_TEMPERATURE"
                    ).first()
                    if not existing_alert:
                        temp_alert = Alert(
                            alert_code=alert_code,
                            shipment_id=shipment.id,
                            fleet_code=fleet.code if fleet else None,
                            problem_type="HIGH_TEMPERATURE",
                            title=f"Cold-Chain Thermal Excursion (+{temp_breach:.1f}°C)",
                            message=f"Current reefer temp {payload.cargo_sensors.temperature_celsius}°C exceeds safe threshold {shipment.ideal_temp_max}°C. {assessment}",
                            location_name=f"Lat {payload.location.latitude:.4f}, Lng {payload.location.longitude:.4f}",
                            lat=payload.location.latitude,
                            lng=payload.location.longitude,
                            severity=AlertSeverity.CRITICAL if temp_breach > 4.0 else AlertSeverity.HIGH,
                            status=AlertStatus.ACTIVE,
                            recommended_action="Inspect auxiliary reefer diesel generator, verify thermostat setpoint, and check door seals.",
                            timestamp=ts
                        )
                        db.add(temp_alert)
                        new_alerts.append(temp_alert)

            # Door opening breach detection
            if payload.cargo_sensors.door_open:
                alert_code = f"ALT-DOR-{uuid.uuid4().hex[:6].upper()}"
                existing_alert = db.query(Alert).filter(
                    Alert.shipment_id == shipment.id,
                    Alert.status == AlertStatus.ACTIVE,
                    Alert.problem_type == "UNAUTHORIZED_DOOR_BREACH"
                ).first()
                if not existing_alert:
                    door_alert = Alert(
                        alert_code=alert_code,
                        shipment_id=shipment.id,
                        fleet_code=fleet.code if fleet else None,
                        problem_type="UNAUTHORIZED_DOOR_BREACH",
                        title="Reefer Cargo Door Opened In Transit",
                        message=f"Cargo door magnetic reed switch triggered at speed {payload.location.speed_kmh} km/h.",
                        location_name=f"En-route corridor ({payload.location.latitude:.3f}, {payload.location.longitude:.3f})",
                        lat=payload.location.latitude,
                        lng=payload.location.longitude,
                        severity=AlertSeverity.HIGH,
                        status=AlertStatus.ACTIVE,
                        recommended_action="Verify driver security clearance and contact dispatch tower immediately.",
                        timestamp=ts
                    )
                    db.add(door_alert)
                    new_alerts.append(door_alert)

            # Excessive vibration / shock detection
            if payload.cargo_sensors.shock_detected or payload.cargo_sensors.vibration_g > 1.8:
                alert_code = f"ALT-SHK-{uuid.uuid4().hex[:6].upper()}"
                existing_alert = db.query(Alert).filter(
                    Alert.shipment_id == shipment.id,
                    Alert.status == AlertStatus.ACTIVE,
                    Alert.problem_type == "EXCESSIVE_VIBRATION_SHOCK"
                ).first()
                if not existing_alert:
                    shock_alert = Alert(
                        alert_code=alert_code,
                        shipment_id=shipment.id,
                        fleet_code=fleet.code if fleet else None,
                        problem_type="EXCESSIVE_VIBRATION_SHOCK",
                        title=f"Severe Cargo Impact ({payload.cargo_sensors.vibration_g:.2f}g)",
                        message="3-axis accelerometer detected impact exceeding 1.8g safety limit. Potential road pothole or train coupling shock.",
                        location_name=f"Corridor Point ({payload.location.latitude:.3f}, {payload.location.longitude:.3f})",
                        lat=payload.location.latitude,
                        lng=payload.location.longitude,
                        severity=AlertSeverity.MEDIUM,
                        status=AlertStatus.ACTIVE,
                        recommended_action="Inspect packaging integrity and inner pallet strapping upon next intermodal transfer.",
                        timestamp=ts
                    )
                    db.add(shock_alert)
                    new_alerts.append(shock_alert)

        db.commit()

        # 5. Broadcast real-time update via WebSocket
        broadcast_data = {
            "type": "TELEMETRY_UPDATE",
            "source_mode": source_mode,
            "device_id": device_id,
            "timestamp": ts.isoformat(),
            "location": {
                "lat": payload.location.latitude,
                "lng": payload.location.longitude,
                "speed": payload.location.speed_kmh,
                "heading": payload.location.heading
            },
            "cargo": {
                "temperature": payload.cargo_sensors.temperature_celsius,
                "humidity": payload.cargo_sensors.humidity_percent,
                "vibration": payload.cargo_sensors.vibration_g,
                "door_open": payload.cargo_sensors.door_open
            },
            "fleet": {
                "code": fleet.code if fleet else None,
                "health_score": fleet.health_score if fleet else None,
                "fuel": fleet.fuel_level if fleet else None
            },
            "shipment": {
                "tracking_number": shipment.tracking_number if shipment else None,
                "remaining_shelf_life": shipment.remaining_shelf_life_hours if shipment else None,
                "status": shipment.status if shipment else None
            },
            "new_alerts_count": len(new_alerts)
        }

        if active_websocket_broadcaster:
            await active_websocket_broadcaster(broadcast_data)

        return {
            "status": "SUCCESS",
            "device_id": device_id,
            "source_mode": source_mode,
            "alerts_generated": len(new_alerts)
        }
