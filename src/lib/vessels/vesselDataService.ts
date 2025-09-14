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
    { id: 'fleet-1', name: 'Reel Deal', position: [-75.58, 35.22], type: 'fleet', inlet: 'nc-hatteras' },
    { id: 'fleet-2', name: 'Blue Water', position: [-75.62, 35.18], type: 'fleet', inlet: 'nc-hatteras' },
    { id: 'fleet-3', name: 'Fish Finder', position: [-75.55, 35.25], type: 'fleet', inlet: 'nc-hatteras' },
    { id: 'fleet-4', name: 'Lucky Strike', position: [-75.65, 35.15], type: 'fleet', inlet: 'nc-hatteras' },
    { id: 'fleet-5', name: 'Wave Runner', position: [-75.57, 35.21], type: 'fleet', inlet: 'nc-hatteras' },
  ],
  commercial: [
    { id: 'gfw-1', name: 'F/V Enterprise', position: [-75.7, 35.3], type: 'commercial', vesselType: 'Longliner' },
    { id: 'gfw-2', name: 'Lady Grace', position: [-75.5, 35.1], type: 'commercial', vesselType: 'Trawler' },
    { id: 'gfw-3', name: 'Ocean Pride', position: [-75.8, 35.4], type: 'commercial', vesselType: 'Seiner' },
  ]
};

/**
 * Get all vessels (for Tracking page)
 */
export function getAllVessels(): { user: Vessel; fleet: Vessel[]; commercial: Vessel[] } {
  // In production, this would fetch from:
  // - User: GPS/device location
  // - Fleet: ABFI member database
  // - Commercial: GFW API
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
      const inletColor = getInletColor(vessel.inlet || selectedInlet || 'nc-hatteras');
      const inletGlow = INLET_COLORS[vessel.inlet || selectedInlet || 'nc-hatteras']?.glow || 'rgba(255,255,255,0.3)';
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
