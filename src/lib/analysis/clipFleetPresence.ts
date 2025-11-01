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

    // Call the real RPC function
    const { data, error } = await supabase.rpc('clip_fleet_presence', {
      p_polygon_geojson: polygon,
      p_inlet_id: inletId,
      p_hours_back: hours
    });

    if (error) {
      console.error('[clipFleetPresence] RPC error:', error);
      return {
        myVesselInArea: false,
        fleetVessels: 0,
        fleetVisitsDays: 0,
        gfw: null,
      };
    }

    // Return the result from the RPC function
    return {
      myVesselInArea: data.myVesselInArea || false,
      fleetVessels: data.fleetVessels || 0,
      fleetVisitsDays: data.fleetVisitsDays || 0,
      gfw: data.gfw || null,
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
