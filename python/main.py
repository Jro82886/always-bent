"""
FastAPI backend for ocean feature detection and polygon generation
Provides real-time analysis of SST and chlorophyll data
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict
import numpy as np
import xarray as xr
from datetime import datetime, timedelta
import requests
import os
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
    feature_type: Optional[str] = Query("all", description="Type of features: fronts, edges, eddies, all")
):
    """
    Get ocean feature polygons for a given bounding box and time
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
        
        # Parse time
        if time:
            target_time = datetime.fromisoformat(time.replace('Z', '+00:00'))
        else:
            target_time = datetime.utcnow()
        
        # For now, return sample data
        # In production, this would fetch real-time data from Copernicus
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
