"""
Simplified ocean feature scheduler for GitHub Actions
Generates polygons once and exits (no continuous scheduling)
"""

import asyncio
import logging
from datetime import datetime
import os
import json
import numpy as np
from pathlib import Path
from app.ocean_features import OceanFeatureDetector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SimpleOceanScheduler:
    """One-time ocean feature generation"""
    
    def __init__(self):
        self.detector = OceanFeatureDetector()
        self.output_dir = Path("data/polygons")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # East Coast regions
        self.regions = [
            {"name": "maine", "bbox": [-71, 43, -66, 45]},
            {"name": "massachusetts", "bbox": [-72, 41, -69, 43]},
            {"name": "new_york", "bbox": [-74, 40, -71, 41.5]},
            {"name": "new_jersey", "bbox": [-75, 38.5, -73, 40.5]},
            {"name": "delaware", "bbox": [-76, 38, -74, 39.5]},
            {"name": "maryland", "bbox": [-77, 37.5, -75, 39]},
            {"name": "virginia", "bbox": [-77, 36.5, -75, 38]},
            {"name": "north_carolina", "bbox": [-78, 33.5, -75, 36.5]},
            {"name": "south_carolina", "bbox": [-81, 32, -78, 34]},
            {"name": "georgia", "bbox": [-82, 30.5, -80, 32.5]},
            {"name": "florida", "bbox": [-82, 24, -79, 31]},
        ]
    
    def generate_synthetic_data(self, bbox):
        """Generate realistic synthetic ocean data"""
        lon_array = np.linspace(bbox[0], bbox[2], 100)
        lat_array = np.linspace(bbox[1], bbox[3], 100)
        lon_grid, lat_grid = np.meshgrid(lon_array, lat_array)
        
        # SST with Gulf Stream
        sst_base = 15 + 10 * (1 - (lat_grid - bbox[1]) / (bbox[3] - bbox[1]))
        gulf_stream_lon = -75 + 2 * np.sin((lat_grid - 35) * 0.5)
        gulf_stream_effect = 5 * np.exp(-((lon_grid - gulf_stream_lon) ** 2) / 2)
        sst_array = sst_base + gulf_stream_effect + np.random.normal(0, 0.5, sst_base.shape)
        
        # Chlorophyll (higher near coast)
        distance_from_coast = np.abs(lon_grid - bbox[0])
        chl_array = 0.5 + 3 * np.exp(-distance_from_coast / 2)
        chl_array *= np.random.lognormal(0, 0.3, chl_array.shape)
        
        return {
            "sst": sst_array,
            "chl": chl_array,
            "lon": lon_array,
            "lat": lat_array
        }
    
    def process_region(self, region):
        """Process a single region"""
        logger.info(f"Processing {region['name']}...")
        
        try:
            # Generate synthetic data (replace with Copernicus in production)
            data = self.generate_synthetic_data(region["bbox"])
            
            all_features = []
            
            # Detect features
            fronts = self.detector.detect_thermal_fronts(
                data["sst"], data["lon"], data["lat"], threshold=0.5
            )
            all_features.extend(fronts)
            
            edges = self.detector.detect_chlorophyll_edges(
                data["chl"], data["lon"], data["lat"]
            )
            all_features.extend(edges)
            
            eddies = self.detector.detect_eddies(
                data["sst"], data["lon"], data["lat"], min_radius_km=15
            )
            all_features.extend(eddies)
            
            logger.info(f"  Found {len(fronts)} fronts, {len(edges)} edges, {len(eddies)} eddies")
            
            return all_features
            
        except Exception as e:
            logger.error(f"Error processing {region['name']}: {str(e)}")
            return []
    
    def generate_all(self):
        """Generate polygons for all regions"""
        start_time = datetime.utcnow()
        date = start_time.date()
        
        logger.info(f"Starting polygon generation for {date}")
        
        # Process all regions
        all_features = []
        for region in self.regions:
            features = self.process_region(region)
            all_features.extend(features)
        
        # Create GeoJSON
        geojson = {
            "type": "FeatureCollection",
            "features": all_features,
            "properties": {
                "generated_at": start_time.isoformat(),
                "total_features": len(all_features),
                "regions_processed": len(self.regions),
                "data_date": date.isoformat(),
                "generator": "github-actions"
            }
        }
        
        # Save files
        output_file = self.output_dir / f"ocean_features_{date.strftime('%Y%m%d')}.geojson"
        with open(output_file, 'w') as f:
            json.dump(geojson, f, indent=2)
        
        latest_file = self.output_dir / "ocean_features_latest.geojson"
        with open(latest_file, 'w') as f:
            json.dump(geojson, f, indent=2)
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        logger.info(f"✅ Generation completed in {duration:.2f} seconds")
        logger.info(f"📊 Generated {len(all_features)} total features")
        logger.info(f"💾 Saved to {output_file}")

if __name__ == "__main__":
    scheduler = SimpleOceanScheduler()
    scheduler.generate_all()
