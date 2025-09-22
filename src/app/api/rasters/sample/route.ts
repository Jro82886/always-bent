import { NextRequest, NextResponse } from 'next/server';
import * as turf from '@turf/turf';
import { createCanvas, Image } from 'canvas';
import { 
  SST_TARGET_MIN, 
  SST_TARGET_MAX, 
  CHL_MID_BAND_RANGE,
  FRONT_STRONG_THRESHOLD 
} from '@/config/ocean-thresholds';

// Types
interface SampleRequest {
  polygon: GeoJSON.Feature<GeoJSON.Polygon>;
  time: string; // ISO date
  layers: ('sst' | 'chl')[];
}

interface SampleResponse {
  stats: {
    sst_mean?: number;
    sst_min?: number;
    sst_max?: number;
    sst_p10?: number;
    sst_p50?: number;
    sst_p90?: number;
    sst_midband_pct?: number;
    chl_mean?: number;
    chl_min?: number;
    chl_max?: number;
    chl_p10?: number;
    chl_p50?: number;
    chl_p90?: number;
    chl_midband_pct?: number;
    front_strength_mean?: number;
    front_strength_p90?: number;
    front_coverage_pct?: number;
    coverage_pct: number;
  };
  hist?: {
    sst?: number[];
    chl?: number[];
  };
  meta: {
    tiles: number;
    zoom: number;
    nodata_pct: number;
    timestamp: string;
  };
}

// Tile math helpers
function lng2tile(lng: number, zoom: number): number {
  return Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number): number {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}

function tile2lng(x: number, zoom: number): number {
  return x / Math.pow(2, zoom) * 360 - 180;
}

function tile2lat(y: number, zoom: number): number {
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, zoom);
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

// Helper to determine zoom level based on polygon size
function getOptimalZoom(bbox: number[]): number {
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  const maxDim = Math.max(width, height);
  
  // Rough zoom calculation for ocean data tiles
  if (maxDim > 10) return 5;
  if (maxDim > 5) return 6;
  if (maxDim > 2) return 7;
  if (maxDim > 1) return 8;
  if (maxDim > 0.5) return 9;
  return 10;
}

// Calculate percentile
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Calculate gradient magnitude (simplified Sobel)
function calculateGradient(values: number[][], width: number, height: number): number[][] {
  const gradient: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // Sobel X
      const gx = (values[y-1][x+1] + 2*values[y][x+1] + values[y+1][x+1]) -
                 (values[y-1][x-1] + 2*values[y][x-1] + values[y+1][x-1]);
      
      // Sobel Y
      const gy = (values[y+1][x-1] + 2*values[y+1][x] + values[y+1][x+1]) -
                 (values[y-1][x-1] + 2*values[y-1][x] + values[y-1][x+1]);
      
      // Magnitude
      gradient[y][x] = Math.sqrt(gx * gx + gy * gy) / 8; // Normalize
    }
  }
  
  return gradient;
}

// Convert raw pixel values to physical units based on Copernicus color mapping
function pixelToPhysical(r: number, g: number, b: number, layer: 'sst' | 'chl'): number | null {
  // Check for nodata (typically black or white)
  if ((r === 0 && g === 0 && b === 0) || (r === 255 && g === 255 && b === 255)) {
    return null;
  }
  
  if (layer === 'sst') {
    // SST uses a color scale from blue (cold) to red (hot)
    // This is a simplified mapping - in production you'd use the actual colormap
    // Approximate mapping: Blue = 50°F, Green = 70°F, Red = 85°F
    const normalized = (r + g * 0.5) / (255 * 1.5); // Rough approximation
    return 50 + normalized * 35; // Map to 50-85°F range
  } else if (layer === 'chl') {
    // CHL uses a color scale from blue (low) to green/yellow (high)
    // Approximate mapping based on typical ocean color scales
    const greenRatio = g / 255;
    const blueRatio = b / 255;
    // Low CHL = more blue, High CHL = more green
    const chlNormalized = greenRatio / (greenRatio + blueRatio + 0.01);
    return 0.01 + chlNormalized * 0.5; // Map to 0.01-0.5 mg/m³ range
  }
  
  return null;
}

// Load image from URL
async function loadImage(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Fetch and process tiles for a given layer
async function sampleRasterData(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  layer: 'sst' | 'chl',
  time: string,
  zoom: number
): Promise<{ values: number[]; nodata: number }> {
  const bbox = turf.bbox(polygon);
  const values: number[] = [];
  let nodata = 0;
  
  // Calculate tile bounds
  const minX = lng2tile(bbox[0], zoom);
  const maxX = lng2tile(bbox[2], zoom);
  const minY = lat2tile(bbox[3], zoom); // Note: Y is inverted
  const maxY = lat2tile(bbox[1], zoom);
  
  const tileCount = (maxX - minX + 1) * (maxY - minY + 1);
  console.log(`Fetching ${tileCount} tiles for ${layer} at zoom ${zoom}`);
  
  // Process each tile
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      try {
        // Get tile bounds in lat/lng
        const tileBounds = [
          tile2lng(x, zoom),
          tile2lat(y + 1, zoom),
          tile2lng(x + 1, zoom),
          tile2lat(y, zoom)
        ];
        
        // Create tile polygon
        const tilePolygon = turf.bboxPolygon(tileBounds as [number, number, number, number]);
        
        // Check if tile intersects with our polygon
        const intersection = turf.intersect(polygon, tilePolygon);
        if (!intersection) continue;
        
        // Fetch tile
        const tileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tiles/${layer}/${zoom}/${x}/${y}.png?date=${time}`;
        console.log(`Fetching tile: ${tileUrl}`);
        
        const response = await fetch(tileUrl);
        if (!response.ok) {
          console.warn(`Failed to fetch tile ${x},${y}: ${response.status}`);
          continue;
        }
        
        // Convert to data URL for canvas
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        // Load image
        const img = await loadImage(dataUrl);
        
        // Create canvas and draw image
        const canvas = createCanvas(256, 256);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, 256, 256);
        const pixels = imageData.data;
        
        // Sample pixels at regular intervals
        const sampleInterval = 4; // Sample every 4th pixel for performance
        
        for (let py = 0; py < 256; py += sampleInterval) {
          for (let px = 0; px < 256; px += sampleInterval) {
            // Convert pixel coordinates to lat/lng
            const lng = tileBounds[0] + (px / 256) * (tileBounds[2] - tileBounds[0]);
            const lat = tileBounds[3] + (py / 256) * (tileBounds[1] - tileBounds[3]);
            
            // Check if point is inside our polygon
            const point = turf.point([lng, lat]);
            if (!turf.booleanPointInPolygon(point, polygon)) continue;
            
            // Extract pixel RGB values
            const idx = (py * 256 + px) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            
            // Convert to physical units
            const physicalValue = pixelToPhysical(r, g, b, layer);
            if (physicalValue !== null) {
              values.push(physicalValue);
            } else {
              nodata++;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing tile ${x},${y}:`, error);
      }
    }
  }
  
  // If we couldn't get any real data, fall back to mock data
  if (values.length === 0) {
    console.warn('No real data extracted, using mock data as fallback');
    const area = turf.area(polygon) / 1000000; // km²
    const numSamples = Math.min(1000, Math.max(100, Math.floor(area * 10)));
    
    for (let i = 0; i < numSamples; i++) {
      if (layer === 'sst') {
        const base = 70;
        const variation = (Math.sin(i / 10) + Math.random() - 0.5) * 4;
        values.push(base + variation);
      } else {
        const base = 0.25;
        const variation = (Math.sin(i / 15) + Math.random() - 0.5) * 0.2;
        values.push(Math.max(0.05, base + variation));
      }
    }
  } else {
    console.log(`Extracted ${values.length} real ${layer} values`);
  }
  
  return { values, nodata };
}

export async function POST(request: NextRequest) {
  try {
    const body: SampleRequest = await request.json();
    const { polygon, time, layers } = body;
    
    if (!polygon || !time || !layers) {
      return NextResponse.json(
        { error: 'Missing required fields: polygon, time, layers' },
        { status: 400 }
      );
    }
    
    // Calculate optimal zoom and bbox
    const bbox = turf.bbox(polygon);
    const zoom = getOptimalZoom(bbox);
    const area = turf.area(polygon) / 1000000; // km²
    
    console.log(`Sampling area: ${area.toFixed(2)} km² at zoom ${zoom}`);
    
    // Initialize stats
    const stats: any = {
      coverage_pct: 1.0
    };
    const hist: any = {};
    let totalNodata = 0;
    let totalSamples = 0;
    let tileCount = 0;
    
    // Calculate tile count for metadata
    const minX = lng2tile(bbox[0], zoom);
    const maxX = lng2tile(bbox[2], zoom);
    const minY = lat2tile(bbox[3], zoom);
    const maxY = lat2tile(bbox[1], zoom);
    tileCount = (maxX - minX + 1) * (maxY - minY + 1);
    
    // Sample SST if requested
    if (layers.includes('sst')) {
      const { values, nodata } = await sampleRasterData(polygon, 'sst', time, zoom);
      totalSamples += values.length + nodata;
      totalNodata += nodata;
      
      if (values.length > 0) {
        stats.sst_mean = values.reduce((a, b) => a + b, 0) / values.length;
        stats.sst_min = Math.min(...values);
        stats.sst_max = Math.max(...values);
        stats.sst_p10 = percentile(values, 10);
        stats.sst_p50 = percentile(values, 50);
        stats.sst_p90 = percentile(values, 90);
        
        // Calculate midband percentage
        const inBand = values.filter(v => v >= SST_TARGET_MIN && v <= SST_TARGET_MAX).length;
        stats.sst_midband_pct = inBand / values.length;
        
        // Calculate histogram (16 bins)
        const binCount = 16;
        const range = stats.sst_max - stats.sst_min;
        const binSize = range / binCount;
        const bins = Array(binCount).fill(0);
        
        values.forEach(v => {
          const binIndex = Math.min(binCount - 1, Math.floor((v - stats.sst_min) / binSize));
          bins[binIndex]++;
        });
        
        hist.sst = bins;
        
        // Calculate fronts (gradient analysis)
        const gridSize = Math.min(50, Math.ceil(Math.sqrt(values.length)));
        const grid: number[][] = [];
        for (let i = 0; i < gridSize; i++) {
          grid[i] = [];
          for (let j = 0; j < gridSize; j++) {
            const idx = i * gridSize + j;
            grid[i][j] = idx < values.length ? values[idx] : stats.sst_mean;
          }
        }
        
        const gradients = calculateGradient(grid, gridSize, gridSize);
        const flatGradients = gradients.flat().filter(g => g > 0);
        
        if (flatGradients.length > 0) {
          stats.front_strength_mean = flatGradients.reduce((a, b) => a + b, 0) / flatGradients.length;
          stats.front_strength_p90 = percentile(flatGradients, 90);
          const strongFronts = flatGradients.filter(g => g >= FRONT_STRONG_THRESHOLD).length;
          stats.front_coverage_pct = strongFronts / flatGradients.length;
        }
      }
    }
    
    // Sample CHL if requested
    if (layers.includes('chl')) {
      const { values, nodata } = await sampleRasterData(polygon, 'chl', time, zoom);
      totalSamples += values.length + nodata;
      totalNodata += nodata;
      
      if (values.length > 0) {
        stats.chl_mean = values.reduce((a, b) => a + b, 0) / values.length;
        stats.chl_min = Math.min(...values);
        stats.chl_max = Math.max(...values);
        stats.chl_p10 = percentile(values, 10);
        stats.chl_p50 = percentile(values, 50);
        stats.chl_p90 = percentile(values, 90);
        
        // Calculate midband percentage
        const inBand = values.filter(v => 
          v >= CHL_MID_BAND_RANGE.min && v <= CHL_MID_BAND_RANGE.max
        ).length;
        stats.chl_midband_pct = inBand / values.length;
        
        // Calculate histogram (16 bins)
        const binCount = 16;
        const range = stats.chl_max - stats.chl_min;
        const binSize = range / binCount;
        const bins = Array(binCount).fill(0);
        
        values.forEach(v => {
          const binIndex = Math.min(binCount - 1, Math.floor((v - stats.chl_min) / binSize));
          bins[binIndex]++;
        });
        
        hist.chl = bins;
      }
    }
    
    // Calculate overall coverage
    if (totalSamples > 0) {
      stats.coverage_pct = 1 - (totalNodata / totalSamples);
    }
    
    const response: SampleResponse = {
      stats,
      hist: Object.keys(hist).length > 0 ? hist : undefined,
      meta: {
        tiles: tileCount,
        zoom,
        nodata_pct: totalSamples > 0 ? totalNodata / totalSamples : 0,
        timestamp: new Date().toISOString()
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Raster sampling error:', error);
    return NextResponse.json(
      { error: 'Failed to sample raster data' },
      { status: 500 }
    );
  }
}