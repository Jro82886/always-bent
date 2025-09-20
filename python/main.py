"""
FastAPI backend for ocean feature detection and polygon generation
Provides real-time analysis of SST and chlorophyll data
"""

from fastapi import FastAPI, Query, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from typing import Optional, List, Dict
import numpy as np
import xarray as xr
from datetime import datetime, timedelta
import requests
import os
import json
from pathlib import Path
from app.ocean_features import OceanFeatureDetector
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Always Bent Ocean Features API",
    description="Real-time ocean feature detection for fishing intelligence",
    version="1.0.0"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://always-bent.vercel.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detector
detector = OceanFeatureDetector()

# Copernicus credentials from environment
COPERNICUS_USER = os.getenv("COPERNICUS_USER", "")
COPERNICUS_PASS = os.getenv("COPERNICUS_PASS", "")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ocean-features-api",
        "version": "1.0.0",
        "endpoints": [
            "/polygons",
            "/ocean-features/fronts",
            "/ocean-features/edges", 
            "/ocean-features/eddies",
            "/ocean-features/live"
        ]
    }

@app.get("/polygons")
async def get_polygons(
    bbox: Optional[str] = Query(None, description="Bounding box: minLon,minLat,maxLon,maxLat"),
    time: Optional[str] = Query(None, description="Time in ISO format"),
    days_back: Optional[int] = Query(1, description="Days to look back"),
    feature_type: Optional[str] = Query("all", description="Type of features: fronts, edges, eddies, all"),
    use_cached: bool = Query(True, description="Use pre-generated cached data")
):
    """
    Get ocean feature polygons for a given bounding box and time
    Serves pre-generated daily polygons by default, or generates on-demand
    """
    try:
        # Parse bounding box
        if not bbox:
            raise HTTPException(status_code=400, detail="Bounding box required")
        
        try:
            coords = [float(x) for x in bbox.split(",")]
            if len(coords) != 4:
                raise ValueError("Invalid bbox format")
            min_lon, min_lat, max_lon, max_lat = coords
        except:
            raise HTTPException(status_code=400, detail="Invalid bbox format. Use: minLon,minLat,maxLon,maxLat")
        
        # If using cached data (default for performance)
        if use_cached:
            # Try to load pre-generated polygons
            polygon_dir = Path("data/polygons")
            latest_file = polygon_dir / "ocean_features_latest.geojson"
            
            # Check if file exists and is recent (less than 24 hours old)
            if latest_file.exists():
                file_age = datetime.utcnow() - datetime.fromtimestamp(latest_file.stat().st_mtime)
                if file_age.total_seconds() < 86400:  # 24 hours
                    try:
                        with open(latest_file, 'r') as f:
                            data = json.load(f)
                        
                        # Filter features by bounding box
                        filtered_features = []
                        for feature in data.get("features", []):
                            # Check if feature intersects with bbox
                            if feature_intersects_bbox(feature, [min_lon, min_lat, max_lon, max_lat]):
                                # Filter by feature type if specified
                                if feature_type == "all" or feature.get("properties", {}).get("feature_type", "").startswith(feature_type.rstrip('s')):
                                    filtered_features.append(feature)
                        
                        return {
                            "type": "FeatureCollection",
                            "features": filtered_features,
                            "properties": {
                                "source": "cached",
                                "generated_at": data.get("properties", {}).get("generated_at"),
                                "bbox": [min_lon, min_lat, max_lon, max_lat],
                                "feature_count": len(filtered_features),
                                "cache_age_hours": file_age.total_seconds() / 3600
                            }
                        }
                    except Exception as e:
                        logger.warning(f"Failed to load cached data: {str(e)}")
        
        # Generate on-demand if no cache or requested
        logger.info("Generating features on-demand")
        
        # Parse time
        if time:
            target_time = datetime.fromisoformat(time.replace('Z', '+00:00'))
        else:
            target_time = datetime.utcnow()
        
        # For demo/testing, return sample data
        # In production with real Copernicus integration, this would fetch and process real data
        features = []
        
        # Add sample thermal front
        if feature_type in ["all", "fronts"]:
            features.append({
                "type": "Feature",
                "properties": {
                    "feature_type": "thermal_front",
                    "strength": 1.2,
                    "confidence": 0.85,
                    "timestamp": target_time.isoformat(),
                    "id": "front_sample_1"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [min_lon + 0.1, min_lat + 0.1],
                        [min_lon + 0.2, min_lat + 0.15],
                        [min_lon + 0.3, min_lat + 0.2]
                    ]
                }
            })
        
        # Add sample chlorophyll edge
        if feature_type in ["all", "edges"]:
            features.append({
                "type": "Feature",
                "properties": {
                    "feature_type": "chlorophyll_edge",
                    "mean_chlorophyll": 2.5,
                    "max_chlorophyll": 5.2,
                    "timestamp": target_time.isoformat(),
                    "id": "edge_sample_1"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [min_lon + 0.05, min_lat + 0.05],
                        [min_lon + 0.15, min_lat + 0.05],
                        [min_lon + 0.15, min_lat + 0.15],
                        [min_lon + 0.05, min_lat + 0.15],
                        [min_lon + 0.05, min_lat + 0.05]
                    ]]
                }
            })
        
        # Add sample eddy
        if feature_type in ["all", "eddies"]:
            center_lon = (min_lon + max_lon) / 2
            center_lat = (min_lat + max_lat) / 2
            features.append({
                "type": "Feature",
                "properties": {
                    "feature_type": "eddy",
                    "eddy_type": "warm_core",
                    "radius_km": 25.0,
                    "rotation": "clockwise",
                    "timestamp": target_time.isoformat(),
                    "id": "eddy_sample_1"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [center_lon, center_lat]
                }
            })
        
        return {
            "type": "FeatureCollection",
            "features": features,
            "properties": {
                "source": "on-demand",
                "generated_at": datetime.utcnow().isoformat(),
                "bbox": [min_lon, min_lat, max_lon, max_lat],
                "feature_count": len(features)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating polygons: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def feature_intersects_bbox(feature: Dict, bbox: List[float]) -> bool:
    """
    Check if a feature intersects with a bounding box
    """
    min_lon, min_lat, max_lon, max_lat = bbox
    
    geometry = feature.get("geometry", {})
    if not geometry:
        return False
    
    geom_type = geometry.get("type")
    coords = geometry.get("coordinates", [])
    
    if geom_type == "Point":
        lon, lat = coords
        return min_lon <= lon <= max_lon and min_lat <= lat <= max_lat
    
    elif geom_type == "LineString":
        for lon, lat in coords:
            if min_lon <= lon <= max_lon and min_lat <= lat <= max_lat:
                return True
    
    elif geom_type == "Polygon":
        for ring in coords:
            for lon, lat in ring:
                if min_lon <= lon <= max_lon and min_lat <= lat <= max_lat:
                    return True
    
    return False

@app.get("/ocean-features/fronts")
async def detect_fronts(
    bbox: str = Query(..., description="Bounding box: minLon,minLat,maxLon,maxLat"),
    threshold: float = Query(0.5, description="Temperature gradient threshold (°C/km)"),
    time: Optional[str] = Query(None, description="Time in ISO format")
):
    """
    Detect thermal fronts from SST data
    """
    try:
        # Parse bbox
        coords = [float(x) for x in bbox.split(",")]
        min_lon, min_lat, max_lon, max_lat = coords
        
        # In production: fetch SST data from Copernicus
        # For now, generate sample data
        lon_array = np.linspace(min_lon, max_lon, 50)
        lat_array = np.linspace(min_lat, max_lat, 50)
        
        # Create sample SST field with a front
        lon_grid, lat_grid = np.meshgrid(lon_array, lat_array)
        sst_array = 20 + 5 * np.tanh((lon_grid - (min_lon + max_lon)/2) * 10)
        sst_array += np.random.normal(0, 0.1, sst_array.shape)
        
        # Detect fronts
        features = detector.detect_thermal_fronts(
            sst_array, lon_array, lat_array, threshold
        )
        
        return {
            "type": "FeatureCollection",
            "features": features,
            "properties": {
                "detection_method": "sobel_gradient",
                "threshold": threshold,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error detecting fronts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ocean-features/edges")
async def detect_edges(
    bbox: str = Query(..., description="Bounding box: minLon,minLat,maxLon,maxLat"),
    low_threshold: float = Query(0.1, description="Canny low threshold"),
    high_threshold: float = Query(0.3, description="Canny high threshold"),
    time: Optional[str] = Query(None, description="Time in ISO format")
):
    """
    Detect chlorophyll edges indicating productivity zones
    """
    try:
        # Parse bbox
        coords = [float(x) for x in bbox.split(",")]
        min_lon, min_lat, max_lon, max_lat = coords
        
        # In production: fetch chlorophyll data from Copernicus
        # For now, generate sample data
        lon_array = np.linspace(min_lon, max_lon, 50)
        lat_array = np.linspace(min_lat, max_lat, 50)
        
        # Create sample chlorophyll field with blooms
        lon_grid, lat_grid = np.meshgrid(lon_array, lat_array)
        chl_array = np.exp(-((lon_grid - (min_lon + max_lon)/2)**2 + 
                           (lat_grid - (min_lat + max_lat)/2)**2) / 0.1)
        chl_array *= 10  # Scale to realistic values
        chl_array += np.random.lognormal(0, 0.5, chl_array.shape)
        
        # Detect edges
        features = detector.detect_chlorophyll_edges(
            chl_array, lon_array, lat_array, low_threshold, high_threshold
        )
        
        return {
            "type": "FeatureCollection",
            "features": features,
            "properties": {
                "detection_method": "canny_edge",
                "low_threshold": low_threshold,
                "high_threshold": high_threshold,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error detecting edges: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ocean-features/eddies")
async def detect_eddies(
    bbox: str = Query(..., description="Bounding box: minLon,minLat,maxLon,maxLat"),
    min_radius_km: float = Query(10.0, description="Minimum eddy radius in kilometers"),
    time: Optional[str] = Query(None, description="Time in ISO format")
):
    """
    Detect mesoscale eddies using Okubo-Weiss parameter
    """
    try:
        # Parse bbox
        coords = [float(x) for x in bbox.split(",")]
        min_lon, min_lat, max_lon, max_lat = coords
        
        # In production: fetch SST/altimetry data from Copernicus
        # For now, generate sample data with eddy-like features
        lon_array = np.linspace(min_lon, max_lon, 100)
        lat_array = np.linspace(min_lat, max_lat, 100)
        
        # Create sample SST field with eddy
        lon_grid, lat_grid = np.meshgrid(lon_array, lat_array)
        r = np.sqrt((lon_grid - (min_lon + max_lon)/2)**2 + 
                    (lat_grid - (min_lat + max_lat)/2)**2)
        sst_array = 20 + 2 * np.exp(-r**2 / 0.05)
        
        # Add some rotation
        theta = np.arctan2(lat_grid - (min_lat + max_lat)/2, 
                          lon_grid - (min_lon + max_lon)/2)
        sst_array += 0.5 * np.sin(theta + r * 10)
        
        # Detect eddies
        features = detector.detect_eddies(
            sst_array, lon_array, lat_array, min_radius_km
        )
        
        return {
            "type": "FeatureCollection",
            "features": features,
            "properties": {
                "detection_method": "okubo_weiss",
                "min_radius_km": min_radius_km,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error detecting eddies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ocean-features/live")
async def get_live_features(
    bbox: str = Query(..., description="Bounding box: minLon,minLat,maxLon,maxLat"),
    features: str = Query("all", description="Comma-separated list: fronts,edges,eddies")
):
    """
    Get all ocean features for live display
    Combines fronts, edges, and eddies in one response
    """
    try:
        feature_types = features.split(",") if features != "all" else ["fronts", "edges", "eddies"]
        all_features = []
        
        # Detect each feature type
        if "fronts" in feature_types:
            fronts_response = await detect_fronts(bbox=bbox)
            all_features.extend(fronts_response["features"])
        
        if "edges" in feature_types:
            edges_response = await detect_edges(bbox=bbox)
            all_features.extend(edges_response["features"])
        
        if "eddies" in feature_types:
            eddies_response = await detect_eddies(bbox=bbox)
            all_features.extend(eddies_response["features"])
        
        return {
            "type": "FeatureCollection",
            "features": all_features,
            "properties": {
                "feature_types": feature_types,
                "total_features": len(all_features),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting live features: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/generate-polygons")
async def trigger_polygon_generation(
    background_tasks: BackgroundTasks,
    api_key: str = Query(..., description="Admin API key"),
    regions: Optional[str] = Query(None, description="Comma-separated region names")
):
    """
    Manually trigger polygon generation (admin only)
    """
    # Simple API key check
    if api_key != os.getenv("ADMIN_API_KEY", "abfi-admin-2024"):
        raise HTTPException(status_code=403, detail="Invalid API key")
    
    # Import scheduler
    from scheduler import OceanFeatureScheduler
    
    async def generate_task():
        try:
            scheduler = OceanFeatureScheduler()
            if regions:
                # Filter regions if specified
                region_list = regions.split(",")
                scheduler.regions = [r for r in scheduler.regions if r["name"] in region_list]
            
            await scheduler.generate_daily_polygons()
            logger.info("Manual polygon generation completed")
        except Exception as e:
            logger.error(f"Manual generation failed: {str(e)}")
    
    # Add to background tasks
    background_tasks.add_task(generate_task)
    
    return {
        "status": "started",
        "message": "Polygon generation started in background",
        "regions": regions or "all"
    }

@app.get("/admin/polygon-status")
async def get_polygon_status(
    api_key: str = Query(..., description="Admin API key")
):
    """
    Get status of polygon generation (admin only)
    """
    if api_key != os.getenv("ADMIN_API_KEY", "abfi-admin-2024"):
        raise HTTPException(status_code=403, detail="Invalid API key")
    
    polygon_dir = Path("data/polygons")
    latest_file = polygon_dir / "ocean_features_latest.geojson"
    
    status = {
        "latest_file_exists": latest_file.exists(),
        "polygon_directory": str(polygon_dir),
        "files": []
    }
    
    if latest_file.exists():
        file_stat = latest_file.stat()
        file_age = datetime.utcnow() - datetime.fromtimestamp(file_stat.st_mtime)
        
        try:
            with open(latest_file, 'r') as f:
                data = json.load(f)
            
            status.update({
                "latest_file_modified": datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                "file_age_hours": file_age.total_seconds() / 3600,
                "file_size_mb": file_stat.st_size / (1024 * 1024),
                "total_features": len(data.get("features", [])),
                "data_properties": data.get("properties", {})
            })
        except Exception as e:
            status["error"] = f"Failed to read file: {str(e)}"
    
    # List all polygon files
    if polygon_dir.exists():
        for file in sorted(polygon_dir.glob("ocean_features_*.geojson"), reverse=True)[:10]:
            status["files"].append({
                "name": file.name,
                "size_mb": file.stat().st_size / (1024 * 1024),
                "modified": datetime.fromtimestamp(file.stat().st_mtime).isoformat()
            })
    
    return status

@app.get("/polygons/download")
async def download_polygons(
    date: Optional[str] = Query(None, description="Date in YYYYMMDD format"),
    api_key: Optional[str] = Query(None, description="Optional API key for full access")
):
    """
    Download polygon GeoJSON files
    """
    polygon_dir = Path("data/polygons")
    
    if date:
        # Download specific date
        file_path = polygon_dir / f"ocean_features_{date}.geojson"
    else:
        # Download latest
        file_path = polygon_dir / "ocean_features_latest.geojson"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Polygon file not found")
    
    # Check file size - limit to 50MB without API key
    file_size = file_path.stat().st_size
    if file_size > 50 * 1024 * 1024 and api_key != os.getenv("ADMIN_API_KEY", "abfi-admin-2024"):
        raise HTTPException(status_code=403, detail="File too large. API key required for files over 50MB")
    
    return FileResponse(
        path=file_path,
        media_type="application/geo+json",
        filename=file_path.name,
        headers={
            "Cache-Control": "public, max-age=3600",
            "X-File-Generated": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
