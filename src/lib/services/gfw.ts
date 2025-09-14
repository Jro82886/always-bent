/**
 * Global Fishing Watch API Integration
 * Provides commercial vessel AIS data for analysis
 */

interface GFWVessel {
  id: string;
  mmsi: string;
  name?: string;
  flag?: string;
  type?: string;
  length?: number;
  tonnage?: number;
  positions: Array<{
    lat: number;
    lon: number;
    timestamp: string;
    speed?: number;
    course?: number;
  }>;
}

interface GFWApiResponse {
  entries: Array<{
    id: string;
    vessel: {
      mmsi: string;
      name?: string;
      flag?: string;
      type?: string;
    };
    positions: Array<{
      lat: number;
      lon: number;
      timestamp: string;
      speed?: number;
      course?: number;
    }>;
  }>;
}

const GFW_API_TOKEN = process.env.NEXT_PUBLIC_GFW_API_TOKEN;
const GFW_API_URL = process.env.GFW_API_URL || 'https://gateway.api.globalfishingwatch.org/v3';

/**
 * Get commercial vessel tracks within a bounding box
 * @param bounds [minLng, minLat, maxLng, maxLat]
 * @param startDate ISO date string
 * @param endDate ISO date string
 */
export async function getGFWVesselsInArea(
  bounds: [number, number, number, number],
  startDate: string,
  endDate: string
): Promise<GFWVessel[]> {
  if (!GFW_API_TOKEN) {
    console.warn('GFW API token not configured, returning mock data');
    return getMockGFWData(bounds);
  }

  const [minLng, minLat, maxLng, maxLat] = bounds;
  
  try {
    // GFW API v3 vessel tracks endpoint
    const params = new URLSearchParams({
      'start-date': startDate,
      'end-date': endDate,
      'geojson': JSON.stringify({
        type: 'Polygon',
        coordinates: [[
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat]
        ]]
      }),
      'datasets': 'public-global-fishing-vessels:v3.0',
      'limit': '50' // Limit for performance
    });

    const response = await fetch(`${GFW_API_URL}/vessels/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${GFW_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('GFW API error:', response.status, response.statusText);
      return getMockGFWData(bounds);
    }

    const data: GFWApiResponse = await response.json();
    
    // Transform to our format
    return data.entries.map(entry => ({
      id: entry.id,
      mmsi: entry.vessel.mmsi,
      name: entry.vessel.name,
      flag: entry.vessel.flag,
      type: entry.vessel.type,
      positions: entry.positions || []
    }));
  } catch (error) {
    console.error('Failed to fetch GFW data:', error);
    return getMockGFWData(bounds);
  }
}

/**
 * Get mock GFW data for development/fallback
 */
function getMockGFWData(bounds: [number, number, number, number]): GFWVessel[] {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  
  // Generate some mock commercial vessels
  const vessels: GFWVessel[] = [];
  const vesselTypes = ['Trawler', 'Longliner', 'Purse Seiner', 'Cargo', 'Tanker'];
  const flags = ['USA', 'CAN', 'MEX', 'PAN', 'NOR'];
  
  for (let i = 0; i < 3; i++) {
    const positions = [];
    const startLng = minLng + Math.random() * (maxLng - minLng);
    const startLat = minLat + Math.random() * (maxLat - minLat);
    
    // Generate a track with 10-20 points
    const numPoints = 10 + Math.floor(Math.random() * 10);
    for (let j = 0; j < numPoints; j++) {
      const time = new Date();
      time.setHours(time.getHours() - (numPoints - j) * 2);
      
      positions.push({
        lon: startLng + (Math.random() - 0.5) * 0.1 * j,
        lat: startLat + (Math.random() - 0.5) * 0.1 * j,
        timestamp: time.toISOString(),
        speed: 5 + Math.random() * 10,
        course: Math.random() * 360
      });
    }
    
    vessels.push({
      id: `gfw-mock-${i}`,
      mmsi: `${338000000 + i}`,
      name: `Commercial Vessel ${i + 1}`,
      flag: flags[i % flags.length],
      type: vesselTypes[i % vesselTypes.length],
      length: 30 + Math.random() * 70,
      tonnage: 100 + Math.random() * 900,
      positions
    });
  }
  
  return vessels;
}

/**
 * Transform GFW vessel data to our track format
 */
export function transformGFWToTracks(vessels: GFWVessel[]) {
  return vessels.map(vessel => ({
    id: vessel.id,
    type: 'gfw' as const,
    vesselName: vessel.name || `MMSI: ${vessel.mmsi}`,
    vesselType: vessel.type || 'Commercial',
    flag: vessel.flag,
    mmsi: vessel.mmsi,
    coordinates: vessel.positions.map(p => [p.lon, p.lat] as [number, number]),
    timestamps: vessel.positions.map(p => p.timestamp),
    speeds: vessel.positions.map(p => p.speed || 0),
    color: '#FF6B35', // Orange for commercial vessels
    metadata: {
      length: vessel.length,
      tonnage: vessel.tonnage
    }
  }));
}

// Export the GFWVessel type for use in other modules
export type { GFWVessel };
