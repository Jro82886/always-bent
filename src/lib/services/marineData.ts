/**
 * Marine Data Service - Real tide, moon, and weather data
 * Integrates with Stormglass API via our Next.js endpoint
 */

export interface MarineData {
  moon: {
    phaseText: string | null;
    phaseValue: number | null;
    illumination: number | null;
    moonrise: string | null;
    moonset: string | null;
  };
  tide: {
    stage: 'flood' | 'ebb' | null;
    rateCmPerHr: number | null;
    series: Array<{ time: string; heightM: number }>;
    extremes: Array<{ time: string; height: number; type: 'high' | 'low' }>;
  };
  raw?: any;
}

// Inlet coordinates for NOAA/Stormglass stations
export const INLET_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  'me-portland': { lat: 43.66, lng: -70.25, name: 'Portland, ME' },
  'ma-boston': { lat: 42.36, lng: -71.05, name: 'Boston, MA' },
  'ma-cape-cod': { lat: 41.65, lng: -70.60, name: 'Cape Cod Canal' },
  'ma-nantucket': { lat: 41.28, lng: -70.10, name: 'Nantucket' },
  'ri-block-island': { lat: 41.17, lng: -71.58, name: 'Block Island' },
  'ny-montauk': { lat: 41.05, lng: -71.96, name: 'Montauk Point' },
  'ny-fire-island': { lat: 40.63, lng: -73.28, name: 'Fire Island' },
  'nj-barnegat': { lat: 39.76, lng: -74.11, name: 'Barnegat Inlet' },
  'nj-cape-may': { lat: 38.95, lng: -74.96, name: 'Cape May' },
  'nj-atlantic-city': { lat: 39.36, lng: -74.42, name: 'Atlantic City' },
  'de-indian-river': { lat: 38.61, lng: -75.07, name: 'Indian River' },
  'md-ocean-city': { lat: 38.33, lng: -75.08, name: 'Ocean City' },
  'va-virginia-beach': { lat: 36.85, lng: -75.98, name: 'Virginia Beach' },
  'nc-oregon-inlet': { lat: 35.77, lng: -75.54, name: 'Oregon Inlet' },
  'nc-hatteras': { lat: 35.22, lng: -75.69, name: 'Hatteras' },
  'nc-ocracoke': { lat: 35.11, lng: -75.99, name: 'Ocracoke' },
  'nc-beaufort': { lat: 34.72, lng: -76.67, name: 'Beaufort' },
  'sc-murrells': { lat: 33.55, lng: -79.05, name: 'Murrells Inlet' },
  'sc-charleston': { lat: 32.78, lng: -79.93, name: 'Charleston' },
  'ga-savannah': { lat: 32.08, lng: -81.09, name: 'Savannah' },
  'fl-jacksonville': { lat: 30.40, lng: -81.43, name: 'Jacksonville' },
  'fl-ponce': { lat: 29.07, lng: -80.92, name: 'Ponce Inlet' },
  'fl-sebastian': { lat: 27.86, lng: -80.48, name: 'Sebastian' },
  'fl-jupiter': { lat: 26.95, lng: -80.07, name: 'Jupiter' },
  'fl-miami': { lat: 25.76, lng: -80.13, name: 'Miami' },
  'fl-keys': { lat: 24.55, lng: -81.78, name: 'Key West' }
};

/**
 * Fetch marine data for a specific inlet
 */
export async function fetchMarineData(inletId: string, hours: number = 72): Promise<MarineData | null> {
  try {
    const coords = INLET_COORDINATES[inletId];
    if (!coords) {
      console.warn(`No coordinates found for inlet: ${inletId}`);
      return null;
    }

    const response = await fetch(
      `/api/trends/marine?lat=${coords.lat}&lng=${coords.lng}&hours=${hours}`
    );

    if (!response.ok) {
      console.error('Marine data fetch failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data as MarineData;
  } catch (error) {
    console.error('Error fetching marine data:', error);
    return null;
  }
}

/**
 * Format tide stage for display
 */
export function formatTideStage(stage: string | null, rateCmPerHr: number | null): string {
  if (!stage) return 'Slack';
  
  const direction = stage === 'flood' ? 'Rising' : 'Falling';
  const rate = rateCmPerHr ? ` (${Math.abs(rateCmPerHr).toFixed(0)} cm/hr)` : '';
  
  return `${direction}${rate}`;
}

/**
 * Format moon phase for display
 */
export function formatMoonPhase(moon: MarineData['moon']): string {
  if (!moon.phaseText) return 'Unknown';
  
  const illumination = moon.illumination ? ` (${Math.round(moon.illumination * 100)}%)` : '';
  return `${moon.phaseText}${illumination}`;
}

/**
 * Get next tide event from extremes
 */
export function getNextTide(extremes: MarineData['tide']['extremes']): {
  type: 'high' | 'low';
  time: Date;
  height: number;
  timeUntil: string;
} | null {
  if (!extremes || extremes.length === 0) return null;
  
  const now = new Date();
  const future = extremes
    .filter(e => new Date(e.time).getTime() > now.getTime())
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  
  if (future.length === 0) return null;
  
  const next = future[0];
  const nextTime = new Date(next.time);
  const hoursUntil = (nextTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  let timeUntil: string;
  if (hoursUntil < 1) {
    timeUntil = `${Math.round(hoursUntil * 60)}m`;
  } else if (hoursUntil < 24) {
    timeUntil = `${Math.round(hoursUntil)}h`;
  } else {
    timeUntil = `${Math.round(hoursUntil / 24)}d`;
  }
  
  return {
    type: next.type,
    time: nextTime,
    height: next.height,
    timeUntil
  };
}

/**
 * Analyze fishing conditions based on marine data
 */
export function analyzeFishingConditions(data: MarineData): {
  score: number; // 0-100
  factors: string[];
  recommendation: string;
} {
  let score = 50; // Base score
  const factors: string[] = [];
  
  // Moon phase analysis
  if (data.moon.illumination !== null) {
    if (data.moon.illumination > 0.7) {
      score += 10;
      factors.push('Strong moonlight - good night bite');
    } else if (data.moon.illumination < 0.3) {
      score += 5;
      factors.push('Dark moon - focus dawn/dusk');
    }
  }
  
  // Tide analysis
  if (data.tide.stage) {
    if (Math.abs(data.tide.rateCmPerHr || 0) > 20) {
      score += 15;
      factors.push('Strong current - active feeding');
    } else if (Math.abs(data.tide.rateCmPerHr || 0) < 5) {
      score -= 10;
      factors.push('Slack tide - slower action');
    }
    
    if (data.tide.stage === 'flood') {
      score += 5;
      factors.push('Incoming tide pushes bait');
    }
  }
  
  // Time-based recommendations
  const hour = new Date().getHours();
  let recommendation = '';
  
  if (score > 70) {
    recommendation = 'Excellent conditions - get out there!';
  } else if (score > 50) {
    recommendation = 'Good potential - worth a shot';
  } else {
    recommendation = 'Challenging conditions - pick your spots carefully';
  }
  
  if (hour >= 4 && hour <= 7) {
    recommendation += ' Dawn bite window active.';
  } else if (hour >= 17 && hour <= 20) {
    recommendation += ' Evening bite approaching.';
  }
  
  return { score, factors, recommendation };
}

/**
 * Cache marine data with expiry
 */
const marineDataCache = new Map<string, { data: MarineData; expires: number }>();

export async function getCachedMarineData(inletId: string): Promise<MarineData | null> {
  const cached = marineDataCache.get(inletId);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  const data = await fetchMarineData(inletId);
  
  if (data) {
    marineDataCache.set(inletId, {
      data,
      expires: Date.now() + 10 * 60 * 1000 // Cache for 10 minutes
    });
  }
  
  return data;
}
