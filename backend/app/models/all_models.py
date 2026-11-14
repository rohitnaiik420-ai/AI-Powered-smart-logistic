import datetime
import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from ..database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    LOGISTICS_OWNER = "LOGISTICS_OWNER"
    FLEET_MANAGER = "FLEET_MANAGER"
    DRIVER_OPERATOR = "DRIVER_OPERATOR"
    WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER"
    IOT_MANAGER = "IOT_MANAGER"
    CUSTOMER = "CUSTOMER"

class TransportMode(str, enum.Enum):
    ROAD = "ROAD"
    RAIL = "RAIL"
    SEA = "SEA"
    MULTIMODAL = "MULTIMODAL"

class ShipmentStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    PLANNED = "PLANNED"
    IN_TRANSIT = "IN_TRANSIT"
    HANDOVER = "HANDOVER"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    DELAYED = "DELAYED"
    CANCELLED = "CANCELLED"

class FleetType(str, enum.Enum):
    TRUCK = "TRUCK"
    TRAIN = "TRAIN"
    VESSEL = "VESSEL"

class FleetStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    IDLE = "IDLE"
    MAINTENANCE = "MAINTENANCE"
    DELAYED = "DELAYED"
    BREAKDOWN = "BREAKDOWN"

class AlertSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class AlertStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"

class DeviceSourceMode(str, enum.Enum):
    SIMULATED = "SIMULATED"
    HARDWARE = "HARDWARE"

class DeviceStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    WARNING = "WARNING"
    ERROR = "ERROR"

# User Model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.LOGISTICS_OWNER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# Customer Model
class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    company = Column(String(100), nullable=True)
    email = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    address = Column(String(200), nullable=True)
    shipments = relationship("Shipment", back_populates="customer")

# Fleet Entity (Road Truck, Freight Train, Container Vessel)
class FleetEntity(Base):
    __tablename__ = "fleet_entities"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. TRK-101, TRN-804, VSL-ATLANTIS
    name = Column(String(100), nullable=False)
    fleet_type = Column(Enum(FleetType), nullable=False) # TRUCK, TRAIN, VESSEL
    status = Column(Enum(FleetStatus), default=FleetStatus.ACTIVE, nullable=False)
    
    # Live Telematics
    current_lat = Column(Float, nullable=False, default=0.0)
    current_lng = Column(Float, nullable=False, default=0.0)
    current_speed = Column(Float, default=0.0) # km/h
    heading = Column(Float, default=0.0) # degrees
    fuel_level = Column(Float, default=100.0) # percentage
    
    # Operators & Specs
    operator_name = Column(String(100), nullable=True)
    operator_contact = Column(String(50), nullable=True)
    capacity_kg = Column(Float, default=20000.0)
    health_score = Column(Float, default=95.0) # 0-100%
    remaining_useful_life_days = Column(Integer, default=180)
    
    # Relationships
    iot_device_id = Column(String(50), nullable=True) # Linked primary IoT telematics device
    shipments = relationship("Shipment", back_populates="assigned_fleet")
    maintenance_records = relationship("MaintenanceRecord", back_populates="fleet_entity")

# Warehouse Model
class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. WH-MUMBAI-01
    name = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    country = Column(String(100), default="India")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    total_capacity_sqft = Column(Float, default=50000.0)
    occupied_capacity_sqft = Column(Float, default=21000.0)
    has_cold_storage = Column(Boolean, default=True)
    cold_storage_temp_celsius = Column(Float, default=3.5)
    manager_name = Column(String(100), default="Warehouse Supv")
    contact = Column(String(50), default="+1-800-555-WH01")

# Shipment Model
class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. SHP-2026-90412
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    fleet_id = Column(Integer, ForeignKey("fleet_entities.id"), nullable=True)
    
    # Logistics Details
    origin = Column(String(150), nullable=False)
    origin_lat = Column(Float, default=0.0)
    origin_lng = Column(Float, default=0.0)
    destination = Column(String(150), nullable=False)
    destination_lat = Column(Float, default=0.0)
    destination_lng = Column(Float, default=0.0)
    
    transport_mode = Column(Enum(TransportMode), default=TransportMode.ROAD, nullable=False)
    status = Column(Enum(ShipmentStatus), default=ShipmentStatus.REQUESTED, nullable=False)
    progress_percent = Column(Float, default=0.0)
    
    # Cargo Specifications
    cargo_type = Column(String(100), default="Perishable Food") # e.g. Dairy & Frozen Seafood, Electronics, Pharma
    cargo_weight_kg = Column(Float, default=5000.0)
    is_perishable = Column(Boolean, default=True)
    ideal_temp_min = Column(Float, default=2.0)
    ideal_temp_max = Column(Float, default=6.0)
    ideal_humidity_min = Column(Float, default=70.0)
    ideal_humidity_max = Column(Float, default=90.0)
    shelf_life_hours_initial = Column(Float, default=120.0) # Initial shelf-life
    remaining_shelf_life_hours = Column(Float, default=120.0) # Dynamic calculation based on Arrhenius model
    
    # AI Route Optimization Metrics
    estimated_distance_km = Column(Float, default=1200.0)
    estimated_duration_hours = Column(Float, default=24.0)
    estimated_cost_usd = Column(Float, default=1450.0)
    carbon_emissions_kg = Column(Float, default=420.0)
    route_geometry = Column(JSON, nullable=True) # GeoJSON or list of lat/lng waypoints
    ai_recommendation_reason = Column(Text, nullable=True)
    
    # Dates & Timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    pickup_time = Column(DateTime, nullable=True)
    estimated_arrival = Column(DateTime, nullable=True)
    actual_arrival = Column(DateTime, nullable=True)
    
    # Linked Device
    iot_device_id = Column(String(50), nullable=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="shipments")
    assigned_fleet = relationship("FleetEntity", back_populates="shipments")
    handovers = relationship("MultimodalHandover", back_populates="shipment", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="shipment", cascade="all, delete-orphan")

# Multimodal Handover Logs
class MultimodalHandover(Base):
    __tablename__ = "multimodal_handovers"
    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    step_number = Column(Integer, default=1)
    from_mode = Column(Enum(TransportMode), nullable=False)
    to_mode = Column(Enum(TransportMode), nullable=False)
    hub_name = Column(String(100), nullable=False) # e.g. Nhava Sheva Sea Port / ICD Dadri Rail Yard
    hub_type = Column(String(50), default="INTERMODAL_TERMINAL") # PORT, RAIL_YARD, WAREHOUSE, CROSS_DOCK
    responsible_operator = Column(String(100), nullable=False)
    cargo_condition = Column(String(50), default="SEAL_INTACT_OPTIMAL")
    handover_time = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)
    
    shipment = relationship("Shipment", back_populates="handovers")

# IoT Device Registry
class IoTDevice(Base):
    __tablename__ = "iot_devices"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. IOT-TRK-1049, ESP32-COLD-01
    name = Column(String(100), nullable=False)
    device_type = Column(String(50), default="CARGO_MONITOR") # CARGO_MONITOR, FLEET_TELEMATICS, WAREHOUSE_BEACON
    source_mode = Column(Enum(DeviceSourceMode), default=DeviceSourceMode.SIMULATED, nullable=False)
    status = Column(Enum(DeviceStatus), default=DeviceStatus.ONLINE, nullable=False)
    auth_token = Column(String(100), nullable=False) # X-Device-Token for API/MQTT verification
    battery_level = Column(Float, default=94.0) # percentage
    firmware_version = Column(String(30), default="v2.4.1")
    ip_address = Column(String(45), default="192.168.1.105")
    last_ping = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Current assigned entities
    assigned_shipment_id = Column(String(50), nullable=True)
    assigned_fleet_code = Column(String(50), nullable=True)

# Telemetry Record
class TelemetryRecord(Base):
    __tablename__ = "telemetry_records"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), index=True, nullable=False)
    source_mode = Column(Enum(DeviceSourceMode), default=DeviceSourceMode.SIMULATED, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    # Spatial
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    heading = Column(Float, default=0.0)
    altitude_m = Column(Float, default=0.0)
    
    # Environmental & Cargo
    temperature_celsius = Column(Float, nullable=True)
    humidity_percent = Column(Float, nullable=True)
    vibration_g = Column(Float, default=0.0)
    door_open = Column(Boolean, default=False)
    shock_detected = Column(Boolean, default=False)
    
    # Vehicle / Vessel Diagnostics
    engine_temp_celsius = Column(Float, default=88.0)
    oil_pressure_psi = Column(Float, default=45.0)
    battery_voltage = Column(Float, default=24.1)
    fuel_level_percent = Column(Float, default=80.0)
    brake_wear_percent = Column(Float, default=15.0)

# Alert Model
class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. ALT-2026-8801
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=True)
    fleet_code = Column(String(50), nullable=True)
    problem_type = Column(String(100), nullable=False) # e.g. HIGH_TEMPERATURE, PORT_CONGESTION, UNEXPECTED_STOP
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    location_name = Column(String(150), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.HIGH, nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.ACTIVE, nullable=False)
    recommended_action = Column(Text, nullable=False)
    acknowledged_by = Column(String(100), nullable=True)
    resolved_by = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    shipment = relationship("Shipment", back_populates="alerts")

# Maintenance Record
class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    id = Column(Integer, primary_key=True, index=True)
    fleet_id = Column(Integer, ForeignKey("fleet_entities.id"), nullable=False)
    service_type = Column(String(100), nullable=False) # e.g. Brake Replacement, Refrigerant Recharge
    health_score_at_service = Column(Float, default=65.0)
    rul_days_projected = Column(Integer, default=120)
    fault_codes = Column(String(100), default="P0217-ENGINE_HOT")
    scheduled_date = Column(DateTime, nullable=False)
    completed_date = Column(DateTime, nullable=True)
    technician_name = Column(String(100), default="Lead Mech. John Davis")
    cost_usd = Column(Float, default=450.0)
    status = Column(String(50), default="SCHEDULED") # SCHEDULED, IN_PROGRESS, COMPLETED
    ai_recommendation = Column(Text, nullable=True)
    
    fleet_entity = relationship("FleetEntity", back_populates="maintenance_records")

# Simulation State Tracker
class SimulationState(Base):
    __tablename__ = "simulation_states"
    id = Column(Integer, primary_key=True, index=True)
    is_running = Column(Boolean, default=True)
    speed_multiplier = Column(Float, default=1.0) # 1x, 5x, 20x
    tick_count = Column(Integer, default=0)
    active_anomalies = Column(JSON, default={}) # e.g. {"reefer_failure": true, "port_congestion": false}
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)
