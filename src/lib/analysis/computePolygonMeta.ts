import type { PolygonMeta } from './types';

/**
 * Compute polygon metadata including centroid, bbox, and area
 */
export function computePolygonMeta(polygon: GeoJSON.Polygon): PolygonMeta {
  // Get coordinates
  const coords = polygon.coordinates[0];
  
  // Calculate centroid (simple average)
  const [lon, lat] = coords.reduce(
    (acc, [x, y]) => [acc[0] + x, acc[1] + y],
    [0, 0]
  ).map(sum => sum / coords.length);
  
  // Calculate bounding box
  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  
  coords.forEach(([x, y]) => {
    minLon = Math.min(minLon, x);
    maxLon = Math.max(maxLon, x);
    minLat = Math.min(minLat, y);
    maxLat = Math.max(maxLat, y);
  });
  
  const bbox: [number, number, number, number] = [minLon, minLat, maxLon, maxLat];
  
  // Calculate approximate area (simplified for MVP)
  // Using simple rectangle approximation
  const latDiff = maxLat - minLat;
  const lonDiff = maxLon - minLon;
  
  // Rough conversion to km (at mid-latitude)
  const midLat = (minLat + maxLat) / 2;
  const kmPerDegreeLat = 111; // ~111 km per degree latitude
  const kmPerDegreeLon = 111 * Math.cos(midLat * Math.PI / 180);
  
  const area_sq_km = Math.round(latDiff * kmPerDegreeLat * lonDiff * kmPerDegreeLon * 10) / 10;
  
  return {
    bbox,
    area_sq_km,
    centroid: { lat, lon }
  };
}
