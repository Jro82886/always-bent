from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import os
import io
import xarray as xr
import numpy as np
from shapely.geometry import Polygon, mapping
from skimage import measure
from typing import Optional, List, Tuple
import requests
from ocean_features import OceanFeatureDetector

app = FastAPI(title="ABFI Ocean Analysis Backend")
detector = OceanFeatureDetector()


def fetch_mur(time_iso: str, bbox: Tuple[float, float, float, float]) -> xr.DataArray:
    """Fetch subset of MUR SST via ERDDAP griddap .nc HTTP request (robust in most envs)."""
    base = os.environ.get("GRIDDAP_BASE", "https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41").rstrip("/")
    min_lon, min_lat, max_lon, max_lat = bbox
    # ERDDAP query: var[(time)][(lat_min):stride:(lat_max)][(lon_min):stride:(lon_max)]
    time_str = f"{time_iso}T00:00:00Z"
    query = (
        "analysed_sst"
        f"[({time_str})]"
        f"[({min_lat}):1:({max_lat})]"
        f"[({min_lon}):1:({max_lon})]"
    )
    url = f"{base}.nc?{query}"
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    ds = xr.open_dataset(io.BytesIO(r.content))
    da = ds["analysed_sst"].astype("float32")
    da = da.where(np.isfinite(da))
    return da


def sst_edges_to_polygons(da: xr.DataArray, levels: Optional[List[float]] = None) -> List[dict]:
    arr = da.values
    if arr.ndim == 3:
        arr = arr[0]
    arr = np.asarray(arr)
    if not np.any(np.isfinite(arr)):
        return []

    # Choose contour levels based on data range if not provided
    vmin = float(np.nanpercentile(arr, 10))
    vmax = float(np.nanpercentile(arr, 90))
    if not levels:
        step = max(0.5, (vmax - vmin) / 8.0)
        levels = [vmin + i * step for i in range(1, 8)]

    lats = da["latitude"].values
    lons = da["longitude"].values

    features: list[dict] = []
    for lev in levels:
        try:
            cs = measure.find_contours(arr, lev)
        except Exception:
            cs = []
        for contour in cs:
            # contour indices -> lat/lon
            ys = contour[:, 0]
            xs = contour[:, 1]
            # guard ranges
            ys = np.clip(ys, 0, len(lats) - 1)
            xs = np.clip(xs, 0, len(lons) - 1)
            poly_coords = [(float(lons[int(x)]), float(lats[int(y)])) for x, y in zip(xs, ys)]
            if len(poly_coords) < 4:
                continue
            # close ring
            if poly_coords[0] != poly_coords[-1]:
                poly_coords.append(poly_coords[0])
            try:
                geom = Polygon(poly_coords)
            except Exception:
                continue
            if not geom.is_valid or geom.area <= 0:
                continue
            features.append({
                "type": "Feature",
                "properties": {"type": "edge", "level": float(lev)},
                "geometry": mapping(geom.simplify(0.002, preserve_topology=True))
            })

    return features


@app.get("/polygons")
def get_polygons(time: str = Query(..., description="YYYY-MM-DD"), bbox: str = Query(...)):
    try:
        parts = [float(p) for p in bbox.split(",")]
        if len(parts) != 4:
            return JSONResponse({"error": "bad_bbox"}, status_code=400)
        min_lon, min_lat, max_lon, max_lat = parts
        da = fetch_mur(time, (min_lon, min_lat, max_lon, max_lat))
        feats = sst_edges_to_polygons(da)
        return JSONResponse({"type": "FeatureCollection", "features": feats})
    except Exception as e:
        return JSONResponse({"error": "failed", "message": str(e)}, status_code=500)


@app.get("/ocean-features/fronts")
def get_thermal_fronts(
    bbox: str = Query(..., description="min_lon,min_lat,max_lon,max_lat"),
    date: str = Query(..., description="YYYY-MM-DD"),
    threshold: float = Query(0.5, description="Temperature gradient threshold (°C/km)")
):
    """Detect SST thermal fronts using Sobel edge detection"""
    try:
        parts = [float(p) for p in bbox.split(",")]
        if len(parts) != 4:
            return JSONResponse({"error": "bad_bbox"}, status_code=400)
        
        min_lon, min_lat, max_lon, max_lat = parts
        da = fetch_mur(date, (min_lon, min_lat, max_lon, max_lat))
        
        # Extract arrays
        sst_array = da.values
        if sst_array.ndim == 3:
            sst_array = sst_array[0]  # Remove time dimension
            
        lat_array = da["latitude"].values
        lon_array = da["longitude"].values
        
        # Detect thermal fronts
        fronts = detector.detect_thermal_fronts(sst_array, lon_array, lat_array, threshold)
        
        return JSONResponse(fronts)
        
    except Exception as e:
        return JSONResponse({"error": "failed", "message": str(e)}, status_code=500)


@app.get("/ocean-features/edges")
def get_chlorophyll_edges(
    bbox: str = Query(..., description="min_lon,min_lat,max_lon,max_lat"),
    date: str = Query(..., description="YYYY-MM-DD"),
    low_thresh: float = Query(0.1, description="Lower Canny threshold"),
    high_thresh: float = Query(0.3, description="Upper Canny threshold")
):
    """Detect chlorophyll edges using Canny edge detection"""
    try:
        # For now, use SST data as a proxy - in production would use actual chlorophyll data
        parts = [float(p) for p in bbox.split(",")]
        if len(parts) != 4:
            return JSONResponse({"error": "bad_bbox"}, status_code=400)
        
        min_lon, min_lat, max_lon, max_lat = parts
        da = fetch_mur(date, (min_lon, min_lat, max_lon, max_lat))
        
        # Extract arrays (using SST as proxy for chlorophyll)
        chl_array = da.values
        if chl_array.ndim == 3:
            chl_array = chl_array[0]
            
        # Convert SST to mock chlorophyll-like values
        chl_array = np.exp(-(chl_array - 20)**2 / 50) * 10  # Mock transformation
            
        lat_array = da["latitude"].values
        lon_array = da["longitude"].values
        
        # Detect chlorophyll edges
        edges = detector.detect_chlorophyll_edges(chl_array, lon_array, lat_array, low_thresh, high_thresh)
        
        return JSONResponse(edges)
        
    except Exception as e:
        return JSONResponse({"error": "failed", "message": str(e)}, status_code=500)


@app.get("/ocean-features/eddies")
def get_eddies(
    bbox: str = Query(..., description="min_lon,min_lat,max_lon,max_lat"),
    date: str = Query(..., description="YYYY-MM-DD"),
    min_radius: float = Query(10.0, description="Minimum eddy radius (km)")
):
    """Detect mesoscale eddies using Okubo-Weiss parameter"""
    try:
        parts = [float(p) for p in bbox.split(",")]
        if len(parts) != 4:
            return JSONResponse({"error": "bad_bbox"}, status_code=400)
        
        min_lon, min_lat, max_lon, max_lat = parts
        da = fetch_mur(date, (min_lon, min_lat, max_lon, max_lat))
        
        # Extract arrays
        sst_array = da.values
        if sst_array.ndim == 3:
            sst_array = sst_array[0]
            
        lat_array = da["latitude"].values
        lon_array = da["longitude"].values
        
        # Detect eddies
        eddies = detector.detect_eddies(sst_array, lon_array, lat_array, min_radius)
        
        return JSONResponse(eddies)
        
    except Exception as e:
        return JSONResponse({"error": "failed", "message": str(e)}, status_code=500)


