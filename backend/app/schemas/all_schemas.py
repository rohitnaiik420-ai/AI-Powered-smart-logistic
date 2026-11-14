from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models.all_models import (
    UserRole, TransportMode, ShipmentStatus, FleetType,
    FleetStatus, AlertSeverity, AlertStatus, DeviceSourceMode, DeviceStatus
)

# Standardized Telemetry Ingestion Schemas (used by both Simulation & Hardware ESP32)
class LocationTelemetry(BaseModel):
    latitude: float
    longitude: float
    speed_kmh: float = 0.0
    heading: float = 0.0
    altitude_m: float = 0.0

class CargoSensorsTelemetry(BaseModel):
    temperature_celsius: float
    humidity_percent: float
    vibration_g: float = 0.0
    door_open: bool = False
    shock_detected: bool = False

class VehicleDiagnosticsTelemetry(BaseModel):
    engine_temp_celsius: float = 88.0
    oil_pressure_psi: float = 45.0
    battery_voltage: float = 24.0
    fuel_level_percent: float = 85.0
    brake_wear_percent: float = 12.0

class TelemetryIngestPayload(BaseModel):
    device_id: str
    device_type: Optional[str] = "CARGO_MONITOR"
    source_mode: DeviceSourceMode = DeviceSourceMode.SIMULATED # Or HARDWARE
    timestamp: Optional[datetime] = None
    firmware_version: Optional[str] = "v2.4.1"
    location: LocationTelemetry
    cargo_sensors: CargoSensorsTelemetry
    vehicle_diagnostics: Optional[VehicleDiagnosticsTelemetry] = None

class TelemetryRecordResponse(BaseModel):
    id: int
    device_id: str
    source_mode: str
    timestamp: datetime
    latitude: float
    longitude: float
    speed_kmh: float
    temperature_celsius: Optional[float]
    humidity_percent: Optional[float]
    vibration_g: float
    door_open: bool
    shock_detected: bool
    engine_temp_celsius: float
    oil_pressure_psi: float
    battery_voltage: float
    fuel_level_percent: float

    class Config:
        from_attributes = True

# IoT Device Registry Schemas
class IoTDeviceCreate(BaseModel):
    device_id: str
    name: str
    device_type: str = "CARGO_MONITOR"
    source_mode: DeviceSourceMode = DeviceSourceMode.SIMULATED
    firmware_version: str = "v2.4.1"
    assigned_shipment_id: Optional[str] = None
    assigned_fleet_code: Optional[str] = None

class IoTDeviceResponse(BaseModel):
    id: int
    device_id: str
    name: str
    device_type: str
    source_mode: str
    status: str
    auth_token: str
    battery_level: float
    firmware_version: str
    ip_address: str
    last_ping: datetime
    assigned_shipment_id: Optional[str]
    assigned_fleet_code: Optional[str]

    class Config:
        from_attributes = True

# Shipment Schemas
class ShipmentCreateRequest(BaseModel):
    customer_name: str
    origin: str
    destination: str
    cargo_type: str = "Perishable Food"
    cargo_weight_kg: float = 5000.0
    is_perishable: bool = True
    ideal_temp_min: float = 2.0
    ideal_temp_max: float = 6.0
    ideal_humidity_min: float = 70.0
    ideal_humidity_max: float = 90.0
    shelf_life_hours_initial: float = 120.0
    transport_preference: Optional[str] = "BALANCED" # FASTEST, CHEAPEST, GREENEST, BALANCED
    selected_mode: Optional[TransportMode] = TransportMode.MULTIMODAL

class MultimodalHandoverCreate(BaseModel):
    step_number: int
    from_mode: TransportMode
    to_mode: TransportMode
    hub_name: str
    hub_type: str = "INTERMODAL_TERMINAL"
    responsible_operator: str
    cargo_condition: str = "SEAL_INTACT_OPTIMAL"
    notes: Optional[str] = None

class MultimodalHandoverResponse(BaseModel):
    id: int
    shipment_id: int
    step_number: int
    from_mode: str
    to_mode: str
    hub_name: str
    hub_type: str
    responsible_operator: str
    cargo_condition: str
    handover_time: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True

class ShipmentResponse(BaseModel):
    id: int
    tracking_number: str
    customer_id: Optional[int]
    fleet_id: Optional[int]
    origin: str
    destination: str
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    transport_mode: str
    status: str
    progress_percent: float
    cargo_type: str
    cargo_weight_kg: float
    is_perishable: bool
    ideal_temp_min: float
    ideal_temp_max: float
    ideal_humidity_min: float
    ideal_humidity_max: float
    shelf_life_hours_initial: float
    remaining_shelf_life_hours: float
    estimated_distance_km: float
    estimated_duration_hours: float
    estimated_cost_usd: float
    carbon_emissions_kg: float
    route_geometry: Optional[List[Dict[str, Any]]]
    ai_recommendation_reason: Optional[str]
    created_at: datetime
    estimated_arrival: Optional[datetime]
    iot_device_id: Optional[str]
    handovers: List[MultimodalHandoverResponse] = []

    class Config:
        from_attributes = True

# Fleet Schemas
class FleetEntityResponse(BaseModel):
    id: int
    code: str
    name: str
    fleet_type: str
    status: str
    current_lat: float
    current_lng: float
    current_speed: float
    heading: float
    fuel_level: float
    operator_name: Optional[str]
    operator_contact: Optional[str]
    capacity_kg: float
    health_score: float
    remaining_useful_life_days: int
    iot_device_id: Optional[str]

    class Config:
        from_attributes = True

# Route Optimization Schemas
class RouteOptimizationRequest(BaseModel):
    origin: str
    destination: str
    cargo_type: str = "Perishable Food"
    cargo_weight_kg: float = 8500.0
    deadline_hours: float = 48.0
    is_perishable: bool = True
    priority: str = "BALANCED" # CHEAPEST, FASTEST, GREENEST, BALANCED

class RouteOption(BaseModel):
    mode: str # ROAD, RAIL, SEA, MULTIMODAL
    label: str
    distance_km: float
    duration_hours: float
    cost_usd: float
    carbon_emissions_kg: float
    perishable_risk_score: float # 0 to 100 (lower is safer)
    reliability_score: float # 0 to 100%
    waypoints: List[Dict[str, Any]]
    segments: List[Dict[str, Any]]
    pros: List[str]
    cons: List[str]
    is_ai_recommended: bool
    recommendation_reason: str

class RouteOptimizationResponse(BaseModel):
    origin: str
    destination: str
    recommended_route: RouteOption
    alternative_routes: List[RouteOption]
    ai_explanation: str
    computed_at: datetime

# Alerts Schemas
class AlertResponse(BaseModel):
    id: int
    alert_code: str
    shipment_id: Optional[int]
    fleet_code: Optional[str]
    problem_type: str
    title: str
    message: str
    location_name: Optional[str]
    lat: Optional[float]
    lng: Optional[float]
    severity: str
    status: str
    recommended_action: str
    acknowledged_by: Optional[str]
    resolved_by: Optional[str]
    timestamp: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True

class AlertStatusUpdate(BaseModel):
    status: AlertStatus
    action_notes: Optional[str] = None
    user_name: Optional[str] = "Logistics Officer"

# Maintenance Schemas
class MaintenanceRecordResponse(BaseModel):
    id: int
    fleet_id: int
    service_type: str
    health_score_at_service: float
    rul_days_projected: int
    fault_codes: str
    scheduled_date: datetime
    completed_date: Optional[datetime]
    technician_name: str
    cost_usd: float
    status: str
    ai_recommendation: Optional[str]

    class Config:
        from_attributes = True

# Warehouse Schemas
class WarehouseResponse(BaseModel):
    id: int
    code: str
    name: str
    city: str
    country: str
    lat: float
    lng: float
    total_capacity_sqft: float
    occupied_capacity_sqft: float
    utilization_percent: float
    has_cold_storage: bool
    cold_storage_temp_celsius: float
    manager_name: str
    contact: str

    class Config:
        from_attributes = True

# Simulation Schemas
class SimulationControlRequest(BaseModel):
    action: str # "START", "PAUSE", "STOP", "RESET", "SPEED_UP", "SPEED_DOWN"
    speed_multiplier: Optional[float] = None

class AnomalyInjectionRequest(BaseModel):
    anomaly_type: str # "REEFER_FAILURE", "PORT_CONGESTION", "RAIL_DELAY", "TRUCK_BREAKDOWN", "DOOR_TAMPER", "NORMAL_CONDITIONS"
    entity_code: Optional[str] = None # Fleet or Device code
    duration_ticks: Optional[int] = 30
