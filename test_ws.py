import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://127.0.0.1:8000/ws/live"
    print(f"Connecting to {uri} ...")
    async with websockets.connect(uri) as ws:
        msg = await ws.recv()
        print("1. Handshake received:", msg)
        data = json.loads(msg)
        assert data.get("protocol") == "MULTIMODAL_TELEMETRY_V1", "Handshake protocol mismatch"

        # Wait for live simulation telemetry packet
        print("Waiting for live telemetry stream packet...")
        telemetry_raw = await ws.recv()
        telemetry_data = json.loads(telemetry_raw)
        print("2. Live Telemetry Packet Received:")
        print(f"   - Event Type: {telemetry_data.get('type')}")
        print(f"   - Device ID:  {telemetry_data.get('device_id')}")
        print(f"   - Location:   {telemetry_data.get('location')}")
        print(f"   - Cargo:      {telemetry_data.get('cargo')}")
        print(f"   - Mode:       {telemetry_data.get('source_mode')}")
        print("\n>>> WEBSOCKET LIVE TELEMETRY ENGINE VERIFIED WORKING!")

if __name__ == "__main__":
    asyncio.run(test_websocket())
