import uvicorn
import os
import sys

if __name__ == "__main__":
    print("=" * 70)
    print("AI-POWERED MULTIMODAL SMART LOGISTICS MANAGEMENT SYSTEM")
    print("Enterprise Control Tower (Road, Rail, Sea)")
    print("=" * 70)
    print("Starting FastAPI ASGI Server on http://127.0.0.1:8000 ...")
    print("API Documentation: http://127.0.0.1:8000/docs")
    print("Live WebSocket: ws://127.0.0.1:8000/ws/live")
    print("=" * 70)
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=False)
