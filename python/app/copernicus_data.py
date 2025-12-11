"""
Copernicus Marine Data Fetcher
Fetches REAL SST and Chlorophyll data from Copernicus Marine Service
"""

import os
import numpy as np
import xarray as xr
from datetime import datetime, timedelta
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Copernicus Marine Service credentials from environment
COPERNICUS_USER = os.environ.get('COPERNICUS_USER', '')
COPERNICUS_PASS = os.environ.get('COPERNICUS_PASS', '')

# Data product IDs
SST_PRODUCT = "cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m"
CHL_PRODUCT = "cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D"

# OpenDAP endpoints
SST_OPENDAP_URL = f"https://nrt.cmems-du.eu/thredds/dodsC/{SST_PRODUCT}"
CHL_OPENDAP_URL = f"https://my.cmems-du.eu/thredds/dodsC/{CHL_PRODUCT}"


def get_auth_session():
    """Create authenticated session for Copernicus"""
    import requests
    from requests.auth import HTTPBasicAuth

    if not COPERNICUS_USER or not COPERNICUS_PASS:
        logger.warning("Copernicus credentials not set")
        return None

    session = requests.Session()
    session.auth = HTTPBasicAuth(COPERNICUS_USER, COPERNICUS_PASS)
    return session


def fetch_sst_data(
    min_lon: float, max_lon: float,
    min_lat: float, max_lat: float,
    date: Optional[datetime] = None
) -> Optional[Tuple[np.ndarray, np.ndarray, np.ndarray]]:
    """
    Fetch real SST data from Copernicus Marine Service

    Args:
        min_lon, max_lon: Longitude bounds
        min_lat, max_lat: Latitude bounds
        date: Date to fetch (defaults to yesterday for data availability)

    Returns:
        Tuple of (sst_array, lon_array, lat_array) or None if failed
    """
    try:
        if date is None:
            date = datetime.now() - timedelta(days=1)

        logger.info(f"Fetching SST data for bbox: [{min_lon}, {min_lat}, {max_lon}, {max_lat}]")

        # Try using copernicusmarine library if available
        try:
            import copernicusmarine

            ds = copernicusmarine.open_dataset(
                dataset_id="cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m",
                variables=["thetao"],
                minimum_longitude=min_lon,
                maximum_longitude=max_lon,
                minimum_latitude=min_lat,
                maximum_latitude=max_lat,
                start_datetime=date.strftime("%Y-%m-%d"),
                end_datetime=date.strftime("%Y-%m-%d"),
                minimum_depth=0,
                maximum_depth=1,
                username=COPERNICUS_USER,
                password=COPERNICUS_PASS
            )

            sst = ds['thetao'].values[0, 0, :, :]  # First time, first depth
            lon = ds['longitude'].values
            lat = ds['latitude'].values

            logger.info(f"Successfully fetched SST data: shape={sst.shape}")
            return sst, lon, lat

        except ImportError:
            logger.info("copernicusmarine not available, trying xarray with OPeNDAP")

            # Fallback to xarray with OPeNDAP
            # Note: This requires pydap and proper authentication setup
            import pydap.client

            # Build subset URL
            url = f"{SST_OPENDAP_URL}?thetao[0:1:0][0:1:0][{min_lat}:{max_lat}][{min_lon}:{max_lon}]"

            ds = xr.open_dataset(
                url,
                engine='pydap',
                session=get_auth_session()
            )

            sst = ds['thetao'].values[0, 0, :, :]
            lon = ds['longitude'].values
            lat = ds['latitude'].values

            return sst, lon, lat

    except Exception as e:
        logger.error(f"Failed to fetch SST data: {e}")
        return None


def fetch_chlorophyll_data(
    min_lon: float, max_lon: float,
    min_lat: float, max_lat: float,
    date: Optional[datetime] = None
) -> Optional[Tuple[np.ndarray, np.ndarray, np.ndarray]]:
    """
    Fetch real chlorophyll data from Copernicus Marine Service

    Args:
        min_lon, max_lon: Longitude bounds
        min_lat, max_lat: Latitude bounds
        date: Date to fetch (defaults to yesterday)

    Returns:
        Tuple of (chl_array, lon_array, lat_array) or None if failed
    """
    try:
        if date is None:
            date = datetime.now() - timedelta(days=1)

        logger.info(f"Fetching CHL data for bbox: [{min_lon}, {min_lat}, {max_lon}, {max_lat}]")

        try:
            import copernicusmarine

            ds = copernicusmarine.open_dataset(
                dataset_id="cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D",
                variables=["CHL"],
                minimum_longitude=min_lon,
                maximum_longitude=max_lon,
                minimum_latitude=min_lat,
                maximum_latitude=max_lat,
                start_datetime=date.strftime("%Y-%m-%d"),
                end_datetime=date.strftime("%Y-%m-%d"),
                username=COPERNICUS_USER,
                password=COPERNICUS_PASS
            )

            chl = ds['CHL'].values[0, :, :]  # First time
            lon = ds['longitude'].values
            lat = ds['latitude'].values

            logger.info(f"Successfully fetched CHL data: shape={chl.shape}")
            return chl, lon, lat

        except ImportError:
            logger.warning("copernicusmarine library not available")
            return None

    except Exception as e:
        logger.error(f"Failed to fetch CHL data: {e}")
        return None


def convert_to_native_types(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, dict):
        return {k: convert_to_native_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_native_types(item) for item in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        return obj


def generate_real_polygons_for_region(
    min_lon: float, max_lon: float,
    min_lat: float, max_lat: float
) -> dict:
    """
    Generate REAL ocean feature polygons for a given region

    Fetches actual Copernicus data and runs scientific detection algorithms

    Args:
        min_lon, max_lon: Longitude bounds
        min_lat, max_lat: Latitude bounds

    Returns:
        GeoJSON FeatureCollection with real detected features
    """
    from app.ocean_features import OceanFeatureDetector

    detector = OceanFeatureDetector()
    all_features = []

    # Fetch and process SST data
    sst_result = fetch_sst_data(min_lon, max_lon, min_lat, max_lat)
    if sst_result is not None:
        sst, lon, lat = sst_result

        # Detect thermal fronts
        fronts = detector.detect_thermal_fronts(sst, lon, lat, threshold=0.3)
        all_features.extend(fronts)
        logger.info(f"Detected {len(fronts)} thermal fronts")

        # Detect eddies
        eddies = detector.detect_eddies(sst, lon, lat, min_radius_km=10)
        all_features.extend(eddies)
        logger.info(f"Detected {len(eddies)} eddies")

    # Fetch and process chlorophyll data
    chl_result = fetch_chlorophyll_data(min_lon, max_lon, min_lat, max_lat)
    if chl_result is not None:
        chl, lon, lat = chl_result

        # Detect chlorophyll edges
        edges = detector.detect_chlorophyll_edges(chl, lon, lat)
        all_features.extend(edges)
        logger.info(f"Detected {len(edges)} chlorophyll edges")

    # Convert all numpy types to native Python for JSON serialization
    result = {
        "type": "FeatureCollection",
        "features": convert_to_native_types(all_features),
        "properties": {
            "generated_at": datetime.now().isoformat(),
            "bbox": [float(min_lon), float(min_lat), float(max_lon), float(max_lat)],
            "data_source": "Copernicus Marine Service (CMEMS)",
            "real_data": True
        }
    }

    return result
