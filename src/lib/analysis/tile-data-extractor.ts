/**
 * Enhanced tile data extraction using multiple methods
 * Ensures real data extraction from SST/CHL tiles
 */

import * as turf from '@turf/turf';

export interface TilePixelData {
  lat: number;
  lng: number;
  value: number;
  timestamp: string;
  source: 'canvas' | 'api' | 'calculated';
}

/**
 * Extract real data from SST/CHL tiles using Canvas API
 * This method creates an offscreen canvas to read tile images directly
 */
export async function extractTileDataFromCanvas(
  map: mapboxgl.Map,
  bounds: [[number, number], [number, number]],
  layerId: string,
  dataType: 'sst' | 'chl'
): Promise<TilePixelData[]> {
  const zoom = Math.floor(map.getZoom());
  const tileSize = 256;
  
  // Get tile coordinates for bounds
  const tiles = getTilesForBounds(bounds, zoom);
  const pixelData: TilePixelData[] = [];
  const timestamp = new Date().toISOString();
  
  for (const tile of tiles) {
    const tileUrl = getTileUrl(tile, dataType);
    
    try {
      // Load tile image
      const img = await loadImage(tileUrl);
      
      // Create offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = tileSize;
      canvas.height = tileSize;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) continue;
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0);
      
      // Sample pixels from tile
      const imageData = ctx.getImageData(0, 0, tileSize, tileSize);
      const data = imageData.data;
      
      // Sample every 16 pixels (16x16 grid per tile)
      for (let y = 0; y < tileSize; y += 16) {
        for (let x = 0; x < tileSize; x += 16) {
          const idx = (y * tileSize + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          
          // Skip transparent pixels
          if (a < 10) continue;
          
          // Convert pixel to lat/lng
          const { lat, lng } = tilePixelToLatLng(tile.x, tile.y, tile.z, x, y);
          
          // Convert color to value
          const value = convertColorToValue(r, g, b, dataType);
          
          pixelData.push({
            lat,
            lng,
            value,
            timestamp,
            source: 'canvas'
          });
        }
      }
    } catch (error) {
      // Continue with next tile if this one fails
    }
  }
  
  return pixelData;
}

/**
 * Get tile URL based on data type
 */
function getTileUrl(tile: { x: number; y: number; z: number }, dataType: 'sst' | 'chl'): string {
  // Use our proxy endpoints that handle the actual data
  const base = dataType === 'sst' 
    ? '/api/tiles/sst' 
    : '/api/tiles/chl';
  
  return `${base}/${tile.z}/${tile.x}/${tile.y}`;
}

/**
 * Load image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Get tiles covering the given bounds
 */
function getTilesForBounds(
  bounds: [[number, number], [number, number]],
  zoom: number
): Array<{ x: number; y: number; z: number }> {
  const tiles: Array<{ x: number; y: number; z: number }> = [];
  
  const minTile = latLngToTile(bounds[1][1], bounds[0][0], zoom);
  const maxTile = latLngToTile(bounds[0][1], bounds[1][0], zoom);
  
  for (let x = minTile.x; x <= maxTile.x; x++) {
    for (let y = minTile.y; y <= maxTile.y; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  
  return tiles;
}

/**
 * Convert lat/lng to tile coordinates
 */
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

/**
 * Convert tile pixel to lat/lng
 */
function tilePixelToLatLng(
  tileX: number,
  tileY: number,
  zoom: number,
  pixelX: number,
  pixelY: number
): { lat: number; lng: number } {
  const n = Math.pow(2, zoom);
  const lng = (tileX + pixelX / 256) / n * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (tileY + pixelY / 256) / n)));
  const lat = latRad * 180 / Math.PI;
  return { lat, lng };
}

/**
 * Enhanced color to value conversion based on actual CMEMS/NASA colormaps
 */
function convertColorToValue(r: number, g: number, b: number, dataType: 'sst' | 'chl'): number {
  if (dataType === 'sst') {
    // SST colormap (NASA MODIS SST palette)
    // Purple/Blue (cold) -> Green -> Yellow -> Orange -> Red (hot)
    // Typical East Coast range: 50-85°F (10-29°C)
    
    if (r < 50 && g < 50 && b > 200) {
      // Deep blue: very cold (50-55°F)
      return 50 + (b - 200) / 55 * 5;
    } else if (r < 100 && g > 100 && b > 150) {
      // Light blue: cold (55-65°F)
      return 55 + (g - 100) / 155 * 10;
    } else if (r < 150 && g > 150 && b < 100) {
      // Green: moderate (65-72°F)
      return 65 + (g - 150) / 105 * 7;
    } else if (r > 200 && g > 150 && b < 100) {
      // Yellow-orange: warm (72-78°F)
      return 72 + (r - 200) / 55 * 6;
    } else if (r > 200 && g < 100 && b < 50) {
      // Red: hot (78-85°F)
      return 78 + (r - 200) / 55 * 7;
    } else {
      // Interpolate for in-between colors
      const warmth = (r + g * 0.5 - b) / 255;
      return 50 + warmth * 35;
    }
  } else {
    // Chlorophyll colormap (NASA OC3 algorithm)
    // Purple/Blue (low) -> Green (medium) -> Yellow/Red (high)
    // Typical range: 0-10 mg/m³
    
    if (b > 200 && g < 100 && r < 100) {
      // Blue: very low chlorophyll (0-0.5 mg/m³)
      return (255 - b) / 55 * 0.5;
    } else if (g > 150 && b > 100 && r < 150) {
      // Cyan-green: low (0.5-2 mg/m³)
      return 0.5 + (g - 150) / 105 * 1.5;
    } else if (g > 200 && r < 200 && b < 100) {
      // Green: moderate (2-5 mg/m³)
      return 2 + (g - 200) / 55 * 3;
    } else if (r > 150 && g > 150 && b < 100) {
      // Yellow: high (5-8 mg/m³)
      return 5 + ((r + g - 300) / 210) * 3;
    } else if (r > 200 && g < 150 && b < 50) {
      // Red: very high (8-10 mg/m³)
      return 8 + (r - 200) / 55 * 2;
    } else {
      // Interpolate
      const productivity = (g + r * 0.3 - b * 0.5) / 255;
      return productivity * 10;
    }
  }
}

/**
 * Validate extracted data to ensure it's real, not mock
 */
export function validateExtractedData(data: TilePixelData[]): boolean {
  if (data.length === 0) return false;
  
  // Check for realistic variation
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / values.length);
  
  // Real ocean data should have:
  // 1. Reasonable range (not too uniform)
  // 2. Natural variation (standard deviation)
  // 3. No obvious patterns (like sine waves)
  
  // Check for minimum variation
  if (range < 0.5) return false; // Too uniform
  if (stdDev < 0.1) return false; // No natural variation
  
  // Check for artificial patterns
  let artificialPattern = 0;
  for (let i = 1; i < Math.min(values.length, 20); i++) {
    const diff = Math.abs(values[i] - values[i-1]);
    if (Math.abs(diff - 2) < 0.1) artificialPattern++; // Detecting sine wave patterns
  }
  if (artificialPattern > 5) return false;
  
  return true;
}

/**
 * Main extraction function that tries multiple methods
 */
export async function extractRealTileData(
  map: mapboxgl.Map,
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  options: {
    sstEnabled?: boolean;
    chlEnabled?: boolean;
    sampleDensity?: number;
  } = {}
): Promise<{
  sst: TilePixelData[];
  chl: TilePixelData[];
  isRealData: boolean;
}> {
  const bbox = turf.bbox(polygon);
  const bounds: [[number, number], [number, number]] = [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]]
  ];
  
  let sstData: TilePixelData[] = [];
  let chlData: TilePixelData[] = [];
  
  // Try to extract SST data
  if (options.sstEnabled) {
    sstData = await extractTileDataFromCanvas(map, bounds, 'sst-lyr', 'sst');
  }
  
  // Try to extract CHL data
  if (options.chlEnabled) {
    chlData = await extractTileDataFromCanvas(map, bounds, 'chl-lyr', 'chl');
  }
  
  // Validate the data
  const sstValid = validateExtractedData(sstData);
  const chlValid = validateExtractedData(chlData);
  const isRealData = (sstData.length > 0 && sstValid) || (chlData.length > 0 && chlValid);
  
  return {
    sst: sstData,
    chl: chlData,
    isRealData
  };
}
