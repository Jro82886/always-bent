"""
Test the FastAPI ocean features API
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health check endpoint"""
    response = requests.get(f"{BASE_URL}/")
    print("Health Check:", response.json())
    assert response.status_code == 200

def test_polygons():
    """Test polygons endpoint"""
    bbox = "-75,35,-70,40"  # Off North Carolina
    response = requests.get(f"{BASE_URL}/polygons?bbox={bbox}")
    print("\nPolygons Response:")
    print(json.dumps(response.json(), indent=2))
    assert response.status_code == 200
    assert response.json()["type"] == "FeatureCollection"

def test_fronts():
    """Test thermal fronts detection"""
    bbox = "-75,35,-70,40"
    response = requests.get(f"{BASE_URL}/ocean-features/fronts?bbox={bbox}&threshold=0.5")
    print("\nFronts Response:")
    print(json.dumps(response.json(), indent=2))
    assert response.status_code == 200

def test_edges():
    """Test chlorophyll edges detection"""
    bbox = "-75,35,-70,40"
    response = requests.get(f"{BASE_URL}/ocean-features/edges?bbox={bbox}")
    print("\nEdges Response:")
    print(json.dumps(response.json(), indent=2))
    assert response.status_code == 200

def test_eddies():
    """Test eddy detection"""
    bbox = "-75,35,-70,40"
    response = requests.get(f"{BASE_URL}/ocean-features/eddies?bbox={bbox}")
    print("\nEddies Response:")
    print(json.dumps(response.json(), indent=2))
    assert response.status_code == 200

def test_live_features():
    """Test live features endpoint"""
    bbox = "-75,35,-70,40"
    response = requests.get(f"{BASE_URL}/ocean-features/live?bbox={bbox}")
    print("\nLive Features Response:")
    print(f"Total features: {len(response.json()['features'])}")
    assert response.status_code == 200

if __name__ == "__main__":
    print("Testing Ocean Features API...")
    try:
        test_health()
        test_polygons()
        test_fronts()
        test_edges()
        test_eddies()
        test_live_features()
        print("\n✅ All tests passed!")
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to API. Make sure the server is running on port 8000.")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
