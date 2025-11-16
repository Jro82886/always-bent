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

// Runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 30; // Limit to 30 seconds for better UX

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
  p10: number;
  p50: number;
  p90: number;
  stddev: number;
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
  requested_at?: string;
  req_id?: string;
  error?: string;
}

// Get auth credentials
const COPERNICUS_USER = process.env.COPERNICUS_USER || '';
const COPERNICUS_PASS = process.env.COPERNICUS_PASS || '';

// Log credential status (not the actual values)
console.log('[SAMPLE] Copernicus auth status:', {
  hasUser: !!COPERNICUS_USER,
  hasPass: !!COPERNICUS_PASS,
  userLength: COPERNICUS_USER.length,
  passLength: COPERNICUS_PASS.length
});

/**
 * Fetch single pixel value from WMTS with retry logic
 */
async function fetchPixelValue(
  layer: typeof WMTS_LAYERS.SST | typeof WMTS_LAYERS.CHL,
  lon: number,
  lat: number,
  zoom: number,
  time: string,
  retryCount: number = 0
): Promise<number | null> {
  const maxRetries = 2; // Allow up to 2 retries for timeouts

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

    // Shorter timeout on first attempt, longer on retries
    const timeoutMs = retryCount === 0 ? 3000 : 5000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
        // For 400 errors (bad request), silently return null as this often means no data at this pixel
        if (response.status === 400) {
          // This is common for CHL when sampling land or areas with no data
          return null;
        }

        console.error(`[SAMPLE][ERR] layer=${layer.id} status=${response.status} reason="${response.statusText}"`);

        // Return specific error for different status codes
        if (response.status === 401 || response.status === 403) {
          console.error('[SAMPLE] 401/403 Auth error - Check COPERNICUS_USER and COPERNICUS_PASS environment variables');
          console.error(`[SAMPLE] URL: ${url.replace(/\/\/[^@]+@/, '//***:***@')}`); // Log URL with redacted auth
          throw new Error('AUTH_ERROR');
        } else if (response.status === 404 || response.status === 204) {
          throw new Error('DATA_NOT_PUBLISHED');
        } else if (response.status >= 500) {
          throw new Error('UPSTREAM_ERROR');
        }

        const errorText = await response.text();
        console.error(`[SAMPLE] Error body: ${errorText.substring(0, 200)}`);
        return null;
      }

      const data = await response.json();

      // Parse response - structure varies by layer
      if (data.features && data.features.length > 0) {
        const value = data.features[0].properties?.value ||
                     data.features[0].properties?.[layer.variable];

        if (typeof value === 'number') {
          const layerType = layer.id as 'sst' | 'chl';

          if (layerType === 'sst') {
            // Value from Copernicus is in Kelvin, validate first
            if (isValidValue(value, 'sst')) {
              // Log successful SST value for debugging
              const fahrenheit = layer.conversionFn(value);
              console.log(`[SAMPLE][DEBUG] SST: ${value}K → ${fahrenheit.toFixed(1)}°F at (${lon.toFixed(4)}, ${lat.toFixed(4)})`);
              // Convert to Fahrenheit for output
              return fahrenheit;
            } else {
              console.log(`[SAMPLE][DEBUG] Invalid SST value: ${value}K at (${lon.toFixed(4)}, ${lat.toFixed(4)})`);
            }
          } else {
            // CHL doesn't need conversion
            if (isValidValue(value, 'chl')) {
              return value;
            }
          }
        }
      }

      return null;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        // Retry on timeout if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          console.log(`[SAMPLE] Timeout (attempt ${retryCount + 1}/${maxRetries + 1}), retrying...`);
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchPixelValue(layer, lon, lat, zoom, time, retryCount + 1);
        }
        console.error('[SAMPLE] Request timeout after all retries');
        throw new Error('NETWORK_TIMEOUT');
      }
      throw err; // Re-throw other errors
    }
  } catch (error: any) {
    // Re-throw specific errors for proper handling
    if (error.message === 'AUTH_ERROR' ||
        error.message === 'DATA_NOT_PUBLISHED' ||
        error.message === 'UPSTREAM_ERROR' ||
        error.message === 'NETWORK_TIMEOUT') {
      throw error;
    }
    // Generic error
    throw new Error('TEMPORARY_ERROR');
  }
}

/**
 * Sample a layer across the polygon
 */
async function sampleLayer(
  layer: 'sst' | 'chl',
  polygon: GeoJSON.Feature<GeoJSON.Polygon> | GeoJSON.Polygon,
  timeISO: string
): Promise<LayerStats | { error: string }> {
  try {
    const wmtsLayer = layer === 'sst' ? WMTS_LAYERS.SST : WMTS_LAYERS.CHL;
    const zoom = getFixedZoom(layer);

    // Generate deterministic grid
    const points = generateDeterministicGrid(polygon);

    if (points.length === 0) {
      return { error: 'NO_OCEAN_PIXELS' };
    }

  // Track unique tiles
  const tilesSet = new Set<string>();

  // Process points with concurrency limit
  const values: number[] = [];
  let nodata = 0;

  // Build fallback dates (same strategy as tile endpoint)
  // CHL data often has gaps due to clouds, so try multiple recent dates
  const fallbackDates: string[] = [];
  const baseDate = new Date(timeISO);
  const daysToTry = layer === 'chl' ? 7 : 3; // Try more dates for CHL due to cloud gaps

  for (let daysAgo = 0; daysAgo <= daysToTry; daysAgo++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - daysAgo);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    fallbackDates.push(`${year}-${month}-${day}`);
  }

  console.log(`[SAMPLE] ${layer.toUpperCase()} trying dates: ${fallbackDates.slice(0, 3).join(', ')}...`);

  // Process in batches
  const results = await processBatch(
    points,
    async ([lon, lat]) => {
      // Track tile
      const { tileCol, tileRow } = lonLat2pixel(lon, lat, zoom);
      tilesSet.add(`${tileCol},${tileRow}`);

      // Try multiple dates until we get data
      for (const timeDate of fallbackDates) {
        try {
          const value = await fetchPixelValue(wmtsLayer, lon, lat, zoom, timeDate);
          if (value !== null) {
            return value;
          }
        } catch (err: any) {
          // Continue to next date on errors except AUTH_ERROR
          if (err.message === 'AUTH_ERROR') {
            throw err;
          }
          continue;
        }
      }

      // No data found for any date
      return null;
    },
    16 // increase max concurrent for faster processing
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
    return { error: 'NO_OCEAN_PIXELS' };
  }

  // Check if we have enough valid pixels
  // With reduced grid size, accept fewer pixels
  const minPixels = layer === 'chl' ? 3 : 5;
  if (values.length < minPixels) {
    // For CHL, log but don't error if we have some data
    if (layer === 'chl' && values.length > 0) {
      console.log(`[SAMPLE] CHL has limited data: ${values.length} pixels`);
    } else {
      console.log(`[SAMPLE] Insufficient data: ${values.length} pixels (min: ${minPixels})`);
      return { error: 'NO_OCEAN_PIXELS' };
    }
  }
  
  // Sort values for percentiles
  const sorted = [...values].sort((a, b) => a - b);
  
  // Calculate percentiles
  const getPercentile = (arr: number[], p: number) => {
    const index = Math.ceil(arr.length * p / 100) - 1;
    return arr[Math.max(0, Math.min(index, arr.length - 1))];
  };
  
  // Calculate mean
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Calculate standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stddev = Math.sqrt(variance);
  
  // Calculate stats
  const stats: LayerStats = {
    mean: mean,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p10: getPercentile(sorted, 10),
    p50: getPercentile(sorted, 50),
    p90: getPercentile(sorted, 90),
    stddev: stddev,
    gradient: calculateRobustGradient(values),
    n_valid: values.length,
    n_nodata: nodata,
    zoom_used: zoom,
    tiles_touched: tilesSet.size
  };
  
  return stats;
  } catch (error: any) {
    // Map specific errors to user-friendly error codes
    if (error.message === 'AUTH_ERROR') {
      return { error: 'AUTH_ERROR' };
    } else if (error.message === 'DATA_NOT_PUBLISHED') {
      return { error: 'DATA_NOT_PUBLISHED' };
    } else if (error.message === 'UPSTREAM_ERROR') {
      return { error: 'UPSTREAM_ERROR' };
    } else if (error.message === 'NETWORK_TIMEOUT') {
      return { error: 'NETWORK_TIMEOUT' };
    } else if (error.message === 'NO_OCEAN_PIXELS') {
      return { error: 'NO_OCEAN_PIXELS' };
    } else {
      console.error(`[SAMPLE] Unexpected error for ${layer}:`, error);
      return { error: 'TEMPORARY_ERROR' };
    }
  }
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
      stats: {},
      requested_at: new Date().toISOString(),
    };
    
    // Generate poly hash for logging
    const polyString = JSON.stringify(
      polygon.type === 'Polygon' ? polygon.coordinates : polygon.geometry?.coordinates
    );
    const polyHash = crypto.createHash('md5').update(polyString).digest('hex').substring(0, 8);
    response.req_id = polyHash;
    
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
        // Check if it's an error response
        if ('error' in stats) {
          // Handle error - set null for this layer
          if (layer === 'sst') {
            response.stats.sst = null;
          } else {
            response.stats.chl = null;
          }
          console.error(`[SAMPLE] ${layer} error: ${stats.error}`);
        } else {
          // Format response based on layer
          if (layer === 'sst') {
            const sstResponse = {
              mean_f: stats.mean,
              min_f: stats.min,
              max_f: stats.max,
              p10_f: stats.p10,
              p50_f: stats.p50,
              p90_f: stats.p90,
              stddev_f: stats.stddev,
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
          
          // Success log as specified in brief
          if (layer === 'sst') {
            console.log(`[SAMPLE] layer=sst status=200 pixels=${stats.n_valid} meanF=${stats.mean.toFixed(1)}`);
          } else if (layer === 'chl') {
            console.log(`[SAMPLE] layer=chl status=200 pixels=${stats.n_valid} mean=${stats.mean.toFixed(3)}`);
          }
        }
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
    
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      }
    });
    
  } catch (error: any) {
    console.error('[SAMPLE] Error:', error);
    return new NextResponse(JSON.stringify({ ok: false, error: 'Failed to sample raster data', stats: {} }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      }
    });
  }
}
