import { getSupabase } from '@/lib/supabaseClient';
import type { TrackPresence } from './types';

/**
 * Clip fleet vessels inside polygon for the last N hours.
 * Returns counts + consecutive days with presence.
 */
export async function clipFleetPresence(
  polygon: GeoJSON.Polygon,
  inletId: string,
  hours = 96
): Promise<TrackPresence> {
  try {
    const supabase = getSupabase();
    
    // For MVP: return stub data
    // TODO: Implement real RPC call to clip_fleet_presence
    
    // Stub response - simulate some fleet presence
    const mockFleetCount = Math.floor(Math.random() * 8);
    const mockDays = mockFleetCount > 0 ? Math.min(Math.floor(Math.random() * 4) + 1, 4) : 0;
    
    return {
      myVesselInArea: false, // TODO: Check user's vessel position
      fleetVessels: mockFleetCount,
      fleetVisitsDays: mockDays,
      gfw: null, // Not using GFW for now
    };
  } catch (e) {
    console.error('[clipFleetPresence] fail', e);
    return {
      myVesselInArea: false,
      fleetVessels: 0,
      fleetVisitsDays: 0,
      gfw: null,
    };
  }
}
