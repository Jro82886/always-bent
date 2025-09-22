import { getInletColor } from '@/lib/style/fleetColors';

export interface OnlineVessel {
  vessel_id: string;
  name: string;
  inlet_id: string;
  last_seen: string;
  speed: number;
  heading: number;
  lat: number;
  lon: number;
  has_report: boolean;
  latest_report: {
    id: string;
    type: 'bite' | 'snip';
    created_at: string;
    species: string[];
    summary: string;
  } | null;
}

export interface VesselTrail {
  vessel_id: string;
  hours: number;
  points: Array<{
    t: string;
    lat: number;
    lon: number;
  }>;
}

// Cache for vessel trails
const trailCache = new Map<string, { data: VesselTrail; timestamp: number }>();
const TRAIL_CACHE_DURATION = 60 * 1000; // 60 seconds

/**
 * Fetch online vessels for a specific inlet
 */
export async function fetchOnlineVessels(inletId: string): Promise<OnlineVessel[]> {
  try {
    const response = await fetch(`/api/fleet/online?inlet_id=${inletId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch online vessels: ${response.statusText}`);
    }
    
    const vessels: OnlineVessel[] = await response.json();
    return vessels;
  } catch (error) {
    console.error('Error fetching online vessels:', error);
    return [];
  }
}

/**
 * Fetch trail for a specific vessel with caching
 */
export async function fetchVesselTrail(vesselId: string, hours: number = 12): Promise<VesselTrail | null> {
  const cacheKey = `${vesselId}-${hours}`;
  const cached = trailCache.get(cacheKey);
  
  // Return cached data if still fresh
  if (cached && Date.now() - cached.timestamp < TRAIL_CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const response = await fetch(`/api/fleet/trail?vessel_id=${vesselId}&hours=${hours}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vessel trail: ${response.statusText}`);
    }
    
    const trail: VesselTrail = await response.json();
    
    // Cache the result
    trailCache.set(cacheKey, { data: trail, timestamp: Date.now() });
    
    // Clean up old cache entries
    if (trailCache.size > 8) {
      const oldestKey = Array.from(trailCache.keys())[0];
      trailCache.delete(oldestKey);
    }
    
    return trail;
  } catch (error) {
    console.error('Error fetching vessel trail:', error);
    return null;
  }
}

/**
 * Convert online vessels to GeoJSON for map rendering
 */
export function onlineVesselsToGeoJSON(vessels: OnlineVessel[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: vessels.map(vessel => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [vessel.lon, vessel.lat]
      },
      properties: {
        id: vessel.vessel_id,
        name: vessel.name,
        inlet_id: vessel.inlet_id,
        color: getInletColor(vessel.inlet_id),
        speed: vessel.speed,
        heading: vessel.heading,
        last_seen: vessel.last_seen,
        has_report: vessel.has_report,
        latest_report: vessel.latest_report
      }
    }))
  };
}

/**
 * Convert vessel trail to GeoJSON LineString
 */
export function vesselTrailToGeoJSON(trail: VesselTrail): GeoJSON.Feature {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: trail.points.map(p => [p.lon, p.lat])
    },
    properties: {
      vessel_id: trail.vessel_id,
      hours: trail.hours,
      point_count: trail.points.length
    }
  };
}
