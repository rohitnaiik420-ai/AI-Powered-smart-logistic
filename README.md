# AI-Powered Multimodal Smart Logistics Management Platform (Road, Rail, Sea)

An enterprise-grade, centralized logistics control tower engineered to coordinate end-to-end freight transportation across **Road**, **Rail**, and **Sea** networks.

The platform provides complete shipment lifecycle management, live multimodal fleet tracking, AI route optimization using Google OR-Tools constraint solving, IoT cargo cold-chain monitoring with biological Arrhenius shelf-life kinetic modeling, predictive maintenance telemetry, smart incident triage, and warehouse bay management.

---

## Key Highlights

- **Multimodal Transportation Stack**: Unified tracking and routing across express highway road fleets, dedicated freight rail rakes (WDFC), and international maritime container liners (AIS).
- **Zero-Refactor Bi-Modal Hardware Architecture**:
  - **Mode A (Active Simulation)**: High-fidelity async background simulation generating live GPS trajectories, speed variances, reefer temperature variations, and on-demand chaos events.
  - **Mode B (Hardware Ready)**: Standardized ingestion contract ready for direct connection with ESP32 microcontrollers, GPS trackers, SHT31/DHT22 temperature/humidity sensors, magnetic door reed switches, and 3-axis vibration accelerometers over MQTT or REST (`X-Device-Token`).
- **AI Route Optimization Engine**: Formulates and solves Mixed-Integer Linear Programming (MILP) Pareto trade-offs via **Google OR-Tools** balancing transit time, financial cost ($/ton-km), carbon emissions (kg CO2), and perishable shelf-life risk.
- **Perishable Cold-Chain Science**: Employs the thermodynamic **Arrhenius Quality Degradation Model** ($k = k_{ref} \cdot \exp(-E_a/R \cdot (1/T - 1/T_{ref}))$) to calculate dynamic shelf-life loss during temperature excursions.
- **Predictive Maintenance**: SAE diagnostics telemetry evaluation (coolant temp, oil pressure, brake lining wear, vibration spectral index) computing Composite Health Scores (0-100%) and Remaining Useful Life (RUL in days).
- **14-Step Complete Shipment Lifecycle**: Full chain-of-custody tracking from customer request to AI dispatch, multimodal intermodal handovers, active tracking, consignee delivery confirmation, and audit report generation.
- **Simulation Control Cockpit & Chaos Tools**: Real-time simulation rate control (1x to 20x turbo), clock pause/resume, and chaos injection triggers (Reefer Failure, Truck Breakdown, Door Tamper, Rail Siding Delay, Port Congestion).
- **7 Enterprise RBAC Roles**: Super Admin, Logistics Owner, Fleet Manager, Driver/Operator, Warehouse Manager, IoT Lead, Customer.

---

## 12 Control Tower Modules

1. **Overview Dashboard**: Executive control tower KPIs, multimodal modal distribution, live global GIS map, sensor health matrix, and incident stream.
2. **Shipment Management**: End-to-end 14-step shipment workflow, custody handover logging, delivery confirmation, and printable PDF audit report.
3. **Fleet & Logistics Tracking**: Sub-modules for Road (GPS telematics, driver info, unexpected stop detection), Rail (WDFC rake telematics, station siding queues), and Sea (vessel AIS, port dwell delays).
4. **AI Route Optimization**: Google OR-Tools multi-criteria solver comparing Road, Rail, Sea, and Smart Multimodal routes with side-by-side cost and duration bar charts.
5. **IoT Cargo Monitoring**: Cold-chain assurance, temperature/humidity gauges, door breach alarms, vibration metrics, and Arrhenius decay curves.
6. **Predictive Maintenance**: Fleet health scoring, Remaining Useful Life countdowns, diagnostic trouble codes, and proactive service order creation.
7. **Alerts & Notifications**: Real-time incident triage table with severity badges and one-click Acknowledge/Resolve workflows.
8. **Warehouse Management**: Intermodal hubs, cold storage capacity vs occupancy, loading bay status monitors, inventory SKU records, and gate in/out logs.
9. **Analytics & Reports**: Freight spend per ton-km, carbon abatement metrics, monthly SLA punctuality benchmarks, and CSV export.
10. **Device Management**: Registry for physical ESP32 and virtual simulation devices, token regeneration (`X-Device-Token`), and hardware ingestion contracts.
11. **Simulation Control Center**: Interactive simulation master cockpit with speed multipliers (1x-20x) and chaos anomaly injection.
12. **Settings & RBAC**: Enterprise role-based access matrix and MQTT broker protocol configurations.

---

## Technology Stack

- **Backend**: Python 3.13, FastAPI (ASGI), Async WebSockets, Pydantic v2, SQLAlchemy, SQLite (PostGIS / PostgreSQL compatible schema).
- **AI & Optimization**: Google OR-Tools (`ortools` MILP solver), Arrhenius Kinetic Thermodynamic Spoilage Engine.
- **Frontend**: React 18, Vite, Tailwind CSS, Leaflet GIS mapping, Recharts, Lucide Icons.
- **Protocols Supported**: REST APIs, Async WebSockets (`/ws/live`), MQTT bridge format (`v1/devices/{device_id}/telemetry`).

---

## Quick Start Guide

### Option 1: Unified Server (FastAPI + Built React Frontend)
Run the entire platform from a single unified Python server:
```powershell
python run_server.py
```
Open your browser and navigate to:
- **Application Control Tower**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive OpenAPI Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Live WebSocket Telemetry**: `ws://127.0.0.1:8000/ws/live`

### Option 2: Full-Stack Development Mode
If you wish to make live modifications to frontend code:

**Terminal 1 (Backend)**:
```powershell
python run_server.py
```

**Terminal 2 (Frontend with Vite Hot-Reload)**:
```powershell
cd frontend
npm run dev
```
Navigate to [http://localhost:5173](http://localhost:5173) with automatic proxying to the backend.

---

## Hardware Connection Contract (ESP32 Ready)

To connect a physical ESP32 or IoT edge gateway, send HTTP POST or publish via MQTT using the standardized payload:

### Endpoint:
```http
POST /api/v1/telemetry/ingest
X-Device-Token: hw_live_esp32_secret_token_8841
Content-Type: application/json
```

### JSON Telemetry Payload:
```json
{
  "device_id": "ESP32-EDGE-HW01",
  "device_type": "ESP32_SHT31_GPS",
  "source_mode": "HARDWARE",
  "timestamp": "2026-11-13T09:00:00Z",
  "firmware_version": "v1.0.8-hw-release",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "speed_kmh": 68.4,
    "heading": 142.0,
    "altitude_m": 216.0
  },
  "cargo_sensors": {
    "temperature_celsius": 3.8,
    "humidity_percent": 84.5,
    "vibration_g": 0.12,
    "door_open": false,
    "shock_detected": false
  },
  "vehicle_diagnostics": {
    "engine_temp_celsius": 89.2,
    "oil_pressure_psi": 46.5,
    "battery_voltage": 24.2,
    "fuel_level_percent": 78.0,
    "brake_wear_percent": 18.0
  }
}
```

The unified ingestion service will validate the device token, update fleet and shipment location on the live map, evaluate cold-chain thermal thresholds, compute biological shelf-life degradation, and broadcast the update to connected control tower dashboards in real time.
