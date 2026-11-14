import asyncio
import math
import random
import datetime
from typing import Dict, Any, List, Optional
from ..database import SessionLocal
from ..models.all_models import (
    FleetEntity, FleetType, Shipment, IoTDevice,
    DeviceSourceMode, SimulationState, FleetStatus
)
from ..schemas.all_schemas import (
    TelemetryIngestPayload, LocationTelemetry,
    CargoSensorsTelemetry, VehicleDiagnosticsTelemetry
)
from .telemetry_service import UnifiedTelemetryService

# Realistic corridor waypoints for Road, Rail, and Sea
CORRIDORS = {
    # Delhi to Mumbai via NH48 Highway (Road Corridor)
    "ROAD_DELHI_MUMBAI": [
        {"lat": 28.6139, "lng": 77.2090, "name": "Delhi Freight Hub"},
        {"lat": 27.9135, "lng": 76.5458, "name": "Rewari Expressway"},
        {"lat": 26.9124, "lng": 75.7873, "name": "Jaipur Bypass"},
        {"lat": 25.3407, "lng": 74.6313, "name": "Bhilwara Tollway"},
        {"lat": 24.5854, "lng": 73.7125, "name": "Udaipur Ghati"},
        {"lat": 23.0225, "lng": 72.5714, "name": "Ahmedabad Ring Road"},
        {"lat": 22.3072, "lng": 73.1812, "name": "Vadodara Logistics Hub"},
        {"lat": 21.1702, "lng": 72.8311, "name": "Surat Industrial Gate"},
        {"lat": 20.3852, "lng": 72.9106, "name": "Vapi Checkpost"},
        {"lat": 19.2183, "lng": 72.9781, "name": "Thane Toll Plaza"},
        {"lat": 18.9553, "lng": 72.8447, "name": "Mumbai Port Trust"}
    ],
    # Western Dedicated Freight Corridor (Rail Corridor)
    "RAIL_WDFC": [
        {"lat": 28.5355, "lng": 77.5615, "name": "ICD Dadri Rail Terminal"},
        {"lat": 28.1882, "lng": 76.6186, "name": "Rewari Freight Junction"},
        {"lat": 26.4499, "lng": 74.6399, "name": "Ajmer Rail Marshalling"},
        {"lat": 25.1011, "lng": 73.0850, "name": "Marwar Rail Yard"},
        {"lat": 24.2676, "lng": 72.4388, "name": "Palanpur Freight Siding"},
        {"lat": 23.0039, "lng": 72.3812, "name": "Sanand Intermodal Rake Hub"},
        {"lat": 21.7051, "lng": 72.9959, "name": "Bharuch Rail Bridge"},
        {"lat": 19.8347, "lng": 72.8123, "name": "Palghar Rail Section"},
        {"lat": 18.9499, "lng": 72.9511, "name": "JNPT Port Container Rail Terminal"}
    ],
    # Arabian Sea Maritime Shipping Lane (Sea Corridor: Mumbai JNPT -> Dubai Jebel Ali)
    "SEA_ARABIAN_GULF": [
        {"lat": 18.9500, "lng": 72.9500, "name": "JNPT Deepwater Port Berth 4"},
        {"lat": 18.7500, "lng": 72.5000, "name": "Mumbai Pilot Station Outer Anchorage"},
        {"lat": 19.2000, "lng": 70.0000, "name": "Arabian Sea Northbound Lane"},
        {"lat": 21.0000, "lng": 66.0000, "name": "Deep Ocean Shipping Lane Alpha"},
        {"lat": 23.5000, "lng": 61.0000, "name": "Gulf of Oman Western Approach"},
        {"lat": 24.5000, "lng": 58.0000, "name": "Strait of Hormuz Ingress Lane"},
        {"lat": 25.2048, "lng": 55.2708, "name": "Jebel Ali Port Container Terminal 2"}
    ]
}

def interpolate_position(waypoints: List[Dict[str, Any]], progress: float):
    """
    Interpolates lat, lng and heading along a list of waypoints based on progress [0.0 - 1.0].
    """
    if not waypoints:
        return 28.6139, 77.2090, 0.0

    total_segments = len(waypoints) - 1
    if total_segments <= 0:
        return waypoints[0]["lat"], waypoints[0]["lng"], 0.0

    scaled = progress * total_segments
    seg_idx = int(scaled)
    if seg_idx >= total_segments:
        return waypoints[-1]["lat"], waypoints[-1]["lng"], 0.0

    seg_progress = scaled - seg_idx
    p1 = waypoints[seg_idx]
    p2 = waypoints[seg_idx + 1]

    lat = p1["lat"] + (p2["lat"] - p1["lat"]) * seg_progress
    lng = p1["lng"] + (p2["lng"] - p1["lng"]) * seg_progress

    # Calculate heading angle
    d_lat = p2["lat"] - p1["lat"]
    d_lng = p2["lng"] - p1["lng"]
    heading = (math.degrees(math.atan2(d_lng, d_lat)) + 360) % 360

    return lat, lng, heading

class SimulationManager:
    def __init__(self):
        self.is_running = True
        self.speed_multiplier = 1.0 # 1x, 5x, 20x
        self.tick_count = 0
        self.active_anomalies: Dict[str, Any] = {} # e.g. {"REEFER_FAILURE": True}
        self.entity_progress: Dict[str, float] = {
            "TRK-101": 0.32,
            "TRK-102": 0.74,
            "TRK-103": 0.15,
            "TRN-804": 0.48,
            "TRN-902": 0.81,
            "VSL-ATLANTIS": 0.61,
            "VSL-PACIFIC": 0.22
        }
        self._task: Optional[asyncio.Task] = None

    def start(self):
        self.is_running = True
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._simulation_loop())

    def pause(self):
        self.is_running = False

    def reset(self):
        self.tick_count = 0
        self.active_anomalies.clear()
        self.entity_progress = {
            "TRK-101": 0.0,
            "TRK-102": 0.25,
            "TRK-103": 0.50,
            "TRN-804": 0.10,
            "TRN-902": 0.60,
            "VSL-ATLANTIS": 0.30,
            "VSL-PACIFIC": 0.05
        }

    def set_speed(self, multiplier: float):
        self.speed_multiplier = max(0.5, min(50.0, multiplier))

    def inject_anomaly(self, anomaly_type: str, entity_code: Optional[str] = None):
        if anomaly_type == "NORMAL_CONDITIONS":
            self.active_anomalies.clear()
        else:
            self.active_anomalies[anomaly_type] = {
                "active": True,
                "entity": entity_code or "TRK-101",
                "injected_at": datetime.datetime.utcnow().isoformat()
            }

    async def _simulation_loop(self):
        """Continuous background tick loop generating realistic multimodal telematics"""
        while True:
            try:
                if self.is_running:
                    self.tick_count += 1
                    await self._execute_tick()
            except Exception as e:
                # Keep loop resilient
                print(f"[SIMULATION_ENGINE_ERROR] {e}")

            # Base tick frequency: 2 seconds / speed_multiplier
            sleep_time = max(0.2, 2.0 / self.speed_multiplier)
            await asyncio.sleep(sleep_time)

    async def _execute_tick(self):
        db = SessionLocal()
        try:
            # Step progress for each simulated asset
            step_delta = 0.003 * self.speed_multiplier

            # Active anomaly checks
            reefer_fail = "REEFER_FAILURE" in self.active_anomalies
            door_tamper = "DOOR_TAMPER" in self.active_anomalies
            breakdown = "TRUCK_BREAKDOWN" in self.active_anomalies
            port_congestion = "PORT_CONGESTION" in self.active_anomalies
            rail_delay = "RAIL_DELAY" in self.active_anomalies

            # 1. Road Vehicles
            road_corridor = CORRIDORS["ROAD_DELHI_MUMBAI"]
            for trk_code in ["TRK-101", "TRK-102", "TRK-103"]:
                prog = (self.entity_progress.get(trk_code, 0.0) + step_delta) % 1.0
                self.entity_progress[trk_code] = prog

                lat, lng, heading = interpolate_position(road_corridor, prog)
                # Add micro-variation GPS jitter
                lat += random.uniform(-0.0008, 0.0008)
                lng += random.uniform(-0.0008, 0.0008)

                speed = random.uniform(62.0, 78.0)
                temp = random.uniform(3.2, 4.4)
                humidity = random.uniform(78.0, 84.0)
                vibration = random.uniform(0.08, 0.18)
                door = False
                shock = False
                engine_temp = 89.0 + random.uniform(-2.0, 3.0)
                oil_press = 46.0 + random.uniform(-1.5, 1.5)
                brake_wear = 18.0 + (prog * 5.0)

                # Anomaly injections on TRK-101
                if trk_code == "TRK-101":
                    if reefer_fail:
                        temp = 11.8 + random.uniform(0.2, 1.5) # High temperature alert!
                        humidity = 62.0
                    if door_tamper:
                        door = True
                        temp += 3.0
                    if breakdown:
                        speed = 0.0
                        engine_temp = 112.5 # Critical coolant overtemp
                        oil_press = 21.0 # Low oil pressure
                        vibration = 0.02

                payload = TelemetryIngestPayload(
                    device_id=f"IOT-{trk_code}",
                    device_type="ROAD_REEFER_TELEMATICS",
                    source_mode=DeviceSourceMode.SIMULATED,
                    timestamp=datetime.datetime.utcnow(),
                    firmware_version="v2.4.1",
                    location=LocationTelemetry(
                        latitude=lat,
                        longitude=lng,
                        speed_kmh=round(speed, 1),
                        heading=round(heading, 1),
                        altitude_m=215.0
                    ),
                    cargo_sensors=CargoSensorsTelemetry(
                        temperature_celsius=round(temp, 2),
                        humidity_percent=round(humidity, 1),
                        vibration_g=round(vibration, 3),
                        door_open=door,
                        shock_detected=shock
                    ),
                    vehicle_diagnostics=VehicleDiagnosticsTelemetry(
                        engine_temp_celsius=round(engine_temp, 1),
                        oil_pressure_psi=round(oil_press, 1),
                        battery_voltage=24.2,
                        fuel_level_percent=max(5.0, round(92.0 - (prog * 40.0), 1)),
                        brake_wear_percent=round(brake_wear, 1)
                    )
                )
                await UnifiedTelemetryService.process_telemetry(payload, db)

            # 2. Rail Freight Fleet
            rail_corridor = CORRIDORS["RAIL_WDFC"]
            for trn_code in ["TRN-804", "TRN-902"]:
                prog = (self.entity_progress.get(trn_code, 0.0) + (step_delta * 0.8)) % 1.0
                self.entity_progress[trn_code] = prog

                lat, lng, heading = interpolate_position(rail_corridor, prog)
                speed = 52.0 if not (rail_delay and trn_code == "TRN-804") else 0.0
                temp = 2.8 + random.uniform(-0.3, 0.3)
                vibration = 0.11 if speed > 0 else 0.01

                payload = TelemetryIngestPayload(
                    device_id=f"IOT-{trn_code}",
                    device_type="RAIL_WAGON_MONITOR",
                    source_mode=DeviceSourceMode.SIMULATED,
                    timestamp=datetime.datetime.utcnow(),
                    firmware_version="v3.1.0",
                    location=LocationTelemetry(
                        latitude=lat,
                        longitude=lng,
                        speed_kmh=round(speed, 1),
                        heading=round(heading, 1),
                        altitude_m=180.0
                    ),
                    cargo_sensors=CargoSensorsTelemetry(
                        temperature_celsius=round(temp, 2),
                        humidity_percent=82.0,
                        vibration_g=round(vibration, 3),
                        door_open=False,
                        shock_detected=False
                    ),
                    vehicle_diagnostics=VehicleDiagnosticsTelemetry(
                        engine_temp_celsius=85.0,
                        oil_pressure_psi=50.0,
                        battery_voltage=24.5,
                        fuel_level_percent=round(88.0 - (prog * 25.0), 1),
                        brake_wear_percent=12.0
                    )
                )
                await UnifiedTelemetryService.process_telemetry(payload, db)

            # 3. Sea Freight Fleet (Vessels)
            sea_corridor = CORRIDORS["SEA_ARABIAN_GULF"]
            for vsl_code in ["VSL-ATLANTIS", "VSL-PACIFIC"]:
                prog = (self.entity_progress.get(vsl_code, 0.0) + (step_delta * 0.4)) % 1.0
                self.entity_progress[vsl_code] = prog

                lat, lng, heading = interpolate_position(sea_corridor, prog)
                speed = 22.5 if not (port_congestion and vsl_code == "VSL-ATLANTIS") else 1.2
                temp = 3.1 + random.uniform(-0.2, 0.2)

                payload = TelemetryIngestPayload(
                    device_id=f"IOT-{vsl_code}",
                    device_type="VESSEL_AIS_REEFER",
                    source_mode=DeviceSourceMode.SIMULATED,
                    timestamp=datetime.datetime.utcnow(),
                    firmware_version="v4.0.2",
                    location=LocationTelemetry(
                        latitude=lat,
                        longitude=lng,
                        speed_kmh=round(speed, 1),
                        heading=round(heading, 1),
                        altitude_m=5.0
                    ),
                    cargo_sensors=CargoSensorsTelemetry(
                        temperature_celsius=round(temp, 2),
                        humidity_percent=85.5,
                        vibration_g=0.04,
                        door_open=False,
                        shock_detected=False
                    ),
                    vehicle_diagnostics=VehicleDiagnosticsTelemetry(
                        engine_temp_celsius=78.0,
                        oil_pressure_psi=55.0,
                        battery_voltage=24.8,
                        fuel_level_percent=round(95.0 - (prog * 20.0), 1),
                        brake_wear_percent=5.0
                    )
                )
                await UnifiedTelemetryService.process_telemetry(payload, db)

        finally:
            db.close()

simulation_manager = SimulationManager()
