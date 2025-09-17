/**
 * Land detection for smart tracking
 * Only enable tracking when users are offshore
 */

// East Coast reference points for coastline
const COASTLINE_POINTS = [
  { lat: 44.0, lng: -68.0 }, // Maine
  { lat: 43.0, lng: -70.0 }, // New Hampshire
  { lat: 42.5, lng: -70.5 }, // Massachusetts
  { lat: 41.5, lng: -71.0 }, // Rhode Island
  { lat: 41.0, lng: -72.0 }, // Connecticut
  { lat: 40.5, lng: -73.8 }, // New York
  { lat: 39.5, lng: -74.2 }, // New Jersey
  { lat: 38.5, lng: -75.0 }, // Delaware
  { lat: 37.5, lng: -75.5 }, // Virginia
  { lat: 36.0, lng: -75.7 }, // North Carolina
  { lat: 34.0, lng: -78.0 }, // South Carolina
  { lat: 32.0, lng: -80.0 }, // Georgia
  { lat: 30.0, lng: -81.0 }, // Florida (North)
  { lat: 25.0, lng: -80.0 }, // Florida (South)
];

/**
 * Check if a position is on land (west of coastline)
 * @param lat Latitude
 * @param lng Longitude
 * @returns true if on land, false if offshore
 */
export function isOnLand(lat: number, lng: number): boolean {
  // Find the two closest latitude points
  let lowerPoint = COASTLINE_POINTS[0];
  let upperPoint = COASTLINE_POINTS[1];
  
  for (let i = 0; i < COASTLINE_POINTS.length - 1; i++) {
    if (lat >= COASTLINE_POINTS[i].lat && lat <= COASTLINE_POINTS[i + 1].lat) {
      lowerPoint = COASTLINE_POINTS[i];
      upperPoint = COASTLINE_POINTS[i + 1];
      break;
    }
  }
  
  // Handle edge cases
  if (lat < COASTLINE_POINTS[0].lat) {
    lowerPoint = upperPoint = COASTLINE_POINTS[0];
  } else if (lat > COASTLINE_POINTS[COASTLINE_POINTS.length - 1].lat) {
    lowerPoint = upperPoint = COASTLINE_POINTS[COASTLINE_POINTS.length - 1];
  }
  
  // Linear interpolation for coastline longitude at this latitude
  const latRatio = (lat - lowerPoint.lat) / (upperPoint.lat - lowerPoint.lat || 1);
  const coastlineLng = lowerPoint.lng + (upperPoint.lng - lowerPoint.lng) * latRatio;
  
  // Add a small buffer (0.1 degrees ~ 6 nautical miles)
  const buffer = 0.1;
  
  // If longitude is greater (less negative) than coastline, user is on land
  return lng > (coastlineLng + buffer);
}

/**
 * Calculate distance from shore in nautical miles
 * @param lat Latitude
 * @param lng Longitude
 * @returns Distance from shore in nautical miles (negative if on land)
 */
export function distanceFromShore(lat: number, lng: number): number {
  // Find interpolated coastline longitude
  let lowerPoint = COASTLINE_POINTS[0];
  let upperPoint = COASTLINE_POINTS[1];
  
  for (let i = 0; i < COASTLINE_POINTS.length - 1; i++) {
    if (lat >= COASTLINE_POINTS[i].lat && lat <= COASTLINE_POINTS[i + 1].lat) {
      lowerPoint = COASTLINE_POINTS[i];
      upperPoint = COASTLINE_POINTS[i + 1];
      break;
    }
  }
  
  const latRatio = (lat - lowerPoint.lat) / (upperPoint.lat - lowerPoint.lat || 1);
  const coastlineLng = lowerPoint.lng + (upperPoint.lng - lowerPoint.lng) * latRatio;
  
  // Calculate distance (1 degree longitude ≈ 60 nautical miles at this latitude)
  const degreeDiff = coastlineLng - lng; // Negative if offshore
  const nauticalMiles = Math.abs(degreeDiff) * 60 * Math.cos(lat * Math.PI / 180);
  
  // Return negative if on land, positive if offshore
  return degreeDiff > 0 ? nauticalMiles : -nauticalMiles;
}

/**
 * Determine if tracking should be enabled based on location
 * @param lat Latitude
 * @param lng Longitude
 * @returns Object with tracking decision and reason
 */
export function shouldEnableTracking(lat: number, lng: number): {
  enabled: boolean;
  reason: string;
  distanceNM: number;
} {
  const onLand = isOnLand(lat, lng);
  const distance = distanceFromShore(lat, lng);
  
  if (onLand) {
    return {
      enabled: false,
      reason: 'On land - tracking disabled',
      distanceNM: distance
    };
  }
  
  if (distance < 1) {
    return {
      enabled: false,
      reason: 'Too close to shore (< 1 NM)',
      distanceNM: distance
    };
  }
  
  if (distance > 200) {
    return {
      enabled: true,
      reason: 'Far offshore (> 200 NM) - tracking active',
      distanceNM: distance
    };
  }
  
  return {
    enabled: true,
    reason: `${distance.toFixed(1)} NM offshore - tracking active`,
    distanceNM: distance
  };
}

/**
 * Format tracking status message
 */
export function getTrackingStatus(lat: number, lng: number): string {
  const { enabled, reason, distanceNM } = shouldEnableTracking(lat, lng);
  
  if (!enabled) {
    return `📍 ${reason}`;
  }
  
  if (distanceNM < 10) {
    return `🚢 Near shore (${distanceNM.toFixed(1)} NM) - tracking active`;
  } else if (distanceNM < 50) {
    return `⚓ Offshore (${distanceNM.toFixed(0)} NM) - tracking active`;
  } else {
    return `🌊 Deep water (${distanceNM.toFixed(0)} NM) - tracking active`;
  }
}
