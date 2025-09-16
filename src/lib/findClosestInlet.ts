import { INLETS, type Inlet } from './inlets';

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Find the closest inlet to a given position
 */
export function findClosestInlet(position: { lat: number; lng: number }): { 
  inlet: Inlet; 
  distance: number;
} | null {
  if (!position || !position.lat || !position.lng) return null;
  
  let closestInlet: Inlet | null = null;
  let minDistance = Infinity;
  
  // Check all inlets except overview
  for (const inlet of INLETS) {
    if (inlet.isOverview) continue;
    
    const [inletLng, inletLat] = inlet.center;
    const distance = calculateDistance(
      position.lat, 
      position.lng, 
      inletLat, 
      inletLng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestInlet = inlet;
    }
  }
  
  if (!closestInlet) return null;
  
  return {
    inlet: closestInlet,
    distance: minDistance
  };
}

/**
 * Auto-select closest inlet if user hasn't selected one
 */
export function autoSelectInlet(
  userPosition: { lat: number; lng: number },
  currentInletId: string | null,
  maxDistance: number = 75 // miles
): { 
  shouldAutoSelect: boolean;
  inlet?: Inlet;
  distance?: number;
} {
  // Don't auto-select if user already has an inlet
  if (currentInletId && currentInletId !== 'overview') {
    return { shouldAutoSelect: false };
  }
  
  const closest = findClosestInlet(userPosition);
  
  if (!closest) {
    return { shouldAutoSelect: false };
  }
  
  // Only auto-select if within reasonable distance
  if (closest.distance <= maxDistance) {
    return {
      shouldAutoSelect: true,
      inlet: closest.inlet,
      distance: closest.distance
    };
  }
  
  return { shouldAutoSelect: false };
}
