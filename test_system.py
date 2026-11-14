import urllib.request
import urllib.parse
import json
import sys
import re

def run_tests():
    base_url = "http://127.0.0.1:8000"
    endpoints = [
        ("GET", "/api/v1/overview/metrics", None),
        ("GET", "/api/v1/shipments/", None),
        ("GET", "/api/v1/fleet/road", None),
        ("GET", "/api/v1/fleet/rail", None),
        ("GET", "/api/v1/fleet/sea", None),
        ("GET", "/api/v1/iot/devices-telemetry", None),
        ("GET", "/api/v1/maintenance/fleet-health", None),
        ("GET", "/api/v1/alerts/", None),
        ("GET", "/api/v1/warehouses/", None),
        ("GET", "/api/v1/devices/", None),
        ("GET", "/api/v1/simulation/state", None),
        ("GET", "/api/v1/analytics/summary", None),
        (
            "POST",
            "/api/v1/optimizer/route",
            {
                "origin": "Delhi",
                "destination": "Mumbai",
                "cargo_type": "Dairy Products",
                "cargo_weight_kg": 8500,
                "deadline_hours": 48,
                "is_perishable": True,
                "priority": "BALANCED"
            }
        ),
        (
            "POST",
            "/api/v1/simulation/control",
            {
                "action": "START",
                "speed_multiplier": 1.0
            }
        )
    ]

    print("==================================================")
    print("AI MULTIMODAL LOGISTICS - COMPREHENSIVE HEALTH CHECK")
    print("==================================================")
    
    passed = 0
    failed = 0

    # 1. Test Backend Endpoints
    print("\n--- 1. Testing Backend APIs ---")
    for method, path, body in endpoints:
        url = f"{base_url}{path}"
        try:
            if method == "GET":
                req = urllib.request.Request(url)
            else:
                data = json.dumps(body).encode('utf-8')
                req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
            
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.getcode()
                raw = response.read().decode('utf-8')
                parsed = json.loads(raw)
                count = len(parsed) if isinstance(parsed, list) else len(parsed.keys())
                print(f"[PASS] {method:4} {path:35} -> HTTP {status} (Payload: {count} elements)")
                passed += 1
        except Exception as e:
            print(f"[FAIL] {method:4} {path:35} -> ERROR: {e}")
            failed += 1

    # 2. Test Frontend Static Asset Serving
    print("\n--- 2. Testing Frontend Static Assets & SPA Routing ---")
    try:
        with urllib.request.urlopen(f"{base_url}/", timeout=5) as response:
            html = response.read().decode('utf-8')
            assert '<div id="root"></div>' in html, "root div missing from index.html"
            assert "/assets/" in html, "bundled JS/CSS assets missing from index.html"
            print(f"[PASS] Frontend index.html served successfully ({len(html)} bytes, HTTP 200)")
            passed += 1

            # Extract asset URLs from HTML to verify they serve 200
            asset_matches = re.findall(r'href="(/assets/[^"]+)"|src="(/assets/[^"]+)"', html)
            for m in asset_matches:
                asset_path = m[0] or m[1]
                with urllib.request.urlopen(f"{base_url}{asset_path}", timeout=5) as a_res:
                    a_bytes = len(a_res.read())
                    print(f"       [OK] Asset {asset_path} -> HTTP {a_res.getcode()} ({a_bytes:,} bytes)")
                    passed += 1
    except Exception as e:
        print(f"[FAIL] Frontend serving failed: {e}")
        failed += 1

    print("\n==================================================")
    print(f"RESULTS: {passed} PASSED, {failed} FAILED")
    print("==================================================")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
