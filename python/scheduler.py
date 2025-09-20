"""
Daily ocean feature polygon generation scheduler
Runs daily to process new SST/CHL data and generate feature polygons
"""

import asyncio
import logging
from datetime import datetime, timedelta
import os
import json
import requests
from typing import Dict, List, Optional
import xarray as xr
import numpy as np
from app.ocean_features import OceanFeatureDetector
import schedule
import time
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class OceanFeatureScheduler:
    """Scheduled ocean feature detection and storage"""
    
    def __init__(self):
        self.detector = OceanFeatureDetector()
        self.copernicus_user = os.getenv("COPERNICUS_USER", "")
        self.copernicus_pass = os.getenv("COPERNICUS_PASS", "")
        self.output_dir = Path("data/polygons")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Define processing regions (East Coast fishing areas)
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
    
    async def fetch_copernicus_data(self, bbox: List[float], date: datetime) -> Dict:
        """
        Fetch SST and CHL data from Copernicus Marine Service
        """
        # This is a placeholder - in production, implement actual Copernicus API calls
        # For now, generate synthetic data
        logger.info(f"Fetching data for bbox {bbox} on {date.date()}")
        
        lon_array = np.linspace(bbox[0], bbox[2], 100)
        lat_array = np.linspace(bbox[1], bbox[3], 100)
        
        # Generate realistic SST pattern
        lon_grid, lat_grid = np.meshgrid(lon_array, lat_array)
        
        # Base temperature gradient (warmer south)
        sst_base = 15 + 10 * (1 - (lat_grid - bbox[1]) / (bbox[3] - bbox[1]))
        
        # Add Gulf Stream effect
        gulf_stream_lon = -75 + 2 * np.sin((lat_grid - 35) * 0.5)
        gulf_stream_effect = 5 * np.exp(-((lon_grid - gulf_stream_lon) ** 2) / 2)
        
        sst_array = sst_base + gulf_stream_effect + np.random.normal(0, 0.5, sst_base.shape)
        
        # Generate chlorophyll pattern (higher near coast)
        distance_from_coast = np.abs(lon_grid - bbox[0])
        chl_array = 0.5 + 3 * np.exp(-distance_from_coast / 2)
        chl_array *= np.random.lognormal(0, 0.3, chl_array.shape)
        
        return {
            "sst": sst_array,
            "chl": chl_array,
            "lon": lon_array,
            "lat": lat_array,
            "timestamp": date.isoformat()
        }
    
    async def process_region(self, region: Dict, date: datetime) -> Dict:
        """
        Process a single region and generate feature polygons
        """
        logger.info(f"Processing region: {region['name']}")
        
        try:
            # Fetch data
            data = await self.fetch_copernicus_data(region["bbox"], date)
            
            # Detect features
            all_features = []
            
            # Thermal fronts
            fronts = self.detector.detect_thermal_fronts(
                data["sst"], data["lon"], data["lat"], threshold=0.5
            )
            all_features.extend(fronts)
            logger.info(f"Found {len(fronts)} thermal fronts in {region['name']}")
            
            # Chlorophyll edges
            edges = self.detector.detect_chlorophyll_edges(
                data["chl"], data["lon"], data["lat"]
            )
            all_features.extend(edges)
            logger.info(f"Found {len(edges)} chlorophyll edges in {region['name']}")
            
            # Eddies
            eddies = self.detector.detect_eddies(
                data["sst"], data["lon"], data["lat"], min_radius_km=15
            )
            all_features.extend(eddies)
            logger.info(f"Found {len(eddies)} eddies in {region['name']}")
            
            return {
                "type": "FeatureCollection",
                "features": all_features,
                "properties": {
                    "region": region["name"],
                    "bbox": region["bbox"],
                    "timestamp": data["timestamp"],
                    "feature_counts": {
                        "fronts": len(fronts),
                        "edges": len(edges),
                        "eddies": len(eddies)
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing region {region['name']}: {str(e)}")
            return {
                "type": "FeatureCollection",
                "features": [],
                "properties": {
                    "region": region["name"],
                    "error": str(e)
                }
            }
    
    async def generate_daily_polygons(self):
        """
        Main task to generate polygons for all regions
        """
        start_time = datetime.utcnow()
        date = start_time.date()
        logger.info(f"Starting daily polygon generation for {date}")
        
        # Process all regions
        tasks = [self.process_region(region, start_time) for region in self.regions]
        results = await asyncio.gather(*tasks)
        
        # Combine all features
        all_features = []
        for result in results:
            all_features.extend(result["features"])
        
        # Create master GeoJSON
        master_geojson = {
            "type": "FeatureCollection",
            "features": all_features,
            "properties": {
                "generated_at": start_time.isoformat(),
                "total_features": len(all_features),
                "regions_processed": len(results),
                "data_date": date.isoformat()
            }
        }
        
        # Save to file
        output_file = self.output_dir / f"ocean_features_{date.strftime('%Y%m%d')}.geojson"
        with open(output_file, 'w') as f:
            json.dump(master_geojson, f, indent=2)
        
        # Also save as "latest"
        latest_file = self.output_dir / "ocean_features_latest.geojson"
        with open(latest_file, 'w') as f:
            json.dump(master_geojson, f, indent=2)
        
        # Upload to cloud storage (if configured)
        await self.upload_to_storage(output_file, latest_file)
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        logger.info(f"Daily polygon generation completed in {duration:.2f} seconds")
        logger.info(f"Generated {len(all_features)} total features")
        
        # Send notification
        await self.send_notification({
            "status": "success",
            "date": date.isoformat(),
            "features_generated": len(all_features),
            "duration_seconds": duration
        })
    
    async def upload_to_storage(self, daily_file: Path, latest_file: Path):
        """
        Upload generated files to cloud storage
        """
        # If Google Cloud Storage is configured
        if os.getenv("GCS_BUCKET"):
            try:
                from google.cloud import storage
                client = storage.Client()
                bucket = client.bucket(os.getenv("GCS_BUCKET"))
                
                # Upload daily file
                blob = bucket.blob(f"polygons/{daily_file.name}")
                blob.upload_from_filename(daily_file)
                
                # Upload latest file
                blob = bucket.blob("polygons/ocean_features_latest.geojson")
                blob.upload_from_filename(latest_file)
                
                logger.info("Files uploaded to Google Cloud Storage")
            except Exception as e:
                logger.error(f"Failed to upload to GCS: {str(e)}")
        
        # Make available via API endpoint
        if os.getenv("POLYGONS_BACKEND_URL"):
            try:
                # Notify the API that new data is available
                requests.post(
                    f"{os.getenv('POLYGONS_BACKEND_URL')}/admin/refresh-cache",
                    json={"file": str(latest_file)}
                )
            except Exception as e:
                logger.error(f"Failed to notify API: {str(e)}")
    
    async def send_notification(self, status: Dict):
        """
        Send notification about generation status
        """
        # Could integrate with Slack, email, or monitoring service
        logger.info(f"Generation status: {json.dumps(status, indent=2)}")
        
        # If webhook URL is configured
        if os.getenv("NOTIFICATION_WEBHOOK"):
            try:
                requests.post(
                    os.getenv("NOTIFICATION_WEBHOOK"),
                    json={
                        "text": f"Ocean features generated: {status['features_generated']} features for {status['date']}",
                        "status": status
                    }
                )
            except Exception as e:
                logger.error(f"Failed to send notification: {str(e)}")
    
    def run_scheduler(self):
        """
        Run the scheduler
        """
        # Schedule daily at 6 AM UTC (after typical SST data updates)
        schedule.every().day.at("06:00").do(
            lambda: asyncio.run(self.generate_daily_polygons())
        )
        
        logger.info("Scheduler started. Waiting for scheduled tasks...")
        
        # Run immediately on startup if requested
        if os.getenv("RUN_ON_STARTUP", "false").lower() == "true":
            logger.info("Running initial generation on startup...")
            asyncio.run(self.generate_daily_polygons())
        
        # Keep running
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

if __name__ == "__main__":
    scheduler = OceanFeatureScheduler()
    scheduler.run_scheduler()
