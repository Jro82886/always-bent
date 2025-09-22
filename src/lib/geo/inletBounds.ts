import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { INLETS } from '@/lib/inlets';
import * as turf from '@turf/turf';

/**
 * Get the GeoJSON polygon for a specific inlet
 * For now, creates a bounding box around the inlet center
 */
export function getInletPolygon(inletId: string): GeoJSON.Polygon | GeoJSON.MultiPolygon | null {
  if (!inletId || inletId === 'overview') return null;
  
  const inlet = INLETS.find(i => i.id === inletId);
  if (!inlet) return null;
  
  // Create a bounding box based on zoom level
  // This is a temporary solution until we have actual inlet geometries
  const center = inlet.center;
  const radiusNm = inlet.zoom < 7 ? 100 : inlet.zoom < 7.5 ? 80 : inlet.zoom < 8 ? 60 : 40;
  const radiusKm = radiusNm * 1.852; // Convert nautical miles to km
  
  // Create a circular buffer around the inlet center
  const point = turf.point(center);
  const buffered = turf.buffer(point, radiusKm, { units: 'kilometers' });
  
  return buffered?.geometry as GeoJSON.Polygon | null;
}

/**
 * Check if a point is inside an inlet's bounds
 */
export function isInsideInlet(lon: number, lat: number, inletId: string): boolean {
  const poly = getInletPolygon(inletId);
  if (!poly) return true; // If no polygon, assume inside (e.g., 'overview' mode)
  
  try {
    return booleanPointInPolygon([lon, lat], poly);
  } catch (error) {
    console.error('Error checking inlet bounds:', error);
    return true; // Fail open for better UX
  }
}
