import { NextRequest, NextResponse } from 'next/server';
import * as turf from '@turf/turf';
import { 
  generateDeterministicGrid,
  getFixedZoom,
  isValidValue,
  calculateRobustGradient,
  getCacheKey,
  getFromCache,
  storeInCache,
  processBatch,
  logSampling
} from '@/lib/wmts/deterministic-sampler';
import { lonLat2pixel } from '@/lib/wmts/coordinates';
import { WMTS_LAYERS, buildGetFeatureInfoUrl } from '@/lib/wmts/layers';
import crypto from 'crypto';

// Types
interface SampleRequest {
  polygon: GeoJSON.Feature<GeoJSON.Polygon> | GeoJSON.Polygon;
  timeISO: string; // ISO date  
  layers: ('sst' | 'chl')[];
}

interface LayerStats {
  mean: number;
  min: number;
  max: number;
  gradient: number;
  n_valid: number;
  n_nodata: number;
  zoom_used: number;
  tiles_touched: number;
}

interface SampleResponse {
  ok: boolean;
  stats: {
    sst?: {
      mean_f: number;
      min_f: number;
      max_f: number;
      gradient_f: number;
      n_valid: number;
      n_nodata: number;
      zoom_used: number;
      tiles_touched: number;
    } | null;
    chl?: LayerStats | null;
  };
  error?: string;
}

// Get auth credentials
const COPERNICUS_USER = process.env.COPERNICUS_USER || '';
const COPERNICUS_PASS = process.env.COPERNICUS_PASS || '';

/**
 * Fetch single pixel value from WMTS
 */
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
    
    // Add timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${COPERNICUS_USER}:${COPERNICUS_PASS}`).toString('base64'),
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      // Parse response - structure varies by layer
      if (data.features && data.features.length > 0) {
        const value = data.features[0].properties?.value || 
                     data.features[0].properties?.[layer.variable];
        
        if (typeof value === 'number') {
          // Apply conversion (e.g., Kelvin to Celsius for SST)
          const converted = layer.conversionFn(value);
          
          // For SST, we want Celsius for validation, then convert to F
          const layerType = layer.id as 'sst' | 'chl';
          
          if (layerType === 'sst') {
            // Converted is already in Fahrenheit, convert back to C for validation
            const celsius = (converted - 32) * 5/9;
            if (isValidValue(celsius, 'sst')) {
              return converted; // Return Fahrenheit
            }
          } else {
            if (isValidValue(converted, 'chl')) {
              return converted;
            }
          }
        }
      }
      
      return null;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        console.error('[SAMPLE] Request timeout');
      }
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Sample a layer across the polygon
 */
async function sampleLayer(
  layer: 'sst' | 'chl',
  polygon: GeoJSON.Feature<GeoJSON.Polygon> | GeoJSON.Polygon,
  timeISO: string
): Promise<LayerStats | null> {
  const wmtsLayer = layer === 'sst' ? WMTS_LAYERS.SST : WMTS_LAYERS.CHL;
  const zoom = getFixedZoom(layer);
  
  // Generate deterministic grid
  const points = generateDeterministicGrid(polygon);
  
  if (points.length === 0) {
    return null;
  }
  
  // Track unique tiles
  const tilesSet = new Set<string>();
  
  // Process points with concurrency limit
  const values: number[] = [];
  let nodata = 0;
  
  // Process in batches
  const results = await processBatch(
    points,
    async ([lon, lat]) => {
      // Track tile
      const { tileCol, tileRow } = lonLat2pixel(lon, lat, zoom);
      tilesSet.add(`${tileCol},${tileRow}`);
      
      // Convert ISO to YYYY-MM-DD for Copernicus WMTS
      const timeDate = timeISO.split('T')[0]; // Extract YYYY-MM-DD
      return fetchPixelValue(wmtsLayer, lon, lat, zoom, timeDate);
    },
    8 // max concurrent
  );
  
  // Collect valid values
  for (const value of results) {
    if (value !== null) {
      values.push(value);
    } else {
      nodata++;
    }
  }
  
  if (values.length === 0) {
    return null;
  }
  
  // Calculate stats
  const stats: LayerStats = {
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    gradient: calculateRobustGradient(values),
    n_valid: values.length,
    n_nodata: nodata,
    zoom_used: zoom,
    tiles_touched: tilesSet.size
  };
  
  return stats;
}

export async function POST(request: NextRequest) {
  try {
    const body: SampleRequest = await request.json();
    const { polygon, timeISO, layers } = body;
    
    if (!polygon || !timeISO || !layers) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Missing required fields: polygon, timeISO, layers' 
        },
        { status: 400 }
      );
    }
    
    // Check if we have Copernicus credentials
    if (!COPERNICUS_USER || !COPERNICUS_PASS) {
      console.error('[SAMPLE] Copernicus credentials not configured');
      return NextResponse.json({
        ok: false,
        error: 'Ocean data service not configured',
        stats: {
          sst: null,
          chl: null
        }
      }, { status: 503 });
    }
    
    const response: SampleResponse = {
      ok: true,
      stats: {}
    };
    
    // Generate poly hash for logging
    const polyString = JSON.stringify(
      polygon.type === 'Polygon' ? polygon.coordinates : polygon.geometry?.coordinates
    );
    const polyHash = crypto.createHash('md5').update(polyString).digest('hex').substring(0, 8);
    
    // Process each requested layer
    for (const layer of layers) {
      // Check cache first
      const cacheKey = getCacheKey(layer, timeISO, polygon);
      const cached = getFromCache(cacheKey);
      
      if (cached) {
        if (layer === 'sst') {
          response.stats.sst = cached;
        } else {
          response.stats.chl = cached;
        }
        continue;
      }
      
      // Sample the layer
      console.log(`[SAMPLE] Starting ${layer} sampling for time=${timeISO} polyHash=${polyHash}`);
      const stats = await sampleLayer(layer, polygon, timeISO);
      
      if (stats) {
        // Format response based on layer
        if (layer === 'sst') {
          const sstResponse = {
            mean_f: stats.mean,
            min_f: stats.min,
            max_f: stats.max,
            gradient_f: stats.gradient,
            n_valid: stats.n_valid,
            n_nodata: stats.n_nodata,
            zoom_used: stats.zoom_used,
            tiles_touched: stats.tiles_touched
          };
          response.stats.sst = sstResponse;
          storeInCache(cacheKey, sstResponse);
        } else {
          response.stats.chl = stats;
          storeInCache(cacheKey, stats);
        }
        
        // Log the operation
        logSampling(
          layer,
          timeISO,
          polyHash,
          stats.zoom_used,
          stats.n_valid + stats.n_nodata,
          stats
        );
      } else {
        // No valid data
        if (layer === 'sst') {
          response.stats.sst = null;
        } else {
          response.stats.chl = null;
        }
        
        console.log(`[SAMPLE] No valid data for ${layer} time=${timeISO} polyHash=${polyHash}`);
      }
    }
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('[SAMPLE] Error:', error);
    return NextResponse.json(
      { 
        ok: false,
        error: 'Failed to sample raster data',
        stats: {}
      },
      { status: 500 }
    );
  }
}
