/**
 * Vessel Data Service
 * Single source of truth for all vessel positions and tracking data
 * Used by both Tracking page and Analysis (SnipTool)
 */

import { getInletColor, INLET_COLORS } from '@/lib/inletColors';
import { supabase } from "@/lib/supabaseClient"
import { INLETS } from '@/lib/inlets';
import { showToast } from '@/components/ui/Toast';
import { getInletColor as getInletColorFromSource } from '@/lib/style/fleetColors';

// Initialize Supabase client for live vessel data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseClient = supabaseUrl && supabaseAnonKey ? supabase : null;

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

// Get user's current vessel position from GPS or stored location
async function getUserVessel(): Promise<Vessel | null> {
  try {
    // Check if we have a recent user position in localStorage
    const storedPosition = localStorage.getItem('user_vessel_position');
    if (storedPosition) {
      const pos = JSON.parse(storedPosition);
      const age = Date.now() - pos.timestamp;

      // Use stored position if less than 5 minutes old
      if (age < 5 * 60 * 1000) {
        return {
          id: 'user-vessel',
          name: 'Your Vessel',
          position: [pos.lng, pos.lat],
          type: 'user',
          heading: pos.heading || 0,
          speed: pos.speed || 0,
          lastUpdate: new Date(pos.timestamp)
        };
      }
    }

    // Try to get fresh GPS position
    if ('geolocation' in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const vessel: Vessel = {
              id: 'user-vessel',
              name: 'Your Vessel',
              position: [position.coords.longitude, position.coords.latitude],
              type: 'user',
              heading: position.coords.heading || 0,
              speed: position.coords.speed ? position.coords.speed * 1.94384 : 0, // m/s to knots
              lastUpdate: new Date()
            };

            // Store position for future use
            localStorage.setItem('user_vessel_position', JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: Date.now()
            }));

            resolve(vessel);
          },
          () => {
            // GPS failed, return null
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 60000
          }
        );
      });
    }
  } catch (error) {
    console.error('Error getting user vessel position:', error);
  }

  return null;
}

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
 * Fetch live fleet vessels from database (no mock data fallback in production)
 */
async function fetchLiveFleetVessels(selectedInletId?: string): Promise<Vessel[]> {
  // If no Supabase client, return empty - no mock data in production
  if (!supabaseClient) {
    console.warn('Supabase client not configured for vessel tracking');
    return [];
  }

  try {
    // Fetch vessel positions from last 48 hours for better coverage
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Use the vessels_latest view for most recent positions
    let query = supabase
      .from('vessels_latest')
      .select('*')
      .gte('recorded_at', twoDaysAgo.toISOString());

    // Filter by inlet if specific inlet selected
    if (selectedInletId && selectedInletId !== 'overview') {
      query = query.eq('inlet_id', selectedInletId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching fleet vessels:', error);

      // If table doesn't exist yet, return empty array
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.log('Vessel tracking tables not yet configured');
        return [];
      }
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No fleet vessels currently active');
      return [];
    }

    // Convert to Vessel format with proper inlet colors
    const vessels: Vessel[] = data.map(record => {
      return {
        id: record.vessel_id || record.id,
        name: record.meta?.name || `Fleet ${record.vessel_id?.slice(0, 8)}`,
        position: [record.lon || record.lng, record.lat],
        type: 'fleet' as const,
        inlet: record.inlet_id,
        inletColor: getInletColorFromSource(record.inlet_id),
        heading: record.heading_deg || record.heading || 0,
        speed: record.speed_kn || record.speed || 0,
        lastUpdate: new Date(record.recorded_at || record.inserted_at),
        track: [], // Will be fetched separately if needed
        hasReport: record.meta?.has_report || false
      };
    });

    console.log(`Live data: ${vessels.length} fleet vessels active`);
    return vessels;

  } catch (error) {
    console.error('Failed to fetch live fleet vessels:', error);

    // In production, return empty array on error
    return [];
  }
}

/**
 * Get all vessels (for Tracking page)
 * @param selectedInletId - Current inlet selection ('overview' or specific inlet)
 */
export async function getAllVessels(selectedInletId?: string): Promise<{
  user: Vessel | null;
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

  // Fetch all data sources in parallel for better performance
  const [userVessel, fleetVessels, commercialData] = await Promise.all([
    getUserVessel(),
    fetchLiveFleetVessels(selectedInletId),
    fetchGFWVessels(bounds)
  ]);

  return {
    user: userVessel,
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

  // Fetch all data sources in parallel
  const [userVessel, allFleetVessels, commercialResult] = await Promise.all([
    getUserVessel(),
    fetchLiveFleetVessels(),
    fetchGFWVessels(bounds)
  ]);

  // Filter fleet vessels in bounds
  const fleetInBounds = allFleetVessels.filter(vessel => {
    const [lng, lat] = vessel.position;
    return lng >= sw[0] && lng <= ne[0] && lat >= sw[1] && lat <= ne[1];
  });

  // Check if user vessel is in bounds
  const userInBounds = [];
  if (userVessel) {
    const [userLng, userLat] = userVessel.position;
    if (userLng >= sw[0] && userLng <= ne[0] && userLat >= sw[1] && userLat <= ne[1]) {
      userInBounds.push(userVessel);
    }
  }

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
  // This synchronous version can't fetch real data
  // Return empty array and log warning
  console.warn('getVesselsInBounds is deprecated. Use getVesselsInBoundsAsync for real vessel data.');
  return [];
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