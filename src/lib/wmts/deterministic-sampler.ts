/**
 * Deterministic WMTS Sampler
 * Ensures stable, repeatable results for the same polygon + time
 */

import * as turf from '@turf/turf';
import crypto from 'crypto';

// Configuration
const GRID_SIZE = 16; // 16x16 = 256 points max
const SST_TARGET_KM = 2;
const CHL_TARGET_KM = 1;
const SST_FIXED_ZOOM = 6;
const CHL_FIXED_ZOOM = 7;
const MAX_CONCURRENT = 8;
const REQUEST_TIMEOUT_MS = 12000;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Nodata values to filter
const NODATA_VALUES = new Set([-32768, -9999, 255]);
const SST_VALID_RANGE = { min: -2, max: 40 }; // Celsius
const CHL_VALID_RANGE = { min: 0.001, max: 100 }; // mg/m³

// Simple in-memory cache
const cache = new Map<string, { data: any; expires: number }>();

/**
 * Generate deterministic sampling grid
 */
export function generateDeterministicGrid(
  polygon: GeoJSON.Feature<GeoJSON.Polygon> | GeoJSON.Polygon,
  seed?: string
): [number, number][] {
  // Ensure we have a Feature
  const feature = polygon.type === 'Polygon' 
    ? turf.polygon(polygon.coordinates)
    : polygon;
    
  const bbox = turf.bbox(feature);
  const [west, south, east, north] = bbox;
  
  const points: [number, number][] = [];
  
  // Generate fixed 16x16 grid
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      // Calculate position (no randomness for now - pure grid)
      const x = (i + 0.5) / GRID_SIZE;
      const y = (j + 0.5) / GRID_SIZE;
      
      const lon = west + (east - west) * x;
      const lat = south + (north - south) * y;
      
      // Check if point is inside polygon
      const pt = turf.point([lon, lat]);
      if (turf.booleanPointInPolygon(pt, feature)) {
        points.push([lon, lat]);
      }
    }
  }
  
  return points;
}

/**
 * Get fixed zoom level for layer (viewport-independent)
 */
export function getFixedZoom(layer: 'sst' | 'chl'): number {
  return layer === 'sst' ? SST_FIXED_ZOOM : CHL_FIXED_ZOOM;
}

/**
 * Check if value is valid (not nodata)
 */
export function isValidValue(value: number | null | undefined, layer: 'sst' | 'chl'): boolean {
  if (value === null || value === undefined || isNaN(value)) {
    return false;
  }
  
  // Check known nodata values
  if (NODATA_VALUES.has(value)) {
    return false;
  }
  
  // Check physical range
  if (layer === 'sst') {
    // Value should be in Celsius after conversion
    return value >= SST_VALID_RANGE.min && value <= SST_VALID_RANGE.max;
  } else {
    return value >= CHL_VALID_RANGE.min && value <= CHL_VALID_RANGE.max;
  }
}

/**
 * Calculate robust gradient (p90 - p10)
 */
export function calculateRobustGradient(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const p10Index = Math.floor(values.length * 0.1);
  const p90Index = Math.floor(values.length * 0.9);
  
  const p10 = sorted[p10Index] || sorted[0];
  const p90 = sorted[p90Index] || sorted[sorted.length - 1];
  
  return p90 - p10;
}

/**
 * Generate cache key
 */
export function getCacheKey(
  layer: 'sst' | 'chl',
  timeISO: string,
  polygon: GeoJSON.Feature<GeoJSON.Polygon> | GeoJSON.Polygon
): string {
  // Create stable hash of polygon
  const polyString = JSON.stringify(
    polygon.type === 'Polygon' ? polygon.coordinates : polygon.geometry?.coordinates
  );
  const polyHash = crypto.createHash('md5').update(polyString).digest('hex').substring(0, 8);
  
  return `${layer}|${timeISO}|${polyHash}|wmts|16`;
}

/**
 * Get from cache if valid
 */
export function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    console.log(`[SAMPLE] Cache hit for ${key}`);
    return cached.data;
  }
  if (cached) {
    cache.delete(key); // Remove expired entry
  }
  return null;
}

/**
 * Store in cache
 */
export function storeInCache(key: string, data: any): void {
  cache.set(key, {
    data,
    expires: Date.now() + CACHE_TTL_MS
  });
  
  // Clean old entries (simple cleanup)
  if (cache.size > 100) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (v.expires < now) {
        cache.delete(k);
      }
    }
  }
}

/**
 * Process values in batches with concurrency limit
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R | null>,
  maxConcurrent: number = MAX_CONCURRENT
): Promise<(R | null)[]> {
  const results: (R | null)[] = [];
  
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(item => 
        processor(item).catch(err => {
          console.error('[SAMPLE] Batch processing error:', err);
          return null;
        })
      )
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Log sampling operation
 */
export function logSampling(
  layer: string,
  timeISO: string,
  polyHash: string,
  zoom: number,
  totalPoints: number,
  stats: any
): void {
  const { n_valid = 0, n_nodata = 0, mean, min, max, gradient } = stats;
  
  console.log(
    `[SAMPLE] layer=${layer} time=${timeISO} polyHash=${polyHash} ` +
    `zoom=${zoom} points=${totalPoints} n_valid=${n_valid} n_nodata=${n_nodata} ` +
    `min=${min?.toFixed(2) || 'n/a'} mean=${mean?.toFixed(2) || 'n/a'} ` +
    `max=${max?.toFixed(2) || 'n/a'} gradient=${gradient?.toFixed(2) || 'n/a'}`
  );
}
