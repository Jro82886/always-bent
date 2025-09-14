import * as turf from '@turf/turf';
import { useTrackingStore } from '@/lib/tracking/trackingStore';

export interface VesselActivity {
  userTracks: UserTrack[];
  commercialVessels: CommercialVessel[];
  fishingActivity: FishingActivity;
  hotspots: VesselHotspot[];
}

export interface UserTrack {
  id: string;
  vesselName: string;
  points: [number, number][];
  timestamps: Date[];
  avgSpeed: number;
  timeInArea: number; // minutes
}

export interface CommercialVessel {
  id: string;
  mmsi: string;
  name: string;
  type: string; // fishing, cargo, tanker, etc.
  position: [number, number];
  heading: number;
  speed: number;
  lastSeen: Date;
  flag: string;
}

export interface FishingActivity {
  intensity: 'none' | 'low' | 'medium' | 'high';
  vesselCount: number;
  primaryGear: string; // trawling, longlining, purse seine
  seasonalPattern: string;
}

export interface VesselHotspot {
  center: [number, number];
  radius: number; // nm
  vesselCount: number;
  type: 'fishing' | 'transit' | 'anchored';
}

/**
 * Analyze vessel activity within a snipped area
 */
export async function analyzeVesselActivity(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  map: mapboxgl.Map
): Promise<VesselActivity> {
  const bounds = turf.bbox(polygon);
  
  // Get user tracks from store
  const userTracks = await getUserTracksInArea(polygon);
  
  // Get commercial vessels from GFW or mock data
  const commercialVessels = await getCommercialVesselsInArea(bounds);
  
  // Analyze fishing patterns
  const fishingActivity = analyzeFishingPatterns(commercialVessels);
  
  // Identify vessel hotspots
  const hotspots = identifyVesselHotspots(commercialVessels, userTracks);
  
  return {
    userTracks,
    commercialVessels,
    fishingActivity,
    hotspots
  };
}

/**
 * Get user tracks that pass through the analysis area
 */
async function getUserTracksInArea(polygon: GeoJSON.Feature<GeoJSON.Polygon>): Promise<UserTrack[]> {
  // In production, this would query Supabase for historical tracks
  // For now, return mock data
  
  const mockTracks: UserTrack[] = [
    {
      id: 'track-1',
      vesselName: 'Sea Hunter',
      points: generateMockTrack(polygon, 20),
      timestamps: generateTimestamps(20, new Date(Date.now() - 3600000)),
      avgSpeed: 7.5,
      timeInArea: 45
    },
    {
      id: 'track-2',
      vesselName: 'Blue Marlin',
      points: generateMockTrack(polygon, 15),
      timestamps: generateTimestamps(15, new Date(Date.now() - 7200000)),
      avgSpeed: 6.2,
      timeInArea: 30
    }
  ];
  
  return mockTracks;
}

/**
 * Get commercial vessels from Global Fishing Watch API
 */
async function getCommercialVesselsInArea(bounds: number[]): Promise<CommercialVessel[]> {
  // TODO: Integrate with real GFW API
  // For now, return mock commercial vessels
  
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const mockVessels: CommercialVessel[] = [];
  
  // Generate mock commercial vessels
  for (let i = 0; i < 8; i++) {
    mockVessels.push({
      id: `gfw-${i}`,
      mmsi: `36700${1000 + i}`,
      name: ['FV Atlantic Dream', 'FV Ocean Harvest', 'FV Blue Horizon', 
              'FV Sea Fortune', 'FV Northern Light', 'FV Pacific Star',
              'FV Golden Wave', 'FV Deep Current'][i],
      type: ['trawler', 'longliner', 'purse_seiner', 'trawler', 
             'gillnetter', 'longliner', 'trawler', 'support'][i],
      position: [
        minLng + Math.random() * (maxLng - minLng),
        minLat + Math.random() * (maxLat - minLat)
      ],
      heading: Math.random() * 360,
      speed: 3 + Math.random() * 10,
      lastSeen: new Date(Date.now() - Math.random() * 3600000),
      flag: ['USA', 'CAN', 'USA', 'MEX', 'USA', 'CAN', 'USA', 'PAN'][i]
    });
  }
  
  return mockVessels;
}

/**
 * Analyze fishing patterns from vessel data
 */
function analyzeFishingPatterns(vessels: CommercialVessel[]): FishingActivity {
  const fishingVessels = vessels.filter(v => 
    ['trawler', 'longliner', 'purse_seiner', 'gillnetter'].includes(v.type)
  );
  
  // Determine intensity based on vessel count
  let intensity: FishingActivity['intensity'] = 'none';
  if (fishingVessels.length > 0 && fishingVessels.length <= 2) intensity = 'low';
  else if (fishingVessels.length <= 5) intensity = 'medium';
  else if (fishingVessels.length > 5) intensity = 'high';
  
  // Find most common gear type
  const gearTypes = fishingVessels.map(v => v.type);
  const primaryGear = gearTypes.length > 0 
    ? gearTypes.sort((a, b) => 
        gearTypes.filter(v => v === a).length - gearTypes.filter(v => v === b).length
      )[0]
    : 'none';
  
  return {
    intensity,
    vesselCount: fishingVessels.length,
    primaryGear,
    seasonalPattern: 'Peak season: May-September'
  };
}

/**
 * Identify areas with high vessel concentration
 */
function identifyVesselHotspots(
  commercialVessels: CommercialVessel[],
  userTracks: UserTrack[]
): VesselHotspot[] {
  const hotspots: VesselHotspot[] = [];
  
  // Combine all vessel positions
  const allPositions = [
    ...commercialVessels.map(v => v.position),
    ...userTracks.flatMap(t => t.points)
  ];
  
  if (allPositions.length > 3) {
    // Use k-means clustering to find hotspots
    // For simplicity, just find center of all positions
    const centerLng = allPositions.reduce((sum, p) => sum + p[0], 0) / allPositions.length;
    const centerLat = allPositions.reduce((sum, p) => sum + p[1], 0) / allPositions.length;
    
    hotspots.push({
      center: [centerLng, centerLat],
      radius: 2, // nm
      vesselCount: allPositions.length,
      type: 'fishing'
    });
  }
  
  return hotspots;
}

/**
 * Generate mock track points within polygon area
 */
function generateMockTrack(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  pointCount: number
): [number, number][] {
  const bounds = turf.bbox(polygon);
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const points: [number, number][] = [];
  
  // Start from a random edge
  let currentLng = minLng + Math.random() * (maxLng - minLng);
  let currentLat = minLat + Math.random() * (maxLat - minLat);
  
  for (let i = 0; i < pointCount; i++) {
    points.push([currentLng, currentLat]);
    
    // Move slightly for next point
    currentLng += (Math.random() - 0.5) * 0.005;
    currentLat += (Math.random() - 0.5) * 0.005;
    
    // Keep within bounds
    currentLng = Math.max(minLng, Math.min(maxLng, currentLng));
    currentLat = Math.max(minLat, Math.min(maxLat, currentLat));
  }
  
  return points;
}

/**
 * Generate timestamps for track points
 */
function generateTimestamps(count: number, startTime: Date): Date[] {
  const timestamps: Date[] = [];
  const intervalMs = 60000; // 1 minute between points
  
  for (let i = 0; i < count; i++) {
    timestamps.push(new Date(startTime.getTime() + i * intervalMs));
  }
  
  return timestamps;
}

/**
 * Format vessel data for display
 */
export function formatVesselData(activity: VesselActivity): string {
  const { userTracks, commercialVessels, fishingActivity } = activity;
  
  let summary = `📍 VESSEL ACTIVITY ANALYSIS\n\n`;
  
  // User tracks
  if (userTracks.length > 0) {
    summary += `🚤 RECREATIONAL VESSELS (${userTracks.length})\n`;
    userTracks.forEach(track => {
      summary += `  • ${track.vesselName}: ${track.avgSpeed.toFixed(1)} kts avg, ${track.timeInArea} min in area\n`;
    });
    summary += '\n';
  }
  
  // Commercial vessels
  if (commercialVessels.length > 0) {
    summary += `🚢 COMMERCIAL VESSELS (${commercialVessels.length})\n`;
    const byType = commercialVessels.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(byType).forEach(([type, count]) => {
      summary += `  • ${type}: ${count} vessels\n`;
    });
    summary += '\n';
  }
  
  // Fishing activity
  summary += `🎣 FISHING ACTIVITY\n`;
  summary += `  • Intensity: ${fishingActivity.intensity.toUpperCase()}\n`;
  summary += `  • Active vessels: ${fishingActivity.vesselCount}\n`;
  summary += `  • Primary gear: ${fishingActivity.primaryGear}\n`;
  summary += `  • ${fishingActivity.seasonalPattern}\n`;
  
  return summary;
}
