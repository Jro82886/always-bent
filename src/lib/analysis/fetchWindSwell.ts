import type { WindStats, SwellStats } from './types';
import { getInletById } from '@/lib/inlets';

/**
 * Fetch wind/swell data from Stormio via our weather API
 * Uses the inlet associated with the polygon, or falls back to nearest inlet
 */
export async function fetchWindSwell(polygon: GeoJSON.Polygon, inletId?: string): Promise<{
  wind: WindStats | null;
  swell: SwellStats | null;
}> {
  try {
    // Use provided inlet or default to overview
    const inlet = inletId || 'overview';
    
    // Call our weather API which integrates with Stormio
    const response = await fetch(`/api/weather?inlet=${inlet}`);
    
    if (!response.ok) {
      console.error('[fetchWindSwell] Weather API error:', response.status);
      return { wind: null, swell: null };
    }
    
    const data = await response.json();
    
    // Extract wind and swell from the weather response
    const wind: WindStats = {
      speed_kn: data.wind?.speed || null,
      direction_deg: data.wind?.direction || null
    };
    
    const swell: SwellStats = {
      height_ft: data.swellHeight || null,
      period_s: data.swellPeriod || null,
      direction_deg: data.swellDirection || null
    };
    
    return { wind, swell };
  } catch (e) {
    console.error('[fetchWindSwell] fail', e);
    return { wind: null, swell: null };
  }
}
