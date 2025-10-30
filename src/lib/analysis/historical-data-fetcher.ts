/**
 * Historical Data Fetcher
 * Fetches historical SST and CHL data for trend calculation
 */

import * as turf from '@turf/turf';
import { getTemperatureFromColor } from './sst-color-mapping';

export interface HistoricalDataPoint {
  date: Date;
  avgSstF: number;
  avgChlMgM3: number;
  sampleSize: number;
}

/**
 * Fetch historical SST/CHL data for a polygon from past dates
 * Uses Copernicus tile API with historical date parameters
 */
export async function fetchHistoricalData(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  daysAgo: number
): Promise<HistoricalDataPoint | null> {
  try {
    // Calculate historical date
    const historicalDate = new Date();
    historicalDate.setDate(historicalDate.getDate() - daysAgo);
    const dateStr = historicalDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Get polygon centroid and bounds
    const centroid = turf.centroid(polygon).geometry.coordinates;
    const bounds = turf.bbox(polygon);

    // Sample points within polygon for analysis
    const samplePoints = generateSamplePoints(polygon, 20);

    // Fetch historical tile data for each sample point
    const sstValues: number[] = [];
    const chlValues: number[] = [];

    for (const point of samplePoints) {
      // Fetch SST data
      const sstData = await fetchHistoricalTilePixel(
        point[1], // lat
        point[0], // lng
        dateStr,
        'sst'
      );

      if (sstData) {
        const temp = getTemperatureFromColor(sstData.r, sstData.g, sstData.b);
        if (temp && temp.confidence > 0.5) {
          sstValues.push(temp.tempF);
        }
      }

      // Fetch CHL data
      const chlData = await fetchHistoricalTilePixel(
        point[1],
        point[0],
        dateStr,
        'chl'
      );

      if (chlData) {
        // Convert CHL pixel to mg/m³ (simplified)
        const greenness = chlData.g / Math.max(chlData.r, chlData.b, 1);
        const yellowness = Math.min(chlData.r, chlData.g) / 255;

        let mgM3 = 0;
        if (greenness > 1.5) {
          mgM3 = 0.5 + greenness * 2;
        } else if (yellowness > 0.5) {
          mgM3 = 5 + yellowness * 5;
        } else {
          mgM3 = 0.1 + (chlData.b / 255) * 0.4;
        }

        chlValues.push(mgM3);
      }
    }

    // Calculate averages
    if (sstValues.length === 0 && chlValues.length === 0) {
      return null;
    }

    const avgSstF = sstValues.length > 0
      ? sstValues.reduce((a, b) => a + b, 0) / sstValues.length
      : 0;

    const avgChlMgM3 = chlValues.length > 0
      ? chlValues.reduce((a, b) => a + b, 0) / chlValues.length
      : 0;

    return {
      date: historicalDate,
      avgSstF,
      avgChlMgM3,
      sampleSize: Math.max(sstValues.length, chlValues.length)
    };
  } catch (error) {
    console.error(`Failed to fetch historical data for ${daysAgo} days ago:`, error);
    return null;
  }
}

/**
 * Generate sample points within a polygon for data collection
 */
function generateSamplePoints(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  numPoints: number
): [number, number][] {
  const bbox = turf.bbox(polygon);
  const points: [number, number][] = [];

  // Generate grid of points
  const gridSize = Math.ceil(Math.sqrt(numPoints));
  const lonStep = (bbox[2] - bbox[0]) / gridSize;
  const latStep = (bbox[3] - bbox[1]) / gridSize;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lon = bbox[0] + lonStep * (i + 0.5);
      const lat = bbox[1] + latStep * (j + 0.5);
      const point = turf.point([lon, lat]);

      // Check if point is within polygon
      if (turf.booleanPointInPolygon(point, polygon)) {
        points.push([lon, lat]);
      }
    }
  }

  return points.slice(0, numPoints);
}

/**
 * Fetch a single pixel value from historical tile data
 */
async function fetchHistoricalTilePixel(
  lat: number,
  lng: number,
  date: string,
  type: 'sst' | 'chl'
): Promise<{ r: number; g: number; b: number } | null> {
  try {
    // Use our existing tile API with historical date parameter
    const endpoint = type === 'sst' ? '/api/tiles/sst' : '/api/tiles/chl-nasa';

    // Calculate tile coordinates for zoom level 8 (good balance)
    const zoom = 8;
    const { x, y } = latLngToTile(lat, lng, zoom);

    // Fetch tile with historical date
    const url = `${endpoint}/${zoom}/${x}/${y}?time=${date}`;

    // This would need server-side implementation to fetch historical tiles
    // For now, return null to use fallback mock data
    return null;
  } catch (error) {
    console.error('Failed to fetch historical tile pixel:', error);
    return null;
  }
}

/**
 * Convert lat/lng to tile coordinates
 */
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);

  return { x, y };
}

/**
 * Calculate trend from current and historical data
 */
export function calculateTrend(
  current: number,
  historical: number | null
): {
  delta: number;
  trend: 'warming' | 'cooling' | 'stable' | 'greening' | 'clearing';
} {
  if (historical === null || historical === 0) {
    return { delta: 0, trend: 'stable' };
  }

  const delta = current - historical;
  const percentChange = Math.abs(delta / historical);

  // Determine trend based on threshold (5% change)
  if (percentChange < 0.05) {
    return { delta, trend: 'stable' };
  }

  // For temperature
  if (delta > 0) {
    return { delta, trend: 'warming' };
  } else {
    return { delta, trend: 'cooling' };
  }
}

/**
 * Calculate CHL trend
 */
export function calculateChlTrend(
  current: number,
  historical: number | null
): {
  delta: number;
  trend: 'greening' | 'clearing' | 'stable';
} {
  if (historical === null || historical === 0) {
    return { delta: 0, trend: 'stable' };
  }

  const delta = current - historical;
  const percentChange = Math.abs(delta / historical);

  // Determine trend based on threshold (10% change for CHL)
  if (percentChange < 0.1) {
    return { delta, trend: 'stable' };
  }

  if (delta > 0) {
    return { delta, trend: 'greening' };
  } else {
    return { delta, trend: 'clearing' };
  }
}
