import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { INLETS } from '@/lib/inlets';

/**
 * Get the GeoJSON polygon for a specific inlet
 */
export function getInletPolygon(inletId: string): GeoJSON.Polygon | GeoJSON.MultiPolygon | null {
  if (!inletId || inletId === 'overview') return null;
  
  const inlet = INLETS.find(i => i.id === inletId);
  if (!inlet?.geometry) return null;
  
  return inlet.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
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
