import datetime
from sqlalchemy.orm import Session
from .models.all_models import (
    User, UserRole, Customer, FleetEntity, FleetType, FleetStatus,
    TransportMode, Shipment, ShipmentStatus, MultimodalHandover,
    Warehouse, IoTDevice, DeviceSourceMode, DeviceStatus,
    Alert, AlertSeverity, AlertStatus, MaintenanceRecord, SimulationState
)

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).count() > 0:
        return

    print("[DATABASE_SEED] Initializing default enterprise logistics entities...")

    # 1. Users for each role
    users = [
        User(username="admin", email="admin@smartlogistics.io", full_name="Alexander Sterling", role=UserRole.SUPER_ADMIN),
        User(username="owner", email="owner@smartlogistics.io", full_name="Vikramaditya Singhania", role=UserRole.LOGISTICS_OWNER),
        User(username="fleet_mgr", email="fleet@smartlogistics.io", full_name="Sarah Jenkins", role=UserRole.FLEET_MANAGER),
        User(username="driver_raj", email="rajesh@smartlogistics.io", full_name="Rajesh Kumar", role=UserRole.DRIVER_OPERATOR),
        User(username="wh_mgr", email="warehouse@smartlogistics.io", full_name="Deepak Sharma", role=UserRole.WAREHOUSE_MANAGER),
        User(username="iot_lead", email="iot@smartlogistics.io", full_name="Elena Rostova", role=UserRole.IOT_MANAGER),
        User(username="customer_corp", email="procurement@globalcoldfoods.com", full_name="David Miller", role=UserRole.CUSTOMER),
    ]
    db.add_all(users)
    db.flush()

    # 2. Customers
    cust1 = Customer(name="Global Cold Foods Inc.", company="Global Cold Foods", email="logistics@globalcoldfoods.com", phone="+91-22-2490-1100", address="Nariman Point, Mumbai")
    cust2 = Customer(name="Aurobindo BioPharma Ltd", company="Aurobindo Pharma", email="supplychain@aurobindo.com", phone="+91-11-4155-2233", address="Okhla Phase III, New Delhi")
    cust3 = Customer(name="Pacific Agro Fresh Exports", company="Pacific Agro", email="ops@pacificagro.com", phone="+91-79-2656-7890", address="Navrangpura, Ahmedabad")
    db.add_all([cust1, cust2, cust3])
    db.flush()

    # 3. Warehouses
    warehouses = [
        Warehouse(
            code="WH-MUM-01",
            name="Jawaharlal Nehru Cold Storage Terminal",
            city="Mumbai",
            country="India",
            lat=18.9553,
            lng=72.8447,
            total_capacity_sqft=85000.0,
            occupied_capacity_sqft=54200.0,
            has_cold_storage=True,
            cold_storage_temp_celsius=3.2,
            manager_name="Karan Mehta",
            contact="+91-22-2724-4001"
        ),
        Warehouse(
            code="WH-DEL-02",
            name="National Capital Logistics & Rail Depot",
            city="Delhi",
            country="India",
            lat=28.6139,
            lng=77.2090,
            total_capacity_sqft=120000.0,
            occupied_capacity_sqft=81500.0,
            has_cold_storage=True,
            cold_storage_temp_celsius=4.0,
            manager_name="Rajiv Verma",
            contact="+91-11-2391-8899"
        ),
        Warehouse(
            code="WH-AHM-03",
            name="Gujarat Intermodal Cross-Dock Facility",
            city="Ahmedabad",
            country="India",
            lat=23.0225,
            lng=72.5714,
            total_capacity_sqft=65000.0,
            occupied_capacity_sqft=29000.0,
            has_cold_storage=True,
            cold_storage_temp_celsius=2.8,
            manager_name="Nilesh Patel",
            contact="+91-79-2287-6543"
        ),
        Warehouse(
            code="WH-DXB-04",
            name="Jebel Ali Freezone Perishables Hub",
            city="Dubai",
            country="United Arab Emirates",
            lat=25.2048,
            lng=55.2708,
            total_capacity_sqft=150000.0,
            occupied_capacity_sqft=98000.0,
            has_cold_storage=True,
            cold_storage_temp_celsius=1.5,
            manager_name="Tariq Mansoor",
            contact="+971-4-881-2200"
        )
    ]
    db.add_all(warehouses)
    db.flush()

    # 4. Fleet Entities (Road, Rail, Sea)
    fleet = [
        # Road Trucks
        FleetEntity(
            code="TRK-101",
            name="Volvo FH16 Multi-Temp Reefer Truck",
            fleet_type=FleetType.TRUCK,
            status=FleetStatus.ACTIVE,
            current_lat=24.5854,
            current_lng=73.7125,
            current_speed=68.5,
            heading=195.0,
            fuel_level=78.0,
            operator_name="Rajesh Kumar",
            operator_contact="+91-98201-11223",
            capacity_kg=22000.0,
            health_score=94.5,
            remaining_useful_life_days=175,
            iot_device_id="IOT-TRK-101"
        ),
        FleetEntity(
            code="TRK-102",
            name="Scania R500 Heavy Freight Carrier",
            fleet_type=FleetType.TRUCK,
            status=FleetStatus.ACTIVE,
            current_lat=21.1702,
            current_lng=72.8311,
            current_speed=72.0,
            heading=185.0,
            fuel_level=64.0,
            operator_name="Amitabh Sen",
            operator_contact="+91-98201-44556",
            capacity_kg=25000.0,
            health_score=89.0,
            remaining_useful_life_days=140,
            iot_device_id="IOT-TRK-102"
        ),
        FleetEntity(
            code="TRK-103",
            name="Mercedes-Benz Actros Cold Express",
            fleet_type=FleetType.TRUCK,
            status=FleetStatus.IDLE,
            current_lat=28.6139,
            current_lng=77.2090,
            current_speed=0.0,
            heading=0.0,
            fuel_level=95.0,
            operator_name="Sanjay Rao",
            operator_contact="+91-98201-77889",
            capacity_kg=20000.0,
            health_score=96.0,
            remaining_useful_life_days=210,
            iot_device_id="IOT-TRK-103"
        ),
        # Rail Trains
        FleetEntity(
            code="TRN-804",
            name="WDFC Electric Heavy-Haul Rake #804",
            fleet_type=FleetType.TRAIN,
            status=FleetStatus.ACTIVE,
            current_lat=25.1011,
            current_lng=73.0850,
            current_speed=55.0,
            heading=192.0,
            fuel_level=90.0, # Electric traction grid efficiency
            operator_name="Chief Locopilot Harpreet Singh",
            operator_contact="+91-11-2334-0011",
            capacity_kg=350000.0, # 45 Container wagons
            health_score=92.0,
            remaining_useful_life_days=260,
            iot_device_id="IOT-TRN-804"
        ),
        FleetEntity(
            code="TRN-902",
            name="Northern Fast Freight Express #902",
            fleet_type=FleetType.TRAIN,
            status=FleetStatus.ACTIVE,
            current_lat=23.0039,
            current_lng=72.3812,
            current_speed=48.0,
            heading=188.0,
            fuel_level=86.0,
            operator_name="Locopilot Manoj Joshi",
            operator_contact="+91-79-2211-3344",
            capacity_kg=320000.0,
            health_score=88.5,
            remaining_useful_life_days=190,
            iot_device_id="IOT-TRN-902"
        ),
        # Sea Vessels
        FleetEntity(
            code="VSL-ATLANTIS",
            name="CMA CGM Atlantis Container Vessel (8,500 TEU)",
            fleet_type=FleetType.VESSEL,
            status=FleetStatus.ACTIVE,
            current_lat=21.0000,
            current_lng=66.0000,
            current_speed=21.4,
            heading=275.0,
            fuel_level=82.0,
            operator_name="Captain Henrik Visser",
            operator_contact="MMSI-354921000",
            capacity_kg=12000000.0,
            health_score=95.0,
            remaining_useful_life_days=420,
            iot_device_id="IOT-VSL-ATLANTIS"
        ),
        FleetEntity(
            code="VSL-PACIFIC",
            name="Maersk Pearl Ocean Liner (12,000 TEU)",
            fleet_type=FleetType.VESSEL,
            status=FleetStatus.ACTIVE,
            current_lat=19.2000,
            current_lng=70.0000,
            current_speed=23.1,
            heading=280.0,
            fuel_level=88.0,
            operator_name="Captain Arthur Pendelton",
            operator_contact="MMSI-211489000",
            capacity_kg=15000000.0,
            health_score=97.0,
            remaining_useful_life_days=500,
            iot_device_id="IOT-VSL-PACIFIC"
        )
    ]
    db.add_all(fleet)
    db.flush()

    # 5. IoT Devices (Simulated + Hardware-Ready Registration)
    devices = [
        IoTDevice(device_id="IOT-TRK-101", name="Truck 101 Telematics & Reefer Gateway", device_type="ROAD_REEFER_TELEMATICS", source_mode=DeviceSourceMode.SIMULATED, status=DeviceStatus.ONLINE, auth_token="tok_sim_trk101_secure", battery_level=96.0, assigned_fleet_code="TRK-101", assigned_shipment_id="SHP-2026-90412"),
        IoTDevice(device_id="IOT-TRK-102", name="Truck 102 Fleet Beacon", device_type="ROAD_REEFER_TELEMATICS", source_mode=DeviceSourceMode.SIMULATED, status=DeviceStatus.ONLINE, auth_token="tok_sim_trk102_secure", battery_level=91.0, assigned_fleet_code="TRK-102", assigned_shipment_id="SHP-2026-77103"),
        IoTDevice(device_id="IOT-TRK-103", name="Truck 103 Cold Monitor", device_type="ROAD_REEFER_TELEMATICS", source_mode=DeviceSourceMode.SIMULATED, status=DeviceStatus.ONLINE, auth_token="tok_sim_trk103_secure", battery_level=98.0, assigned_fleet_code="TRK-103"),
        IoTDevice(device_id="IOT-TRN-804", name="Wagon 804 Telematics Pod", device_type="RAIL_WAGON_MONITOR", source_mode=DeviceSourceMode.SIMULATED, status=DeviceStatus.ONLINE, auth_token="tok_sim_trn804_secure", battery_level=93.0, assigned_fleet_code="TRN-804", assigned_shipment_id="SHP-2026-62044"),
        IoTDevice(device_id="IOT-VSL-ATLANTIS", name="Atlantis Vessel AIS & Reefer Bank Hub", device_type="VESSEL_AIS_REEFER", source_mode=DeviceSourceMode.SIMULATED, status=DeviceStatus.ONLINE, auth_token="tok_sim_vslatlantis_secure", battery_level=100.0, assigned_fleet_code="VSL-ATLANTIS", assigned_shipment_id="SHP-2026-55099"),
        # REAL HARDWARE REGISTERED DEVICE (ESP32 Ready)
        IoTDevice(device_id="ESP32-EDGE-HW01", name="Physical ESP32 Cold-Chain Edge Gateway", device_type="ESP32_SHT31_GPS", source_mode=DeviceSourceMode.HARDWARE, status=DeviceStatus.ONLINE, auth_token="hw_live_esp32_secret_token_8841", battery_level=87.5, firmware_version="v1.0.8-hw-release", ip_address="192.168.1.188")
    ]
    db.add_all(devices)
    db.flush()

    # 6. Shipments
    shp1 = Shipment(
        tracking_number="SHP-2026-90412",
        customer_id=cust1.id,
        fleet_id=fleet[0].id,
        origin="Delhi Freight Hub",
        origin_lat=28.6139,
        origin_lng=77.2090,
        destination="Mumbai Port Trust",
        destination_lat=18.9553,
        destination_lng=72.8447,
        transport_mode=TransportMode.MULTIMODAL,
        status=ShipmentStatus.IN_TRANSIT,
        progress_percent=42.0,
        cargo_type="Dairy Products",
        cargo_weight_kg=8500.0,
        is_perishable=True,
        ideal_temp_min=2.0,
        ideal_temp_max=5.0,
        ideal_humidity_min=75.0,
        ideal_humidity_max=85.0,
        shelf_life_hours_initial=168.0,
        remaining_shelf_life_hours=148.5,
        estimated_distance_km=1420.0,
        estimated_duration_hours=28.5,
        estimated_cost_usd=1380.0,
        carbon_emissions_kg=395.0,
        ai_recommendation_reason="OR-Tools selected Multimodal (Road first-mile to ICD Dadri + Western Dedicated Rail + JNPT Road final-mile). Saves 34% cost and reduces carbon by 58%.",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=14),
        estimated_arrival=datetime.datetime.utcnow() + datetime.timedelta(hours=14, minutes=30),
        iot_device_id="IOT-TRK-101"
    )

    shp2 = Shipment(
        tracking_number="SHP-2026-77103",
        customer_id=cust2.id,
        fleet_id=fleet[1].id,
        origin="Ahmedabad Ring Road",
        origin_lat=23.0225,
        origin_lng=72.5714,
        destination="Mumbai Port Trust",
        destination_lat=18.9553,
        destination_lng=72.8447,
        transport_mode=TransportMode.ROAD,
        status=ShipmentStatus.IN_TRANSIT,
        progress_percent=74.0,
        cargo_type="Vaccines & Pharmaceuticals",
        cargo_weight_kg=4200.0,
        is_perishable=True,
        ideal_temp_min=2.0,
        ideal_temp_max=8.0,
        ideal_humidity_min=60.0,
        ideal_humidity_max=75.0,
        shelf_life_hours_initial=720.0,
        remaining_shelf_life_hours=708.0,
        estimated_distance_km=530.0,
        estimated_duration_hours=9.5,
        estimated_cost_usd=920.0,
        carbon_emissions_kg=190.0,
        ai_recommendation_reason="Time-critical pharmaceutical shipment. Direct Express Road selected to minimize transshipment and guarantee delivery within 10 hours.",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=6),
        estimated_arrival=datetime.datetime.utcnow() + datetime.timedelta(hours=3, minutes=30),
        iot_device_id="IOT-TRK-102"
    )

    shp3 = Shipment(
        tracking_number="SHP-2026-62044",
        customer_id=cust3.id,
        fleet_id=fleet[3].id,
        origin="Delhi Freight Hub",
        origin_lat=28.6139,
        origin_lng=77.2090,
        destination="Mumbai Port Trust",
        destination_lat=18.9553,
        destination_lng=72.8447,
        transport_mode=TransportMode.RAIL,
        status=ShipmentStatus.IN_TRANSIT,
        progress_percent=48.0,
        cargo_type="Fresh Fruits & Vegetables",
        cargo_weight_kg=48000.0,
        is_perishable=True,
        ideal_temp_min=4.0,
        ideal_temp_max=8.0,
        ideal_humidity_min=80.0,
        ideal_humidity_max=90.0,
        shelf_life_hours_initial=240.0,
        remaining_shelf_life_hours=218.0,
        estimated_distance_km=1380.0,
        estimated_duration_hours=32.0,
        estimated_cost_usd=2150.0,
        carbon_emissions_kg=410.0,
        ai_recommendation_reason="Heavy bulk perishable cargo. Dedicated Freight Corridor rail rake minimizes vibration wear and gives lowest transport cost per kg.",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=16),
        estimated_arrival=datetime.datetime.utcnow() + datetime.timedelta(hours=16),
        iot_device_id="IOT-TRN-804"
    )

    shp4 = Shipment(
        tracking_number="SHP-2026-55099",
        customer_id=cust1.id,
        fleet_id=fleet[5].id,
        origin="Mumbai Port Trust",
        origin_lat=18.9553,
        origin_lng=72.8447,
        destination="Jebel Ali Freezone Perishables Hub",
        destination_lat=25.2048,
        destination_lng=55.2708,
        transport_mode=TransportMode.SEA,
        status=ShipmentStatus.IN_TRANSIT,
        progress_percent=61.0,
        cargo_type="Fresh Seafood",
        cargo_weight_kg=120000.0,
        is_perishable=True,
        ideal_temp_min=-1.0,
        ideal_temp_max=2.0,
        ideal_humidity_min=85.0,
        ideal_humidity_max=95.0,
        shelf_life_hours_initial=96.0,
        remaining_shelf_life_hours=72.5,
        estimated_distance_km=1920.0,
        estimated_duration_hours=72.0,
        estimated_cost_usd=4800.0,
        carbon_emissions_kg=850.0,
        ai_recommendation_reason="International maritime reefer corridor. Super-chilled cryogenic container monitoring ensures frozen state across Arabian Sea transit.",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=44),
        estimated_arrival=datetime.datetime.utcnow() + datetime.timedelta(hours=28),
        iot_device_id="IOT-VSL-ATLANTIS"
    )

    db.add_all([shp1, shp2, shp3, shp4])
    db.flush()

    # 7. Multimodal Handovers for SHP-2026-90412
    h1 = MultimodalHandover(
        shipment_id=shp1.id,
        step_number=1,
        from_mode=TransportMode.ROAD,
        to_mode=TransportMode.RAIL,
        hub_name="ICD Dadri Rail Intermodal Terminal",
        hub_type="RAIL_YARD",
        responsible_operator="Supervisor Ashok Patel",
        cargo_condition="SEAL_INTACT_OPTIMAL",
        handover_time=datetime.datetime.utcnow() - datetime.timedelta(hours=10),
        notes="Container transferred from Road Chassis to WDFC Flatcar #12. Reefer power cable plugged into rake auxiliary bus."
    )
    db.add(h1)

    # 8. Initial Alerts
    alt1 = Alert(
        alert_code="ALT-2026-1049",
        shipment_id=shp1.id,
        fleet_code="TRK-101",
        problem_type="HIGH_TEMPERATURE",
        title="Cold-Chain Temperature Warning (TRK-101)",
        message="Container reefer temp climbed to 4.8°C (near safe threshold of 5.0°C).",
        location_name="Udaipur Expressway Mile 142",
        lat=24.5854,
        lng=73.7125,
        severity=AlertSeverity.MEDIUM,
        status=AlertStatus.ACTIVE,
        recommended_action="Inspect secondary evaporator fan and verify diesel generator thermostat setpoint.",
        timestamp=datetime.datetime.utcnow() - datetime.timedelta(minutes=24)
    )
    alt2 = Alert(
        alert_code="ALT-2026-2180",
        shipment_id=shp4.id,
        fleet_code="VSL-ATLANTIS",
        problem_type="PORT_CONGESTION",
        title="Outer Anchorage Berth Queue Delay",
        message="Vessel scheduled arrival delayed by 2.5 hours due to port berth pilotage queue at Jebel Ali.",
        location_name="Jebel Ali Outer Anchorage Approach",
        lat=25.2048,
        lng=55.2708,
        severity=AlertSeverity.LOW,
        status=AlertStatus.ACKNOWLEDGED,
        acknowledged_by="Vikramaditya Singhania",
        recommended_action="Notify consignee receiving dock manager of adjusted unloading window.",
        timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
    )
    db.add_all([alt1, alt2])

    # 9. Maintenance Records
    maint1 = MaintenanceRecord(
        fleet_id=fleet[0].id,
        service_type="Brake Pad Replacement & Air Filter Service",
        health_score_at_service=68.0,
        rul_days_projected=180,
        fault_codes="B1042-BRAKE_WEAR_75PCT",
        scheduled_date=datetime.datetime.utcnow() + datetime.timedelta(days=12),
        technician_name="Senior Mechanic Suresh Patil",
        cost_usd=420.0,
        status="SCHEDULED",
        ai_recommendation="Predictive algorithm detected brake wear rate acceleration. Schedule maintenance at Mumbai Central Depot."
    )
    maint2 = MaintenanceRecord(
        fleet_id=fleet[3].id,
        service_type="Locomotive Pantograph & Traction Motor Overhaul",
        health_score_at_service=74.0,
        rul_days_projected=220,
        fault_codes="E0109-TRACTION_INVERTER_CYCLE",
        scheduled_date=datetime.datetime.utcnow() + datetime.timedelta(days=25),
        technician_name="Rail Systems Eng. Robert Chen",
        cost_usd=1650.0,
        status="SCHEDULED",
        ai_recommendation="Periodic 90-day multi-system diagnostic inspection required by railway safety board."
    )
    db.add_all([maint1, maint2])

    # 10. Simulation Initial State
    sim_state = SimulationState(
        is_running=True,
        speed_multiplier=1.0,
        tick_count=0,
        active_anomalies={}
    )
    db.add(sim_state)

    db.commit()
    print("[DATABASE_SEED] Database successfully seeded with multimodal demo data!")
