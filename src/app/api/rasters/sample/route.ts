import { NextRequest, NextResponse } from 'next/server';
import * as turf from '@turf/turf';
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

// Helper to determine zoom level based on polygon size
function getOptimalZoom(bbox: number[]): number {
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  const maxDim = Math.max(width, height);
  
  // Rough zoom calculation
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

// Mock sampler for development (replace with real tile fetching)
async function sampleRasterData(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  layer: 'sst' | 'chl',
  time: string,
  zoom: number
): Promise<{ values: number[]; nodata: number }> {
  // This is a placeholder - in production, this would:
  // 1. Calculate which tiles overlap the polygon
  // 2. Fetch tiles from /api/tiles/sst or /api/tiles/chl
  // 3. Extract pixel values within the polygon
  // 4. Return the actual values
  
  const bbox = turf.bbox(polygon);
  const area = turf.area(polygon) / 1000000; // km²
  const numSamples = Math.min(1000, Math.max(100, Math.floor(area * 10)));
  
  // Generate mock data based on layer
  const values: number[] = [];
  let nodata = 0;
  
  for (let i = 0; i < numSamples; i++) {
    // Simulate some nodata pixels
    if (Math.random() < 0.05) {
      nodata++;
      continue;
    }
    
    if (layer === 'sst') {
      // Generate SST values around 68-72°F with some variation
      const base = 70;
      const variation = (Math.sin(i / 10) + Math.random() - 0.5) * 4;
      values.push(base + variation);
    } else {
      // Generate CHL values 0.1-0.5 mg/m³
      const base = 0.25;
      const variation = (Math.sin(i / 15) + Math.random() - 0.5) * 0.2;
      values.push(Math.max(0.05, base + variation));
    }
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
    
    // Initialize stats
    const stats: any = {
      coverage_pct: 1.0
    };
    const hist: any = {};
    let totalNodata = 0;
    let totalSamples = 0;
    
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
        // Simplified: create a grid and calculate gradients
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
        tiles: Math.ceil(area / 100), // Rough estimate
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
