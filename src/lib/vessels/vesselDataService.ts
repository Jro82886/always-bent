/**
 * Vessel Data Service
 * Single source of truth for all vessel positions and tracking data
 * Used by both Tracking page and Analysis (SnipTool)
 */

import { getInletColor, INLET_COLORS } from '@/lib/inletColors';
import { createClient } from '@supabase/supabase-js';
import { INLETS } from '@/lib/inlets';
import { showToast } from '@/components/ui/Toast';

// Initialize Supabase client for live vessel data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Flag to track if we've shown the live data warning
let hasShownLiveDataWarning = false;

export interface Vessel {
  id: string;
  name: string;
  position: [number, number];
  type: 'user' | 'fleet' | 'commercial';
  inlet?: string;
  inletColor?: string; // Color based on inlet association
  heading?: number;
  speed?: number;
  vesselType?: string; // For commercial vessels (Longliner, Trawler, etc.)
  lastUpdate?: Date;
  track?: [number, number][]; // Historical positions
  hasReport?: boolean; // If vessel has submitted catch reports
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

// Import inlet data
import { INLETS } from '@/lib/inlets';

// Mock data for fleet vessels (until real-time integration)
const mockFleetVessels: Vessel[] = [
  { 
    id: 'fleet-1', 
    name: 'Reel Deal', 
    position: [-75.58, 35.22], 
    type: 'fleet', 
    inlet: 'nc-hatteras',
    inletColor: INLETS.find(i => i.id === 'nc-hatteras')?.color || '#16a34a',
    track: [[-75.60, 35.24], [-75.59, 35.23], [-75.58, 35.22]],
    hasReport: true
  },
  { 
    id: 'fleet-2', 
    name: 'Blue Water', 
    position: [-75.62, 35.18], 
    type: 'fleet', 
    inlet: 'nc-hatteras',
    inletColor: INLETS.find(i => i.id === 'nc-hatteras')?.color || '#16a34a',
    track: [[-75.64, 35.20], [-75.63, 35.19], [-75.62, 35.18]],
    hasReport: false
  },
  { 
    id: 'fleet-3', 
    name: 'Fish Finder', 
    position: [-75.55, 35.25], 
    type: 'fleet', 
    inlet: 'nc-hatteras',
    inletColor: INLETS.find(i => i.id === 'nc-hatteras')?.color || '#16a34a',
    track: [[-75.53, 35.23], [-75.54, 35.24], [-75.55, 35.25]],
    hasReport: true
  },
  // Add vessels from different inlets
  { 
    id: 'fleet-4', 
    name: 'Ocean Runner', 
    position: [-75.09, 38.33], 
    type: 'fleet', 
    inlet: 'md-ocean-city',
    inletColor: INLETS.find(i => i.id === 'md-ocean-city')?.color || '#059669',
    track: [[-75.11, 38.35], [-75.10, 38.34], [-75.09, 38.33]],
    hasReport: false
  },
  { 
    id: 'fleet-5', 
    name: 'Tuna Hunter', 
    position: [-71.94, 41.07], 
    type: 'fleet', 
    inlet: 'ny-montauk',
    inletColor: INLETS.find(i => i.id === 'ny-montauk')?.color || '#dc2626',
    track: [[-71.96, 41.09], [-71.95, 41.08], [-71.94, 41.07]],
    hasReport: true
  }
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
 * Fetch live fleet vessels from database with fallback to mock data
 */
async function fetchLiveFleetVessels(selectedInletId?: string): Promise<Vessel[]> {
  // If no Supabase client, show warning and use mock data for testing
  if (!supabase) {
    if (!hasShownLiveDataWarning) {
      showToast({
        type: 'warning',
        title: 'Live Fleet Data Unavailable',
        message: 'Fleet vessel tracking is not available. Using test data.',
        duration: 7000
      });
      hasShownLiveDataWarning = true;
    }
    // Return mock data for testing only
    return selectedInletId && selectedInletId !== 'overview' 
      ? mockFleetVessels.filter(v => v.inlet === selectedInletId)
      : mockFleetVessels;
  }

  try {
    // Fetch vessel positions from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let query = supabase
      .from('vessel_positions')
      .select('*')
      .eq('type', 'fleet')
      .gte('timestamp', sevenDaysAgo.toISOString())
      .order('timestamp', { ascending: false });

    // Filter by inlet if specific inlet selected
    if (selectedInletId && selectedInletId !== 'overview') {
      query = query.eq('inlet_id', selectedInletId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching fleet vessels:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      showToast({
        type: 'info',
        title: 'No Fleet Vessels',
        message: 'No fleet vessels detected in this area. Check back later.',
        duration: 5000
      });
      // Return empty array - no mock data when live system returns no results
      return [];
    }

    // Group by vessel ID and get latest position
    const vesselMap = new Map<string, any>();
    data.forEach(record => {
      if (!vesselMap.has(record.id) || new Date(record.timestamp) > new Date(vesselMap.get(record.id).timestamp)) {
        vesselMap.set(record.id, record);
      }
    });

    // Convert to Vessel format
    const vessels: Vessel[] = Array.from(vesselMap.values()).map(record => {
      const inlet = INLETS.find(i => i.id === record.inlet_id);
      return {
        id: record.id,
        name: record.name || 'Unknown Vessel',
        position: [record.lng, record.lat],
        type: 'fleet' as const,
        inlet: record.inlet_id,
        inletColor: inlet?.color || '#00C7B7',
        heading: record.heading,
        speed: record.speed,
        lastUpdate: new Date(record.timestamp),
        track: record.track || [],
        hasReport: record.has_report || false
      };
    });

    console.log(`Fetched ${vessels.length} live fleet vessels`);
    return vessels;

  } catch (error) {
    console.error('Failed to fetch live fleet vessels:', error);
    showToast({
      type: 'error',
      title: 'Fleet Data Error',
      message: 'Unable to fetch fleet vessel data. Please try again later.',
      duration: 7000
    });
    // For testing only - return mock data
    // TODO: Remove mock data before go-live
    return selectedInletId && selectedInletId !== 'overview' 
      ? mockFleetVessels.filter(v => v.inlet === selectedInletId)
      : mockFleetVessels;
  }
}

/**
 * Get all vessels (for Tracking page)
 * @param selectedInletId - Current inlet selection ('overview' or specific inlet)
 */
export async function getAllVessels(selectedInletId?: string): Promise<{ 
  user: Vessel; 
  fleet: Vessel[]; 
  commercial: VesselDataResult;
}> {
  let bounds: [[number, number], [number, number]];
  
  if (!selectedInletId || selectedInletId === 'overview') {
    // East Coast overview - show all vessels with their inlet colors
    bounds = [[-82.0, 24.0], [-65.0, 45.0]];
  } else {
    // Specific inlet selected - create bounds around inlet
    const inlet = INLETS.find(i => i.id === selectedInletId);
    if (inlet) {
      const padding = 2.0; // degrees
      bounds = [
        [(inlet.lng || inlet.center[0]) - padding, (inlet.lat || inlet.center[1]) - padding],
        [(inlet.lng || inlet.center[0]) + padding, (inlet.lat || inlet.center[1]) + padding]
      ];
    } else {
      // Fallback to East Coast
      bounds = [[-82.0, 24.0], [-65.0, 45.0]];
    }
  }
  
  // Fetch fleet vessels with fallback to mock data
  const fleetVessels = await fetchLiveFleetVessels(selectedInletId);
  
  // Fetch commercial vessels
  const commercialData = await fetchGFWVessels(bounds);
  
  return {
    user: mockUserVessel,
    fleet: fleetVessels,
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
  
  // Fetch all fleet vessels (will use live data with fallback)
  const allFleetVessels = await fetchLiveFleetVessels();
  
  // Filter fleet vessels in bounds
  const fleetInBounds = allFleetVessels.filter(vessel => {
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
  glow?: string;
} {
  switch (vessel.type) {
    case 'user':
      return { color: '#10B981', icon: 'user', size: 24, glow: 'rgba(16, 185, 129, 0.5)' };
    case 'fleet':
      const fleetColor = vessel.inlet ? getInletColor(vessel.inlet) : '#3B82F6';
      return { 
        color: fleetColor, 
        icon: 'fleet', 
        size: 20,
        glow: fleetColor + '80' // Add alpha for glow
      };
    case 'commercial':
      return { color: '#F59E0B', icon: 'commercial', size: 20, glow: 'rgba(245, 158, 11, 0.5)' };
    default:
      return { color: '#6B7280', icon: 'default', size: 18, glow: 'rgba(107, 114, 128, 0.5)' };
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
  
  // User vessel
  if (userVessels.length > 0) {
    parts.push('Your vessel in area');
  }
  
  // Fleet vessels with inlet info
  if (fleetVessels.length > 0) {
    const inletGroups = fleetVessels.reduce((acc, v) => {
      const inletId = v.inlet || 'unknown';
      acc[inletId] = (acc[inletId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const inletNames = Object.entries(inletGroups).map(([inletId, count]) => {
      const inlet = INLETS.find(i => i.id === inletId);
      return inlet ? `${count} from ${inlet.name}` : `${count} unknown`;
    });
    
    parts.push(`${fleetVessels.length} inlet vessel${fleetVessels.length > 1 ? 's' : ''} (${inletNames.join(', ')})`);
    
    // Note if any have reports
    const withReports = fleetVessels.filter(v => v.hasReport).length;
    if (withReports > 0) {
      parts.push(`${withReports} with catch report${withReports > 1 ? 's' : ''}`);
    }
  }
  
  // Commercial vessels
  if (commercialVessels.length > 0) {
    const types = commercialVessels
      .map(v => v.vesselType)
      .filter(Boolean);
    const uniqueTypes = [...new Set(types)];
    parts.push(`${commercialVessels.length} commercial vessel${commercialVessels.length > 1 ? 's' : ''} detected${uniqueTypes.length > 0 ? ` (${uniqueTypes.join(', ')})` : ''}`);
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