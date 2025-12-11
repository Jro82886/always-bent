"""
FastAPI server for ocean feature detection
Exposes SST fronts, chlorophyll edges, and eddy detection endpoints
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import numpy as np
import logging

from app.ocean_features import OceanFeatureDetector

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Always Bent Ocean Feature Detection API",
    description="Detect thermal fronts, chlorophyll edges, and mesoscale eddies from satellite data",
    version="1.0.0"
)

# Configure CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
        "https://alwaysbentfishingintelligence.com",
        "https://*.alwaysbentfishingintelligence.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detector
detector = OceanFeatureDetector()

# Pydantic models for request/response
class OceanDataRequest(BaseModel):
    """Request model for ocean data arrays"""
    data: List[List[float]] = Field(..., description="2D array of ocean data (SST or chlorophyll)")
    lon: List[float] = Field(..., description="1D array of longitude coordinates")
    lat: List[float] = Field(..., description="1D array of latitude coordinates")

    class Config:
        json_schema_extra = {
            "example": {
                "data": [[15.2, 15.3, 15.5], [15.4, 15.6, 15.8], [15.7, 15.9, 16.1]],
                "lon": [-74.0, -73.9, -73.8],
                "lat": [40.0, 40.1, 40.2]
            }
        }

class ThermalFrontsRequest(OceanDataRequest):
    """Request model for thermal front detection"""
    threshold: Optional[float] = Field(0.5, description="Temperature gradient threshold (°C/km)")

class ChlorophyllEdgesRequest(OceanDataRequest):
    """Request model for chlorophyll edge detection"""
    low_thresh: Optional[float] = Field(0.1, description="Lower threshold for Canny detection")
    high_thresh: Optional[float] = Field(0.3, description="Upper threshold for Canny detection")

class EddyDetectionRequest(OceanDataRequest):
    """Request model for eddy detection"""
    min_radius_km: Optional[float] = Field(10.0, description="Minimum eddy radius in kilometers")

class GeoJSONFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection response"""
    type: str = "FeatureCollection"
    features: List[Dict]
    metadata: Optional[Dict] = None

# API Routes
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Always Bent Ocean Feature Detection API",
        "version": "1.0.0",
        "endpoints": {
            "thermal_fronts": "/api/features/thermal-fronts",
            "chlorophyll_edges": "/api/features/chlorophyll-edges",
            "eddies": "/api/features/eddies"
        }
    }

@app.get("/health")
async def health_check():
    """Health check for container orchestration"""
    return {"status": "healthy"}

@app.post("/api/features/thermal-fronts", response_model=GeoJSONFeatureCollection)
async def detect_thermal_fronts(request: ThermalFrontsRequest):
    """
    Detect SST thermal fronts using Sobel edge detection

    Args:
        request: ThermalFrontsRequest containing SST data and coordinates

    Returns:
        GeoJSON FeatureCollection of thermal front LineStrings
    """
    try:
        # Convert lists to numpy arrays
        sst_array = np.array(request.data, dtype=np.float32)
        lon_array = np.array(request.lon, dtype=np.float32)
        lat_array = np.array(request.lat, dtype=np.float32)

        # Validate dimensions
        if sst_array.shape[0] != len(lat_array) or sst_array.shape[1] != len(lon_array):
            raise HTTPException(
                status_code=400,
                detail=f"Data dimensions mismatch: data shape {sst_array.shape}, lat length {len(lat_array)}, lon length {len(lon_array)}"
            )

        logger.info(f"Detecting thermal fronts with threshold={request.threshold}")

        # Detect fronts
        features = detector.detect_thermal_fronts(
            sst_array=sst_array,
            lon_array=lon_array,
            lat_array=lat_array,
            threshold=request.threshold
        )

        logger.info(f"Detected {len(features)} thermal fronts")

        return GeoJSONFeatureCollection(
            features=features,
            metadata={
                "feature_count": len(features),
                "threshold": request.threshold,
                "data_shape": list(sst_array.shape)
            }
        )

    except ValueError as e:
        logger.error(f"Value error in thermal front detection: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error detecting thermal fronts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.post("/api/features/chlorophyll-edges", response_model=GeoJSONFeatureCollection)
async def detect_chlorophyll_edges(request: ChlorophyllEdgesRequest):
    """
    Detect chlorophyll edges using Canny edge detection

    Args:
        request: ChlorophyllEdgesRequest containing chlorophyll data and coordinates

    Returns:
        GeoJSON FeatureCollection of chlorophyll edge Polygons
    """
    try:
        # Convert lists to numpy arrays
        chl_array = np.array(request.data, dtype=np.float32)
        lon_array = np.array(request.lon, dtype=np.float32)
        lat_array = np.array(request.lat, dtype=np.float32)

        # Validate dimensions
        if chl_array.shape[0] != len(lat_array) or chl_array.shape[1] != len(lon_array):
            raise HTTPException(
                status_code=400,
                detail=f"Data dimensions mismatch: data shape {chl_array.shape}, lat length {len(lat_array)}, lon length {len(lon_array)}"
            )

        logger.info(f"Detecting chlorophyll edges with low_thresh={request.low_thresh}, high_thresh={request.high_thresh}")

        # Detect edges
        features = detector.detect_chlorophyll_edges(
            chl_array=chl_array,
            lon_array=lon_array,
            lat_array=lat_array,
            low_thresh=request.low_thresh,
            high_thresh=request.high_thresh
        )

        logger.info(f"Detected {len(features)} chlorophyll edges")

        return GeoJSONFeatureCollection(
            features=features,
            metadata={
                "feature_count": len(features),
                "low_thresh": request.low_thresh,
                "high_thresh": request.high_thresh,
                "data_shape": list(chl_array.shape)
            }
        )

    except ValueError as e:
        logger.error(f"Value error in chlorophyll edge detection: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error detecting chlorophyll edges: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.post("/api/features/eddies", response_model=GeoJSONFeatureCollection)
async def detect_eddies(request: EddyDetectionRequest):
    """
    Detect mesoscale eddies using Okubo-Weiss parameter

    Args:
        request: EddyDetectionRequest containing SST data and coordinates

    Returns:
        GeoJSON FeatureCollection of eddy Polygons
    """
    try:
        # Convert lists to numpy arrays
        sst_array = np.array(request.data, dtype=np.float32)
        lon_array = np.array(request.lon, dtype=np.float32)
        lat_array = np.array(request.lat, dtype=np.float32)

        # Validate dimensions
        if sst_array.shape[0] != len(lat_array) or sst_array.shape[1] != len(lon_array):
            raise HTTPException(
                status_code=400,
                detail=f"Data dimensions mismatch: data shape {sst_array.shape}, lat length {len(lat_array)}, lon length {len(lon_array)}"
            )

        logger.info(f"Detecting eddies with min_radius_km={request.min_radius_km}")

        # Detect eddies
        features = detector.detect_eddies(
            sst_array=sst_array,
            lon_array=lon_array,
            lat_array=lat_array,
            min_radius_km=request.min_radius_km
        )

        logger.info(f"Detected {len(features)} eddies")

        return GeoJSONFeatureCollection(
            features=features,
            metadata={
                "feature_count": len(features),
                "min_radius_km": request.min_radius_km,
                "data_shape": list(sst_array.shape)
            }
        )

    except ValueError as e:
        logger.error(f"Value error in eddy detection: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error detecting eddies: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

# Legacy GET endpoints for compatibility with existing Next.js routes
# These return sample data - full implementation would require Copernicus data fetching

@app.get("/ocean-features/fronts")
async def get_thermal_fronts_legacy(
    bbox: str = Query(..., description="Bounding box as 'south,west,north,east'"),
    date: str = Query(..., description="Date in ISO format YYYY-MM-DD"),
    threshold: float = Query(0.5, description="Temperature gradient threshold")
):
    """Legacy GET endpoint for thermal fronts (returns sample data)"""
    logger.info(f"Legacy GET /ocean-features/fronts called with bbox={bbox}, date={date}")

    # Parse bbox
    try:
        south, west, north, east = map(float, bbox.split(','))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bbox format. Expected: 'south,west,north,east'")

    # Return sample thermal front data
    # In production, this would fetch real Copernicus SST data
    features = [
        {
            "type": "Feature",
            "properties": {
                "feature_type": "thermal_front",
                "strength": 0.8,
                "threshold": threshold,
                "id": "demo_front_1"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [west + (east - west) * 0.2, south + (north - south) * 0.3],
                    [west + (east - west) * 0.4, south + (north - south) * 0.5],
                    [west + (east - west) * 0.6, south + (north - south) * 0.4],
                    [west + (east - west) * 0.8, south + (north - south) * 0.6]
                ]
            }
        }
    ]

    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "bbox": [south, west, north, east],
            "date": date,
            "feature_count": len(features),
            "threshold": threshold,
            "mode": "demo"
        }
    }

@app.get("/ocean-features/edges")
async def get_chlorophyll_edges_legacy(
    bbox: str = Query(..., description="Bounding box as 'south,west,north,east'"),
    date: str = Query(..., description="Date in ISO format YYYY-MM-DD"),
    low_thresh: float = Query(0.1, description="Lower threshold"),
    high_thresh: float = Query(0.3, description="Upper threshold")
):
    """Legacy GET endpoint for chlorophyll edges (returns sample data)"""
    logger.info(f"Legacy GET /ocean-features/edges called with bbox={bbox}, date={date}")

    # Parse bbox
    try:
        south, west, north, east = map(float, bbox.split(','))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bbox format. Expected: 'south,west,north,east'")

    # Return sample chlorophyll edge data
    features = [
        {
            "type": "Feature",
            "properties": {
                "feature_type": "chlorophyll_edge",
                "area_pixels": 2500,
                "perimeter_pixels": 180,
                "id": "demo_edge_1"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [west + (east - west) * 0.3, south + (north - south) * 0.3],
                    [west + (east - west) * 0.7, south + (north - south) * 0.3],
                    [west + (east - west) * 0.7, south + (north - south) * 0.6],
                    [west + (east - west) * 0.3, south + (north - south) * 0.6],
                    [west + (east - west) * 0.3, south + (north - south) * 0.3]
                ]]
            }
        }
    ]

    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "bbox": [south, west, north, east],
            "date": date,
            "feature_count": len(features),
            "mode": "demo"
        }
    }

@app.get("/ocean-features/eddies")
async def get_eddies_legacy(
    bbox: str = Query(..., description="Bounding box as 'south,west,north,east'"),
    date: str = Query(..., description="Date in ISO format YYYY-MM-DD"),
    min_radius: float = Query(10.0, description="Minimum eddy radius in km")
):
    """Legacy GET endpoint for eddies (returns sample data)"""
    logger.info(f"Legacy GET /ocean-features/eddies called with bbox={bbox}, date={date}")

    # Parse bbox
    try:
        south, west, north, east = map(float, bbox.split(','))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bbox format. Expected: 'south,west,north,east'")

    # Return sample eddy data
    center_lat = (south + north) / 2
    center_lon = (west + east) / 2

    features = [
        {
            "type": "Feature",
            "properties": {
                "feature_type": "eddy",
                "eddy_type": "warm_core",
                "radius_km": 25.0,
                "centroid_lat": center_lat + 0.1,
                "centroid_lon": center_lon - 0.1,
                "okubo_weiss": -0.15,
                "sst_anomaly": 1.2,
                "id": "demo_eddy_1"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [center_lon - 0.1, center_lat + 0.1],
                    [center_lon - 0.05, center_lat + 0.15],
                    [center_lon, center_lat + 0.1],
                    [center_lon - 0.05, center_lat + 0.05],
                    [center_lon - 0.1, center_lat + 0.1]
                ]]
            }
        }
    ]

    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "bbox": [south, west, north, east],
            "date": date,
            "feature_count": len(features),
            "min_radius_km": min_radius,
            "mode": "demo"
        }
    }

if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 8010))
    uvicorn.run(app, host="0.0.0.0", port=port)
