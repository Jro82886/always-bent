"""
Advanced Ocean Feature Detection
Detects SST fronts, chlorophyll edges, and mesoscale eddies
"""

import numpy as np
import cv2
from scipy import ndimage
from scipy.spatial.distance import cdist
from skimage import measure, filters, morphology
import xarray as xr
from typing import List, Dict, Tuple, Optional
import geojson
from shapely.geometry import Point, Polygon
from shapely.ops import transform
import pyproj

class OceanFeatureDetector:
    """Advanced oceanographic feature detection from satellite data"""
    
    def __init__(self):
        self.earth_radius = 6371000  # meters
        
    def detect_thermal_fronts(self, sst_array: np.ndarray, 
                            lon_array: np.ndarray, lat_array: np.ndarray,
                            threshold: float = 0.5) -> List[Dict]:
        """
        Detect SST fronts using Sobel edge detection
        
        Args:
            sst_array: Sea surface temperature data (°C)
            lon_array: Longitude coordinates
            lat_array: Latitude coordinates  
            threshold: Temperature gradient threshold (°C/km)
            
        Returns:
            List of front features as GeoJSON-like dicts
        """
        # Handle NaN values
        sst_clean = np.nan_to_num(sst_array, nan=0)
        
        # Calculate gradients using Sobel operators
        grad_x = cv2.Sobel(sst_clean.astype(np.float32), cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(sst_clean.astype(np.float32), cv2.CV_64F, 0, 1, ksize=3)
        
        # Calculate gradient magnitude
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        
        # Convert pixel gradients to °C/km
        # Approximate conversion based on latitude
        lat_center = np.mean(lat_array)
        km_per_degree_lat = 111.0
        km_per_degree_lon = 111.0 * np.cos(np.radians(lat_center))
        
        # Pixel resolution in degrees
        lat_res = abs(lat_array[1] - lat_array[0]) if len(lat_array) > 1 else 0.01
        lon_res = abs(lon_array[1] - lon_array[0]) if len(lon_array) > 1 else 0.01
        
        # Convert to °C/km
        gradient_magnitude_km = gradient_magnitude / np.sqrt(
            (lat_res * km_per_degree_lat)**2 + (lon_res * km_per_degree_lon)**2
        )
        
        # Apply threshold
        fronts_binary = gradient_magnitude_km > threshold
        
        # Clean up small features
        fronts_binary = morphology.remove_small_objects(fronts_binary, min_size=50)
        
        # Find contours
        contours = measure.find_contours(fronts_binary, 0.5)
        
        features = []
        for i, contour in enumerate(contours):
            if len(contour) < 10:  # Skip very small contours
                continue
                
            # Convert pixel coordinates to lat/lon
            coords = []
            for point in contour:
                row, col = int(point[0]), int(point[1])
                if 0 <= row < len(lat_array) and 0 <= col < len(lon_array):
                    lat, lon = lat_array[row], lon_array[col]
                    coords.append([lon, lat])
            
            if len(coords) > 2:
                # Calculate front strength (average gradient)
                mask_coords = contour.astype(int)
                valid_mask = ((mask_coords[:, 0] >= 0) & (mask_coords[:, 0] < gradient_magnitude_km.shape[0]) &
                             (mask_coords[:, 1] >= 0) & (mask_coords[:, 1] < gradient_magnitude_km.shape[1]))
                
                if np.any(valid_mask):
                    valid_coords = mask_coords[valid_mask]
                    strength = np.mean(gradient_magnitude_km[valid_coords[:, 0], valid_coords[:, 1]])
                    
                    features.append({
                        "type": "Feature",
                        "properties": {
                            "feature_type": "thermal_front",
                            "strength": float(strength),
                            "threshold": threshold,
                            "id": f"front_{i}"
                        },
                        "geometry": {
                            "type": "LineString",
                            "coordinates": coords
                        }
                    })
        
        return features
    
    def detect_chlorophyll_edges(self, chl_array: np.ndarray,
                               lon_array: np.ndarray, lat_array: np.ndarray,
                               low_thresh: float = 0.1, high_thresh: float = 0.3) -> List[Dict]:
        """
        Detect chlorophyll edges using Canny edge detection
        
        Args:
            chl_array: Chlorophyll concentration data (mg/m³)
            lon_array: Longitude coordinates
            lat_array: Latitude coordinates
            low_thresh: Lower threshold for Canny detection
            high_thresh: Upper threshold for Canny detection
            
        Returns:
            List of edge features as GeoJSON-like dicts
        """
        # Handle NaN and log-transform chlorophyll (typical for ocean color)
        chl_clean = np.nan_to_num(chl_array, nan=0.01)
        chl_log = np.log10(np.maximum(chl_clean, 0.01))
        
        # Normalize to 0-255 for OpenCV
        chl_normalized = cv2.normalize(chl_log, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        
        # Apply Gaussian blur to reduce noise
        chl_blurred = cv2.GaussianBlur(chl_normalized, (5, 5), 0)
        
        # Canny edge detection
        edges = cv2.Canny(chl_blurred, int(low_thresh * 255), int(high_thresh * 255))
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        features = []
        for i, contour in enumerate(contours):
            if len(contour) < 10:  # Skip very small contours
                continue
                
            # Simplify contour
            epsilon = 0.01 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            
            # Convert pixel coordinates to lat/lon
            coords = []
            for point in approx:
                col, row = point[0][0], point[0][1]
                if 0 <= row < len(lat_array) and 0 <= col < len(lon_array):
                    lat, lon = lat_array[row], lon_array[col]
                    coords.append([lon, lat])
            
            if len(coords) > 2:
                # Calculate edge properties
                contour_area = cv2.contourArea(contour)
                perimeter = cv2.arcLength(contour, True)
                
                features.append({
                    "type": "Feature",
                    "properties": {
                        "feature_type": "chlorophyll_edge",
                        "area_pixels": float(contour_area),
                        "perimeter_pixels": float(perimeter),
                        "id": f"edge_{i}"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [coords + [coords[0]]]  # Close polygon
                    }
                })
        
        return features
    
    def calculate_okubo_weiss(self, sst_array: np.ndarray, 
                            lon_array: np.ndarray, lat_array: np.ndarray) -> np.ndarray:
        """
        Calculate Okubo-Weiss parameter for eddy detection
        
        Args:
            sst_array: Sea surface temperature data
            lon_array: Longitude coordinates
            lat_array: Latitude coordinates
            
        Returns:
            Okubo-Weiss parameter field
        """
        # Calculate velocity field from SST using geostrophic approximation
        # This is simplified - in reality would use altimetry data
        
        sst_clean = np.nan_to_num(sst_array, nan=np.nanmean(sst_array))
        
        # Calculate gradients
        grad_y, grad_x = np.gradient(sst_clean)
        
        # Approximate geostrophic velocities (simplified)
        # u = -g/f * dSST/dy, v = g/f * dSST/dx
        # where f is Coriolis parameter
        lat_center = np.mean(lat_array)
        f = 2 * 7.2921e-5 * np.sin(np.radians(lat_center))  # Coriolis parameter
        
        u = -grad_y / f if f != 0 else np.zeros_like(grad_y)
        v = grad_x / f if f != 0 else np.zeros_like(grad_x)
        
        # Calculate strain and vorticity
        du_dx, du_dy = np.gradient(u)
        dv_dx, dv_dy = np.gradient(v)
        
        # Strain components
        S_n = du_dx - dv_dy  # Normal strain
        S_s = dv_dx + du_dy  # Shear strain
        
        # Vorticity
        omega = dv_dx - du_dy
        
        # Okubo-Weiss parameter
        W = S_n**2 + S_s**2 - omega**2
        
        return W
    
    def detect_eddies(self, sst_array: np.ndarray,
                     lon_array: np.ndarray, lat_array: np.ndarray,
                     min_radius_km: float = 10.0) -> List[Dict]:
        """
        Detect mesoscale eddies using Okubo-Weiss parameter
        
        Args:
            sst_array: Sea surface temperature data
            lon_array: Longitude coordinates
            lat_array: Latitude coordinates
            min_radius_km: Minimum eddy radius in kilometers
            
        Returns:
            List of eddy features as GeoJSON-like dicts
        """
        # Calculate Okubo-Weiss parameter
        W = self.calculate_okubo_weiss(sst_array, lon_array, lat_array)
        
        # Smooth the field
        W_smooth = filters.gaussian(W, sigma=2)
        
        # Find regions where W < 0 (eddy-dominated)
        eddy_regions = W_smooth < -np.std(W_smooth) * 0.5
        
        # Label connected components
        labeled_regions = measure.label(eddy_regions)
        
        features = []
        for region_id in range(1, labeled_regions.max() + 1):
            region_mask = labeled_regions == region_id
            
            # Calculate region properties
            props = measure.regionprops(region_mask.astype(int))[0]
            
            # Estimate radius in pixels
            radius_pixels = np.sqrt(props.area / np.pi)
            
            # Convert to kilometers (approximate)
            lat_center = np.mean(lat_array)
            km_per_degree = 111.0 * np.cos(np.radians(lat_center))
            lat_res = abs(lat_array[1] - lat_array[0]) if len(lat_array) > 1 else 0.01
            lon_res = abs(lon_array[1] - lon_array[0]) if len(lon_array) > 1 else 0.01
            pixel_size_km = np.sqrt((lat_res * 111.0)**2 + (lon_res * km_per_degree)**2)
            
            radius_km = radius_pixels * pixel_size_km
            
            if radius_km < min_radius_km:
                continue
            
            # Get centroid coordinates
            centroid_row, centroid_col = props.centroid
            centroid_row, centroid_col = int(centroid_row), int(centroid_col)
            
            if (0 <= centroid_row < len(lat_array) and 
                0 <= centroid_col < len(lon_array)):
                
                centroid_lat = lat_array[centroid_row]
                centroid_lon = lon_array[centroid_col]
                
                # Determine eddy type based on SST anomaly
                region_sst = sst_array[region_mask]
                mean_sst = np.nanmean(sst_array)
                region_mean_sst = np.nanmean(region_sst)
                
                eddy_type = "warm_core" if region_mean_sst > mean_sst else "cold_core"
                
                # Create circular approximation for visualization
                num_points = 32
                angles = np.linspace(0, 2*np.pi, num_points)
                
                # Convert radius to degrees
                radius_deg_lat = radius_km / 111.0
                radius_deg_lon = radius_km / (111.0 * np.cos(np.radians(centroid_lat)))
                
                coords = []
                for angle in angles:
                    lat = centroid_lat + radius_deg_lat * np.sin(angle)
                    lon = centroid_lon + radius_deg_lon * np.cos(angle)
                    coords.append([lon, lat])
                coords.append(coords[0])  # Close the circle
                
                features.append({
                    "type": "Feature",
                    "properties": {
                        "feature_type": "eddy",
                        "eddy_type": eddy_type,
                        "radius_km": float(radius_km),
                        "centroid_lat": float(centroid_lat),
                        "centroid_lon": float(centroid_lon),
                        "okubo_weiss": float(np.mean(W_smooth[region_mask])),
                        "sst_anomaly": float(region_mean_sst - mean_sst),
                        "id": f"eddy_{region_id}"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [coords]
                    }
                })
        
        return features

# Utility functions for data processing
def segment_phytoplankton_blooms(edges: np.ndarray, 
                               chl_array: np.ndarray,
                               min_area: int = 100) -> List[Dict]:
    """Segment phytoplankton blooms from edge-detected chlorophyll data"""
    
    # Fill edges to create regions
    filled = ndimage.binary_fill_holes(edges)
    
    # Label connected components
    labeled = measure.label(filled)
    
    blooms = []
    for region_id in range(1, labeled.max() + 1):
        region_mask = labeled == region_id
        
        if np.sum(region_mask) < min_area:
            continue
            
        # Calculate bloom properties
        region_chl = chl_array[region_mask]
        mean_chl = np.nanmean(region_chl)
        max_chl = np.nanmax(region_chl)
        
        blooms.append({
            "region_id": region_id,
            "area_pixels": int(np.sum(region_mask)),
            "mean_chlorophyll": float(mean_chl),
            "max_chlorophyll": float(max_chl),
            "bloom_intensity": "high" if max_chl > 10.0 else "moderate" if max_chl > 1.0 else "low"
        })
    
    return blooms
