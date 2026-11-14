import uvicorn
import os
import sys

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    print("=" * 70)
    print("AI-POWERED MULTIMODAL SMART LOGISTICS MANAGEMENT SYSTEM")
    print("Enterprise Control Tower (Road, Rail, Sea)")
    print("=" * 70)
    print(f"Starting FastAPI ASGI Server on http://{host}:{port} ...")
    print(f"API Documentation: http://{host}:{port}/docs")
    print(f"Live WebSocket: ws://{host}:{port}/ws/live")
    print("=" * 70)
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)
