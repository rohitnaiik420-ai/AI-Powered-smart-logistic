import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import engine, Base, SessionLocal
from .seed_data import seed_database
from .services.telemetry_service import set_websocket_broadcaster
from .services.simulation_service import simulation_manager
from .routers.ws import manager as ws_manager

# Import all routers
from .routers import (
    overview,
    shipments,
    fleet,
    optimizer,
    iot,
    maintenance,
    alerts,
    warehouses,
    devices,
    telemetry_ingest,
    simulation,
    analytics,
    ws
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize DB tables
    Base.metadata.create_all(bind=engine)

    # 2. Seed initial multimodal demo data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # 3. Connect real-time WebSocket broadcaster
    set_websocket_broadcaster(ws_manager.broadcast)

    # 4. Start async simulation worker
    simulation_manager.start()
    print("[SYSTEM_BOOT] Multimodal Smart Logistics Control Tower Backend Online!")
    yield
    # Shutdown
    simulation_manager.pause()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise AI-Powered Multimodal Logistics Management Platform (Road, Rail, Sea)",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Endpoint directly registered on app for high-priority routing
@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        await websocket.send_text(json.dumps({
            "type": "HANDSHAKE",
            "status": "CONNECTED",
            "protocol": "MULTIMODAL_TELEMETRY_V1"
        }))
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

# Register API routers under /api/v1
app.include_router(overview.router, prefix=settings.API_V1_STR)
app.include_router(shipments.router, prefix=settings.API_V1_STR)
app.include_router(fleet.router, prefix=settings.API_V1_STR)
app.include_router(optimizer.router, prefix=settings.API_V1_STR)
app.include_router(iot.router, prefix=settings.API_V1_STR)
app.include_router(maintenance.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(warehouses.router, prefix=settings.API_V1_STR)
app.include_router(devices.router, prefix=settings.API_V1_STR)
app.include_router(telemetry_ingest.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(ws.router)

# Mount frontend single page application if built
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "system": settings.PROJECT_NAME,
            "status": "OPERATIONAL",
            "version": "1.0.0",
            "documentation": "/docs",
            "modes_supported": ["ROAD", "RAIL", "SEA", "MULTIMODAL"],
            "future_hardware_ready": True
        }
