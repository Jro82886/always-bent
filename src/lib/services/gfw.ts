/**
 * Global Fishing Watch API Integration
 * Provides commercial vessel AIS data for analysis
 * API Version: v3
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

interface GFWSearchResponse {
  total: number;
  limit: number;
  offset: number;
  entries: Array<{
    id: string;
    mmsi: string;
    shipname?: string;
    flag?: string;
    geartype?: string;
    vesselType?: string;
    firstTransmissionDate?: string;
    lastTransmissionDate?: string;
    dataset?: string;
  }>;
}

interface GFWEventsResponse {
  total: number;
  entries: Array<{
    id: string;
    type: string;
    start: string;
    end: string;
    position: {
      lat: number;
      lon: number;
    };
    vessel: {
      id: string;
      name?: string;
      ssvid: string;
      flag?: string;
    };
    fishing?: {
      totalDistanceKm: number;
      averageSpeedKnots: number;
    };
  }>;
}

const GFW_API_TOKEN = process.env.NEXT_PUBLIC_GFW_API_TOKEN;
const GFW_API_URL = 'https://gateway.api.globalfishingwatch.org/v3';

/**
 * Search for vessels in a specific area using GFW API v3
 */
export async function searchGFWVesselsInArea(
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
    // First, search for fishing vessels in the area
    const searchParams = new URLSearchParams({
      'datasets': 'public-global-fishing-vessels:latest,public-global-carrier-vessels:latest',
      'limit': '50',
      'offset': '0'
    });

    const searchResponse = await fetch(`${GFW_API_URL}/vessels/search?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${GFW_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      console.error('GFW search error:', searchResponse.status);
      return getMockGFWData(bounds);
    }

    const searchData: GFWSearchResponse = await searchResponse.json();
    const vessels: GFWVessel[] = [];

    // For each vessel found, get their fishing events in the area
    for (const vessel of searchData.entries.slice(0, 10)) { // Limit to 10 vessels for performance
      const events = await getVesselFishingEvents(
        vessel.id,
        startDate,
        endDate,
        bounds
      );
      
      if (events.length > 0) {
        vessels.push({
          id: vessel.id,
          mmsi: vessel.mmsi,
          name: vessel.shipname,
          flag: vessel.flag,
          type: vessel.geartype || vessel.vesselType || 'Commercial',
          positions: events.map(e => ({
            lat: e.position.lat,
            lon: e.position.lon,
            timestamp: e.start,
            speed: e.fishing?.averageSpeedKnots
          }))
        });
      }
    }

    return vessels.length > 0 ? vessels : getMockGFWData(bounds);
  } catch (error) {
    console.error('Failed to fetch GFW data:', error);
    return getMockGFWData(bounds);
  }
}

/**
 * Get fishing events for a specific vessel using GFW Events API
 */
async function getVesselFishingEvents(
  vesselId: string,
  startDate: string,
  endDate: string,
  bounds: [number, number, number, number]
): Promise<any[]> {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  
  try {
    const response = await fetch(`${GFW_API_URL}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GFW_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        datasets: ['public-global-fishing-events:latest'],
        vessels: [vesselId],
        startDate: startDate.split('T')[0],
        endDate: endDate.split('T')[0],
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [minLng, minLat],
            [maxLng, minLat],
            [maxLng, maxLat],
            [minLng, maxLat],
            [minLng, minLat]
          ]]
        }
      })
    });

    if (!response.ok) {
      return [];
    }

    const data: GFWEventsResponse = await response.json();
    return data.entries || [];
  } catch (error) {
    console.error('Failed to fetch vessel events:', error);
    return [];
  }
}

/**
 * Get commercial vessel tracks within a bounding box
 * This is the main function to call from the track analyzer
 */
export async function getGFWVesselsInArea(
  bounds: [number, number, number, number],
  startDate: string,
  endDate: string
): Promise<GFWVessel[]> {
  // Use the search function which handles the v3 API properly
  return searchGFWVesselsInArea(bounds, startDate, endDate);
}

/**
 * Get mock GFW data for development/fallback
 */
function getMockGFWData(bounds: [number, number, number, number]): GFWVessel[] {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  
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