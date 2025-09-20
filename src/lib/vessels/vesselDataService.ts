/**
 * Vessel Data Service
 * Single source of truth for all vessel positions and tracking data
 * Used by both Tracking page and Analysis (SnipTool)
 */

import { getInletById } from '@/lib/inlets';

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

// Mock data for MVP - will be replaced with real-time data
const mockVessels: {
  user: Vessel;
  fleet: Vessel[];
  commercial: Vessel[];
} = {
  user: {
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
  },
  fleet: [
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
    { 
      id: 'fleet-4', 
      name: 'Lucky Strike', 
      position: [-75.65, 35.15], 
      type: 'fleet', 
      inlet: 'nc-hatteras',
      track: [[-75.67, 35.17], [-75.66, 35.16], [-75.65, 35.15]]
    },
    { 
      id: 'fleet-5', 
      name: 'Wave Runner', 
      position: [-75.57, 35.21], 
      type: 'fleet', 
      inlet: 'nc-hatteras',
      track: [[-75.55, 35.19], [-75.56, 35.20], [-75.57, 35.21]]
    },
  ],
  commercial: [
    { 
      id: 'gfw-1', 
      name: 'F/V Enterprise', 
      position: [-75.7, 35.3], 
      type: 'commercial', 
      vesselType: 'Longliner',
      track: [[-75.72, 35.32], [-75.71, 35.31], [-75.7, 35.3]]
    },
    { 
      id: 'gfw-2', 
      name: 'Lady Grace', 
      position: [-75.5, 35.1], 
      type: 'commercial', 
      vesselType: 'Trawler',
      track: [[-75.48, 35.08], [-75.49, 35.09], [-75.5, 35.1]]
    },
    { 
      id: 'gfw-3', 
      name: 'Ocean Pride', 
      position: [-75.8, 35.4], 
      type: 'commercial', 
      vesselType: 'Seiner',
      track: [[-75.82, 35.42], [-75.81, 35.41], [-75.8, 35.4]]
    },
  ]
};

/**
 * Get all vessels (for Tracking page)
 * 
 * REAL DATA INTEGRATION POINT:
 * Replace mockVessels with actual data sources:
 * 
 * 1. USER VESSEL:
 *    - Source: Browser Geolocation API / Mobile GPS
 *    - Update frequency: Every 30 seconds when app is active
 *    - Store track history in localStorage/IndexedDB
 * 
 * 2. FLEET VESSELS:
 *    - Source: Supabase realtime subscription
 *    - Table: vessel_positions (user_id, position, timestamp)
 *    - Update when fleet members share location
 * 
 * 3. COMMERCIAL VESSELS:
 *    - Source: GFW API (api.globalfishingwatch.org)
 *    - Update frequency: Every 5 minutes
 *    - Filter by bounding box for performance
 */
export function getAllVessels(): { user: Vessel; fleet: Vessel[]; commercial: Vessel[] } {
  // Using mock vessels for MVP - real AIS integration in phase 2
  return mockVessels;
}

/**
 * Get vessels within a bounding box (for SnipTool analysis)
 */
export function getVesselsInBounds(bounds: [[number, number], [number, number]]): Vessel[] {
  const [sw, ne] = bounds;
  const allVessels = [
    mockVessels.user,
    ...mockVessels.fleet,
    ...mockVessels.commercial
  ];
  
  return allVessels.filter(vessel => {
    const [lng, lat] = vessel.position;
    return lng >= sw[0] && lng <= ne[0] && lat >= sw[1] && lat <= ne[1];
  });
}

/**
 * Get vessel style configuration for consistent rendering
 */
export function getVesselStyle(vessel: Vessel, selectedInlet?: string) {
  switch (vessel.type) {
    case 'user':
      return {
        color: '#ffffff',
        glow: 'rgba(14, 165, 233, 0.4)',
        size: 14,
        shape: 'circle',
        pulse: true
      };
    
    case 'fleet':
      const inlet = getInletById(vessel.inlet || selectedInlet || 'nc-hatteras');
      const inletColor = inlet?.color || '#00DDEB';
      const inletGlow = inlet?.color ? `${inlet.color}33` : 'rgba(255,255,255,0.3)'; // 20% opacity
      return {
        color: inletColor,
        glow: inletGlow,
        size: 10,
        shape: 'circle',
        pulse: false
      };
    
    case 'commercial':
      return {
        color: '#f39c12',
        glow: 'rgba(243, 156, 18, 0.3)',
        size: 12,
        shape: 'triangle',
        pulse: false
      };
  }
}

/**
 * Format vessel info for popup/analysis
 */
export function formatVesselInfo(vessel: Vessel): string {
  switch (vessel.type) {
    case 'user':
      return `YOUR VESSEL: ${vessel.name}
Speed: ${vessel.speed} kts
Heading: ${vessel.heading}°`;
    
    case 'fleet':
      return `FLEET: ${vessel.name}
Inlet: ${vessel.inlet}`;
    
    case 'commercial':
      return `COMMERCIAL: ${vessel.name}
Type: ${vessel.vesselType}`;
    
    default:
      return vessel.name;
  }
}

/**
 * Get vessel tracking summary for analysis
 */
export function getVesselTrackingSummary(vessels: Vessel[]): {
  userVessels: number;
  fleetVessels: number;
  commercialVessels: number;
  totalVessels: number;
  summary: string;
} {
  const userVessels = vessels.filter(v => v.type === 'user').length;
  const fleetVessels = vessels.filter(v => v.type === 'fleet').length;
  const commercialVessels = vessels.filter(v => v.type === 'commercial').length;
  const totalVessels = vessels.length;
  
  let summary = '';
  if (userVessels > 0) summary += `${userVessels} personal vessel${userVessels > 1 ? 's' : ''}, `;
  if (fleetVessels > 0) summary += `${fleetVessels} ABFI fleet member${fleetVessels > 1 ? 's' : ''}, `;
  if (commercialVessels > 0) summary += `${commercialVessels} commercial vessel${commercialVessels > 1 ? 's' : ''}`;
  
  // Clean up trailing comma
  summary = summary.replace(/, $/, '');
  
  return {
    userVessels,
    fleetVessels,
    commercialVessels,
    totalVessels,
    summary: summary || 'No vessels detected'
  };
}
