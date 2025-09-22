import type { WindStats, SwellStats } from './types';

/**
 * For MVP: sample wind/swell at polygon centroid only.
 * Replace with polygon mean later if needed.
 */
export async function fetchWindSwell(polygon: GeoJSON.Polygon): Promise<{
  wind: WindStats | null;
  swell: SwellStats | null;
}> {
  try {
    // Get centroid
    const coords = polygon.coordinates[0];
    const [lon, lat] = coords.reduce(
      (acc, [x, y]) => [acc[0] + x, acc[1] + y],
      [0, 0]
    ).map(sum => sum / coords.length);

    // TODO: Call real weather API with centroid
    // For now return stub data so flow never blocks
    
    return {
      wind: { speed_kn: 12, direction_deg: 135 },
      swell: { height_ft: 4.2, period_s: 9, direction_deg: 90 },
    };
  } catch (e) {
    console.error('[fetchWindSwell] fail', e);
    return { wind: null, swell: null };
  }
}
