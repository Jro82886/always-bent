import { NextRequest, NextResponse } from 'next/server';
import * as turf from '@turf/turf';
import { 
  SST_TARGET_MIN, 
  SST_TARGET_MAX, 
  CHL_MID_BAND_RANGE,
  FRONT_STRONG_THRESHOLD 
} from '@/config/ocean-thresholds';
import { lonLat2pixel, getOptimalZoom } from '@/lib/wmts/coordinates';
import { WMTS_LAYERS, buildGetFeatureInfoUrl } from '@/lib/wmts/layers';

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

// Get auth credentials
const COPERNICUS_USER = process.env.COPERNICUS_USER || '';
const COPERNICUS_PASS = process.env.COPERNICUS_PASS || '';

// Calculate percentile
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Calculate gradient magnitude for front detection
function calculateFrontStrength(values: number[][], gridSize: number): number[][] {
  const gradient: number[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
  
  for (let y = 1; y < gridSize - 1; y++) {
    for (let x = 1; x < gridSize - 1; x++) {
      // Simple gradient calculation
      const dx = Math.abs(values[y][x + 1] - values[y][x - 1]) / 2;
      const dy = Math.abs(values[y + 1][x] - values[y - 1][x]) / 2;
      gradient[y][x] = Math.sqrt(dx * dx + dy * dy);
    }
  }
  
  return gradient;
}

// Generate sampling grid
function generateSamplingGrid(polygon: GeoJSON.Feature<GeoJSON.Polygon>): [number, number][] {
  const area = turf.area(polygon) / 1000000; // km²
  const bbox = turf.bbox(polygon);
  
  // Determine grid size based on area
  let gridSize: number;
  if (area < 50) {
    gridSize = 10; // 100 samples
  } else if (area < 2500) {
    gridSize = 20; // 400 samples
  } else {
    gridSize = 30; // 900 samples max
  }
  
  const points: [number, number][] = [];
  const [west, south, east, north] = bbox;
  
  // Generate regular grid
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lon = west + (east - west) * (i + 0.5) / gridSize;
      const lat = south + (north - south) * (j + 0.5) / gridSize;
      
      // Check if point is inside polygon
      const pt = turf.point([lon, lat]);
      if (turf.booleanPointInPolygon(pt, polygon)) {
        points.push([lon, lat]);
      }
    }
  }
  
  return points;
}

// Fetch value from GetFeatureInfo
async function fetchPixelValue(
  layer: typeof WMTS_LAYERS.SST | typeof WMTS_LAYERS.CHL,
  lon: number,
  lat: number,
  zoom: number,
  time: string
): Promise<number | null> {
  try {
    const { tileCol, tileRow, i, j } = lonLat2pixel(lon, lat, zoom);
    
    const url = buildGetFeatureInfoUrl(
      layer,
      tileCol,
      tileRow,
      i,
      j,
      zoom,
      time,
      { user: COPERNICUS_USER, pass: COPERNICUS_PASS }
    );
    
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${COPERNICUS_USER}:${COPERNICUS_PASS}`).toString('base64'),
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`GetFeatureInfo failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Parse response - structure varies by layer
    // Typical response: { features: [{ properties: { value: 293.15 } }] }
    if (data.features && data.features.length > 0) {
      const value = data.features[0].properties?.value || 
                   data.features[0].properties?.[layer.variable];
      
      if (typeof value === 'number') {
        return layer.conversionFn(value);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching pixel value:', error);
    return null;
  }
}

// Sample multiple points in parallel with rate limiting
async function sampleLayer(
  layer: typeof WMTS_LAYERS.SST | typeof WMTS_LAYERS.CHL,
  points: [number, number][],
  zoom: number,
  time: string
): Promise<{ values: number[]; nodata: number }> {
  const values: number[] = [];
  let nodata = 0;
  
  // Process in batches to avoid overwhelming the server
  const batchSize = 50;
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    
    const promises = batch.map(([lon, lat]) => 
      fetchPixelValue(layer, lon, lat, zoom, time)
    );
    
    const results = await Promise.all(promises);
    
    for (const value of results) {
      if (value !== null) {
        values.push(value);
      } else {
        nodata++;
      }
    }
    
    // Small delay between batches
    if (i + batchSize < points.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
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
    
    // Check if we have Copernicus credentials
    if (!COPERNICUS_USER || !COPERNICUS_PASS) {
      console.error('Copernicus credentials not configured');
      // Return mock data as fallback
      return NextResponse.json({
        stats: {
          coverage_pct: 0.98,
          sst_mean: 70 + Math.random() * 8,
          sst_midband_pct: 0.3 + Math.random() * 0.4,
          chl_mean: 0.1 + Math.random() * 0.3,
          chl_midband_pct: 0.2 + Math.random() * 0.6,
          front_strength_p90: Math.random() * 0.8
        },
        meta: {
          tiles: 0,
          zoom: 0,
          nodata_pct: 0.02,
          timestamp: new Date().toISOString(),
          isMockData: true
        }
      });
    }
    
    // Generate sampling grid
    const samplePoints = generateSamplingGrid(polygon);
    if (samplePoints.length === 0) {
      return NextResponse.json(
        { error: 'No valid sample points within polygon' },
        { status: 400 }
      );
    }
    
    console.log(`Sampling ${samplePoints.length} points for layers:`, layers);
    
    // Determine zoom level
    const bbox = turf.bbox(polygon);
    const zoom = getOptimalZoom(bbox);
    
    // Format time for WMTS (ISO8601 with milliseconds)
    const wmtsTime = new Date(time).toISOString();
    
    // Initialize stats
    const stats: any = {
      coverage_pct: 1.0
    };
    const hist: any = {};
    let totalNodata = 0;
    let totalSamples = 0;
    
    // Sample SST if requested
    if (layers.includes('sst')) {
      console.log('Sampling SST data...');
      const { values, nodata } = await sampleLayer(
        WMTS_LAYERS.SST,
        samplePoints,
        zoom,
        wmtsTime
      );
      
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
        const binSize = range / binCount || 1;
        const bins = Array(binCount).fill(0);
        
        values.forEach(v => {
          const binIndex = Math.min(binCount - 1, Math.floor((v - stats.sst_min) / binSize));
          bins[binIndex]++;
        });
        
        hist.sst = bins;
        
        // Calculate fronts from SST grid
        const gridSize = Math.ceil(Math.sqrt(samplePoints.length));
        const sstGrid: number[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(stats.sst_mean));
        
        // Fill grid with actual values
        samplePoints.forEach((pt, idx) => {
          if (idx < values.length) {
            const row = Math.floor(idx / gridSize);
            const col = idx % gridSize;
            sstGrid[row][col] = values[idx];
          }
        });
        
        const gradients = calculateFrontStrength(sstGrid, gridSize);
        const flatGradients = gradients.flat().filter(g => g > 0);
        
        if (flatGradients.length > 0) {
          stats.front_strength_mean = flatGradients.reduce((a, b) => a + b, 0) / flatGradients.length;
          stats.front_strength_p90 = percentile(flatGradients, 90);
          const strongFronts = flatGradients.filter(g => g >= FRONT_STRONG_THRESHOLD).length;
          stats.front_coverage_pct = strongFronts / flatGradients.length;
        }
        
        console.log(`SST stats: mean=${stats.sst_mean.toFixed(1)}°F, samples=${values.length}`);
      }
    }
    
    // Sample CHL if requested
    if (layers.includes('chl')) {
      console.log('Sampling CHL data...');
      const { values, nodata } = await sampleLayer(
        WMTS_LAYERS.CHL,
        samplePoints,
        zoom,
        wmtsTime
      );
      
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
        
        // Calculate histogram
        const binCount = 16;
        const range = stats.chl_max - stats.chl_min;
        const binSize = range / binCount || 1;
        const bins = Array(binCount).fill(0);
        
        values.forEach(v => {
          const binIndex = Math.min(binCount - 1, Math.floor((v - stats.chl_min) / binSize));
          bins[binIndex]++;
        });
        
        hist.chl = bins;
        
        console.log(`CHL stats: mean=${stats.chl_mean.toFixed(3)} mg/m³, samples=${values.length}`);
      }
    }
    
    // Calculate overall coverage
    if (totalSamples > 0) {
      stats.coverage_pct = 1 - (totalNodata / totalSamples);
    }
    
    // Calculate tile count estimate
    const tileSet = new Set<string>();
    samplePoints.forEach(([lon, lat]) => {
      const { tileCol, tileRow } = lonLat2pixel(lon, lat, zoom);
      tileSet.add(`${tileCol},${tileRow}`);
    });
    
    const response: SampleResponse = {
      stats,
      hist: Object.keys(hist).length > 0 ? hist : undefined,
      meta: {
        tiles: tileSet.size,
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