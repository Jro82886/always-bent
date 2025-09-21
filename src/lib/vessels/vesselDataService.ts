/**
 * Vessel Data Service
 * Single source of truth for all vessel positions and tracking data
 * Used by both Tracking page and Analysis (SnipTool)
 */

import { getInletColor, INLET_COLORS } from '@/lib/inletColors';

export interface Vessel {
  id: string;
  name: string;
  position: [number, number];
  type: 'user' | 'fleet' | 'commercial';
  inlet?: string;
  heading?: number;
  speed?: number;
  vesselType?: string; // For commercial vessels (Longliner, Trawler, etc.)
  lastUpdate?: Date;
  track?: [number, number][]; // Historical positions
}

export interface VesselFilters {
  showUser: boolean;
  showFleet: boolean;
  showCommercial: boolean;
  showTracks: boolean;
}

export interface VesselDataResult {
  vessels: Vessel[];
  isLoading: boolean;
  error?: string;
}

// Cache for GFW data
let gfwCache: { data: Vessel[]; timestamp: number; bounds: string } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Mock data for fleet vessels (until real-time integration)
const mockFleetVessels: Vessel[] = [
  { 
    id: 'fleet-1', 
    name: 'Reel Deal', 
    position: [-75.58, 35.22], 
    type: 'fleet', 
    inlet: 'nc-hatteras',
    track: [[-75.60, 35.24], [-75.59, 35.23], [-75.58, 35.22]]
  },
  { 
    id: 'fleet-2', 
    name: 'Blue Water', 
    position: [-75.62, 35.18], 
    type: 'fleet', 
    inlet: 'nc-hatteras',
    track: [[-75.64, 35.20], [-75.63, 35.19], [-75.62, 35.18]]
  },
  { 
    id: 'fleet-3', 
    name: 'Fish Finder', 
    position: [-75.55, 35.25], 
    type: 'fleet', 
    inlet: 'nc-hatteras',
    track: [[-75.53, 35.23], [-75.54, 35.24], [-75.55, 35.25]]
  },
];

// Mock user vessel (until GPS integration)
const mockUserVessel: Vessel = {
  id: 'user-vessel',
  name: 'Sea Hunter',
  position: [-75.6, 35.2],
  type: 'user',
  heading: 45,
  speed: 12,
  track: [
    [-75.6, 35.2],
    [-75.58, 35.18],
    [-75.55, 35.15],
    [-75.52, 35.12]
  ]
};

/**
 * Get commercial vessels from GFW API
 */
async function fetchGFWVessels(bounds: [[number, number], [number, number]]): Promise<VesselDataResult> {
  const [sw, ne] = bounds;
  const bbox = `${sw[0]},${sw[1]},${ne[0]},${ne[1]}`;
  const cacheKey = bbox;
  
  // Check cache
  if (gfwCache && 
      Date.now() - gfwCache.timestamp < CACHE_DURATION && 
      gfwCache.bounds === cacheKey) {
    return { vessels: gfwCache.data, isLoading: false };
  }
  
  try {
    const response = await fetch(`/api/gfw/vessels?bbox=${bbox}&days=4`);
    const data = await response.json();
    
    if (!response.ok) {
      // Handle specific error cases
      if (data.message === 'GFW server down, try back later') {
        return { 
          vessels: [], 
          isLoading: false, 
          error: 'GFW server down, try back later' 
        };
      } else if (data.message === 'Vessel tracking service not available') {
        return { 
          vessels: [], 
          isLoading: false, 
          error: 'Commercial vessel tracking not configured' 
        };
      }
      throw new Error(data.message || 'Failed to fetch vessels');
    }
    
    // Transform GFW data to our format
    const vessels: Vessel[] = (data.vessels || []).map((v: any) => {
      const latestPos = v.positions?.[v.positions.length - 1];
      return {
        id: v.id,
        name: v.name || 'Unknown Vessel',
        position: latestPos ? [latestPos.lng, latestPos.lat] : [0, 0],
        type: 'commercial' as const,
        vesselType: v.type,
        speed: latestPos?.speed,
        track: v.positions?.map((p: any) => [p.lng, p.lat]) || []
      };
    });
    
    // Cache the results
    gfwCache = { data: vessels, timestamp: Date.now(), bounds: cacheKey };
    
    return { vessels, isLoading: false };
  } catch (error) {
    console.error('Error fetching GFW vessels:', error);
    return { 
      vessels: [], 
      isLoading: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch vessels' 
    };
  }
}

/**
 * Get all vessels (for Tracking page)
 */
export async function getAllVessels(): Promise<{ 
  user: Vessel; 
  fleet: Vessel[]; 
  commercial: VesselDataResult;
}> {
  // For tracking page, use a wide area around the East Coast
  const eastCoastBounds: [[number, number], [number, number]] = [
    [-82.0, 24.0], // SW corner
    [-65.0, 45.0]  // NE corner
  ];
  
  const commercialData = await fetchGFWVessels(eastCoastBounds);
  
  return {
    user: mockUserVessel,
    fleet: mockFleetVessels,
    commercial: commercialData
  };
}

/**
 * Get vessels within a bounding box (for SnipTool analysis)
 * Now returns loading state and error information
 */
export async function getVesselsInBoundsAsync(
  bounds: [[number, number], [number, number]]
): Promise<VesselDataResult> {
  const [sw, ne] = bounds;
  
  // Get fleet vessels in bounds
  const fleetInBounds = mockFleetVessels.filter(vessel => {
    const [lng, lat] = vessel.position;
    return lng >= sw[0] && lng <= ne[0] && lat >= sw[1] && lat <= ne[1];
  });
  
  // Get user vessel if in bounds
  const userInBounds = [];
  const [userLng, userLat] = mockUserVessel.position;
  if (userLng >= sw[0] && userLng <= ne[0] && userLat >= sw[1] && userLat <= ne[1]) {
    userInBounds.push(mockUserVessel);
  }
  
  // Fetch commercial vessels
  const commercialResult = await fetchGFWVessels(bounds);
  
  // Combine all vessels
  const allVessels = [...userInBounds, ...fleetInBounds, ...commercialResult.vessels];
  
  return {
    vessels: allVessels,
    isLoading: commercialResult.isLoading,
    error: commercialResult.error
  };
}

/**
 * Legacy synchronous function for backward compatibility
 * @deprecated Use getVesselsInBoundsAsync instead
 */
export function getVesselsInBounds(bounds: [[number, number], [number, number]]): Vessel[] {
  const [sw, ne] = bounds;
  const allVessels = [
    mockUserVessel,
    ...mockFleetVessels
  ];
  
  return allVessels.filter(vessel => {
    const [lng, lat] = vessel.position;
    return lng >= sw[0] && lng <= ne[0] && lat >= sw[1] && lat <= ne[1];
  });
}

/**
 * Get style properties for a vessel marker
 */
export function getVesselStyle(vessel: Vessel): {
  color: string;
  icon: string;
  size: number;
} {
  switch (vessel.type) {
    case 'user':
      return { color: '#10B981', icon: 'user', size: 24 };
    case 'fleet':
      return { 
        color: vessel.inlet ? getInletColor(vessel.inlet) : '#3B82F6', 
        icon: 'fleet', 
        size: 20 
      };
    case 'commercial':
      return { color: '#F59E0B', icon: 'commercial', size: 20 };
    default:
      return { color: '#6B7280', icon: 'default', size: 18 };
  }
}

/**
 * Generate a summary of vessel tracking for analysis reports
 */
export function getVesselTrackingSummary(vessels: Vessel[], error?: string): string {
  if (error) {
    if (error.includes('GFW server down')) {
      return 'Commercial vessel tracking temporarily unavailable. GFW server down, try back later.';
    } else if (error.includes('not configured')) {
      return 'Commercial vessel tracking not available.';
    }
    return 'Unable to fetch vessel data.';
  }
  
  if (!vessels || vessels.length === 0) {
    return 'No vessels detected in this area.';
  }
  
  const userVessels = vessels.filter(v => v.type === 'user');
  const fleetVessels = vessels.filter(v => v.type === 'fleet');
  const commercialVessels = vessels.filter(v => v.type === 'commercial');
  
  const parts = [];
  
  if (commercialVessels.length > 0) {
    const types = commercialVessels
      .map(v => v.vesselType)
      .filter(Boolean);
    const uniqueTypes = [...new Set(types)];
    parts.push(`${commercialVessels.length} commercial vessel${commercialVessels.length > 1 ? 's' : ''} detected${uniqueTypes.length > 0 ? ` (${uniqueTypes.join(', ')})` : ''}`);
  }
  
  if (fleetVessels.length > 0) {
    parts.push(`${fleetVessels.length} fleet vessel${fleetVessels.length > 1 ? 's' : ''} nearby`);
  }
  
  if (userVessels.length > 0) {
    parts.push('Your vessel in area');
  }
  
  return parts.join('. ') + '.';
}

/**
 * Format vessel data for display in analysis results
 */
export function formatVesselData(vessels: Vessel[]): {
  total: number;
  byType: Record<string, number>;
  summary: string;
} {
  const byType = vessels.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total: vessels.length,
    byType,
    summary: getVesselTrackingSummary(vessels)
  };
}