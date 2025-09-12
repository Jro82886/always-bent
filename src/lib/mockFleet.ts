/**
 * Mock fleet data for testing vessel tracking
 * In production, this would come from AIS/GFW APIs
 */

import { INLETS } from './inlets';

export interface Vessel {
  id: string;
  name: string;
  type: 'commercial' | 'recreational' | 'charter' | 'research';
  position: [number, number]; // [lng, lat]
  heading: number; // 0-360 degrees
  speed: number; // knots
  status: 'fishing' | 'transit' | 'anchored' | 'drifting';
  lastUpdate: Date;
  inlet: string;
  length?: number; // feet
  captain?: string;
  targetSpecies?: string;
}

// Generate random vessels near each inlet
export function generateMockFleet(inletId: string): Vessel[] {
  const inlet = INLETS.find(i => i.id === inletId);
  if (!inlet || inlet.isOverview) return [];
  
  const vessels: Vessel[] = [];
  const vesselNames = [
    'Reel Deal', 'Sea Hunter', 'Lucky Strike', 'Blue Horizon', 'Wave Runner',
    'Fish Finder', 'Ocean Pride', 'Salty Dog', 'Deep Blue', 'Tide Runner',
    'Storm Chaser', 'Fish Whisperer', 'Sea Spirit', 'Aqua Dream', 'Net Gain'
  ];
  
  const types: Vessel['type'][] = ['commercial', 'recreational', 'charter'];
  const statuses: Vessel['status'][] = ['fishing', 'transit', 'anchored', 'drifting'];
  
  // Generate 5-10 vessels per inlet
  const vesselCount = Math.floor(Math.random() * 6) + 5;
  
  for (let i = 0; i < vesselCount; i++) {
    // Position vessels 5-60nm offshore from inlet
    const distanceNm = Math.random() * 55 + 5;
    const bearing = Math.random() * 180 - 90; // -90 to +90 degrees (mostly eastward)
    
    // Convert to lat/lng offset (rough approximation)
    const latOffset = (distanceNm / 60) * Math.cos(bearing * Math.PI / 180);
    const lngOffset = (distanceNm / 60) * Math.sin(bearing * Math.PI / 180);
    
    vessels.push({
      id: `vessel-${inletId}-${i}`,
      name: vesselNames[Math.floor(Math.random() * vesselNames.length)],
      type: types[Math.floor(Math.random() * types.length)],
      position: [
        inlet.center[0] + lngOffset,
        inlet.center[1] + latOffset
      ],
      heading: Math.random() * 360,
      speed: Math.random() * 12, // 0-12 knots
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lastUpdate: new Date(Date.now() - Math.random() * 3600000), // Within last hour
      inlet: inletId,
      length: Math.floor(Math.random() * 40) + 20, // 20-60 feet
      captain: `Captain ${['Smith', 'Jones', 'Davis', 'Wilson', 'Brown'][Math.floor(Math.random() * 5)]}`,
      targetSpecies: ['Tuna', 'Mahi', 'Marlin', 'Wahoo', 'Swordfish'][Math.floor(Math.random() * 5)]
    });
  }
  
  return vessels;
}

// Simulate vessel movement
export function updateVesselPositions(vessels: Vessel[]): Vessel[] {
  return vessels.map(vessel => {
    if (vessel.status === 'anchored') return vessel;
    
    // Move vessel based on speed and heading
    const speedMs = vessel.speed * 0.514444; // Convert knots to m/s
    const timeDelta = 5; // 5 seconds
    const distance = speedMs * timeDelta / 111000; // Rough degrees conversion
    
    const newLat = vessel.position[1] + distance * Math.cos(vessel.heading * Math.PI / 180);
    const newLng = vessel.position[0] + distance * Math.sin(vessel.heading * Math.PI / 180);
    
    // Occasionally change heading
    const newHeading = Math.random() > 0.9 
      ? (vessel.heading + (Math.random() - 0.5) * 30 + 360) % 360
      : vessel.heading;
    
    // Occasionally change speed
    const newSpeed = Math.random() > 0.9
      ? Math.max(0, Math.min(12, vessel.speed + (Math.random() - 0.5) * 3))
      : vessel.speed;
    
    return {
      ...vessel,
      position: [newLng, newLat],
      heading: newHeading,
      speed: newSpeed,
      lastUpdate: new Date()
    };
  });
}

// Get vessel icon based on type and status
export function getVesselIcon(vessel: Vessel): string {
  if (vessel.status === 'anchored') return '⚓';
  if (vessel.type === 'commercial') return '🚢';
  if (vessel.type === 'charter') return '⛵';
  if (vessel.type === 'research') return '🔬';
  return '🛥️';
}

// Get vessel color based on status
export function getVesselColor(vessel: Vessel): string {
  switch (vessel.status) {
    case 'fishing': return '#00ff00'; // Green - actively fishing
    case 'transit': return '#ffff00'; // Yellow - moving
    case 'anchored': return '#ff9900'; // Orange - stationary
    case 'drifting': return '#00ffff'; // Cyan - drifting
    default: return '#ffffff';
  }
}
