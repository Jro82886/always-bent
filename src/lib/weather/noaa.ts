/**
 * NOAA Buoy Data API Integration
 * Real-time marine weather conditions from NOAA buoys
 */

export interface BuoyData {
  station_id: string;
  station_name: string;
  lat: number;
  lon: number;
  timestamp: Date;
  // Wind
  wind_speed_kt?: number;
  wind_direction?: number;
  wind_gust_kt?: number;
  // Waves
  wave_height_ft?: number;
  wave_period_sec?: number;
  wave_direction?: number;
  dominant_wave_period?: number;
  // Water
  water_temp_f?: number;
  // Atmosphere
  air_temp_f?: number;
  pressure_mb?: number;
  pressure_tendency?: string;
  // Visibility
  visibility_nm?: number;
  // Status
  data_age_minutes?: number;
  is_recent: boolean;
}

export interface InletWeather {
  inlet_id: string;
  inlet_name: string;
  buoy_station: string;
  distance_nm: number;
  conditions: BuoyData | null;
  forecast?: any; // Future: add forecast data
  last_updated: Date;
}

// Map inlets to their nearest NOAA buoy stations
// East Coast primary buoys with good data coverage
export const INLET_BUOY_MAP: Record<string, { primary: string; backup?: string; name: string }> = {
  // Florida Atlantic Coast
  'jupiter-inlet': { 
    primary: '41114', // Fort Pierce buoy (20nm north)
    backup: 'LKWF1',  // Lake Worth station
    name: 'Fort Pierce Buoy'
  },
  'palm-beach-inlet': { 
    primary: 'LKWF1', // Lake Worth Pier
    backup: '41114',
    name: 'Lake Worth Station'
  },
  'boynton-inlet': { 
    primary: 'LKWF1', // Lake Worth Pier
    backup: '41114',
    name: 'Lake Worth Station'
  },
  'boca-inlet': { 
    primary: '41114', // Fort Pierce buoy
    backup: 'LKWF1',
    name: 'Fort Pierce Buoy'
  },
  'port-everglades': { 
    primary: 'PVGF1', // Port Everglades station
    backup: '41114',
    name: 'Port Everglades Station'
  },
  'government-cut': { 
    primary: 'VAKF1', // Virginia Key station
    backup: 'PVGF1',
    name: 'Virginia Key Station'
  },
  'st-lucie-inlet': { 
    primary: '41114', // Fort Pierce buoy
    name: 'Fort Pierce Buoy'
  },
  'fort-pierce-inlet': { 
    primary: '41114', // Fort Pierce buoy (closest)
    name: 'Fort Pierce Buoy'
  },
  'sebastian-inlet': { 
    primary: '41113', // Cape Canaveral buoy
    backup: '41114',
    name: 'Cape Canaveral Buoy'
  },
  'ponce-inlet': { 
    primary: 'PCLF1', // Ponce de Leon Inlet
    backup: '41113',
    name: 'Ponce Inlet Station'
  },
  'port-canaveral': { 
    primary: '41113', // Cape Canaveral buoy
    name: 'Cape Canaveral Buoy'
  },
  
  // Georgia/South Carolina
  'st-marys-entrance': { 
    primary: '41112', // Fernandina Beach buoy
    name: 'Fernandina Beach Buoy'
  },
  'st-simons-sound': { 
    primary: '41112', // Fernandina Beach buoy
    backup: '41008',  // Grays Reef buoy
    name: 'Fernandina Beach Buoy'
  },
  'savannah-river': { 
    primary: '41008', // Grays Reef buoy
    name: 'Grays Reef Buoy'
  },
  'port-royal-sound': { 
    primary: '41004', // EDISTO buoy
    name: 'Edisto Buoy'
  },
  'charleston-harbor': { 
    primary: '41004', // EDISTO buoy
    backup: 'CHTS1',  // Charleston station
    name: 'Edisto Buoy'
  },
  
  // North Carolina
  'georgetown-entrance': { 
    primary: '41013', // Frying Pan Shoals buoy
    name: 'Frying Pan Shoals Buoy'
  },
  'cape-fear-river': { 
    primary: '41013', // Frying Pan Shoals buoy
    name: 'Frying Pan Shoals Buoy'
  },
  'beaufort-inlet': { 
    primary: '41013', // Frying Pan Shoals buoy
    backup: '41025',  // Diamond Shoals
    name: 'Frying Pan Shoals Buoy'
  },
  'ocracoke-inlet': { 
    primary: '41025', // Diamond Shoals buoy
    name: 'Diamond Shoals Buoy'
  },
  'oregon-inlet': { 
    primary: '41025', // Diamond Shoals buoy
    name: 'Diamond Shoals Buoy'
  },
  
  // Virginia/Maryland
  'chesapeake-bay': { 
    primary: '44014', // Virginia Beach buoy
    backup: 'CBBV2',  // Chesapeake Bay Bridge
    name: 'Virginia Beach Buoy'
  },
  'ocean-city-inlet': { 
    primary: '44009', // Delaware Bay buoy
    name: 'Delaware Bay Buoy'
  },
  
  // New Jersey
  'cape-may-inlet': { 
    primary: '44009', // Delaware Bay buoy
    name: 'Delaware Bay Buoy'
  },
  'atlantic-city': { 
    primary: '44091', // Barnegat buoy
    name: 'Barnegat Buoy'
  },
  'barnegat-inlet': { 
    primary: '44091', // Barnegat buoy
    name: 'Barnegat Buoy'
  },
  'manasquan-inlet': { 
    primary: '44025', // Long Island buoy
    backup: '44091',
    name: 'Long Island Buoy'
  },
  
  // New York
  'fire-island-inlet': { 
    primary: '44025', // Long Island buoy
    name: 'Long Island Buoy'
  },
  'shinnecock-inlet': { 
    primary: '44025', // Long Island buoy
    backup: '44017',  // Montauk Point
    name: 'Long Island Buoy'
  },
  'montauk-point': { 
    primary: '44017', // Montauk Point buoy
    name: 'Montauk Point Buoy'
  },
  
  // Default for unknown inlets
  'default': { 
    primary: '41114', // Fort Pierce (central East Coast)
    name: 'Fort Pierce Buoy'
  }
};

/**
 * Fetch real-time data from NOAA buoy
 */
export async function fetchBuoyData(stationId: string): Promise<BuoyData | null> {
  try {
    // NOAA's National Data Buoy Center API
    // Latest observation endpoint
    const response = await fetch(
      `https://www.ndbc.noaa.gov/data/realtime2/${stationId}.txt`,
      { 
        next: { revalidate: 600 }, // Cache for 10 minutes
        headers: {
          'User-Agent': 'AlwaysBent/1.0 (Fishing App)'
        }
      }
    );

    if (!response.ok) {
      
      return null;
    }

    const text = await response.text();
    const lines = text.split('\n').filter(l => l.trim());
    
    if (lines.length < 3) {
      
      return null;
    }

    // Parse header to find column indices
    const header = lines[0].split(/\s+/);
    const units = lines[1].split(/\s+/);
    const data = lines[2].split(/\s+/); // Most recent observation

    // Helper to get value by column name
    const getValue = (colName: string): number | undefined => {
      const idx = header.indexOf(colName);
      if (idx === -1 || !data[idx] || data[idx] === 'MM') return undefined;
      return parseFloat(data[idx]);
    };

    // Parse date/time
    const year = getValue('YY') || getValue('#YY');
    const month = getValue('MM');
    const day = getValue('DD');
    const hour = getValue('hh');
    const minute = getValue('mm');
    
    const timestamp = year && month && day 
      ? new Date(Date.UTC(2000 + year, month - 1, day, hour || 0, minute || 0))
      : new Date();

    // Convert units
    const windSpeedMs = getValue('WSPD');
    const windSpeedKt = windSpeedMs ? windSpeedMs * 1.94384 : undefined;
    
    const waveHeightM = getValue('WVHT');
    const waveHeightFt = waveHeightM ? waveHeightM * 3.28084 : undefined;
    
    const waterTempC = getValue('WTMP');
    const waterTempF = waterTempC ? (waterTempC * 9/5) + 32 : undefined;
    
    const airTempC = getValue('ATMP');
    const airTempF = airTempC ? (airTempC * 9/5) + 32 : undefined;

    const dataAge = Date.now() - timestamp.getTime();
    const dataAgeMinutes = Math.floor(dataAge / 60000);

    return {
      station_id: stationId,
      station_name: INLET_BUOY_MAP[stationId]?.name || stationId,
      lat: getValue('LAT') || 0,
      lon: getValue('LON') || 0,
      timestamp,
      
      // Wind
      wind_speed_kt: windSpeedKt,
      wind_direction: getValue('WDIR') || getValue('WD'),
      wind_gust_kt: getValue('GST') ? getValue('GST')! * 1.94384 : undefined,
      
      // Waves
      wave_height_ft: waveHeightFt,
      wave_period_sec: getValue('DPD') || getValue('APD'),
      wave_direction: getValue('MWD'),
      dominant_wave_period: getValue('DPD'),
      
      // Water/Air
      water_temp_f: waterTempF,
      air_temp_f: airTempF,
      pressure_mb: getValue('PRES') || getValue('BARO'),
      pressure_tendency: getValue('PTDY') ? 
        (getValue('PTDY')! > 0 ? 'rising' : 'falling') : undefined,
      
      // Visibility
      visibility_nm: getValue('VIS') ? getValue('VIS')! * 0.539957 : undefined,
      
      // Metadata
      data_age_minutes: dataAgeMinutes,
      is_recent: dataAgeMinutes < 120 // Data less than 2 hours old
    };

  } catch (error) {
    
    return null;
  }
}

/**
 * Get weather for a specific inlet
 */
export async function getInletWeather(inletId: string): Promise<InletWeather> {
  const buoyConfig = INLET_BUOY_MAP[inletId] || INLET_BUOY_MAP['default'];
  
  // Try primary buoy first
  let conditions = await fetchBuoyData(buoyConfig.primary);
  
  // Fall back to backup if available
  if (!conditions && buoyConfig.backup) {
    
    conditions = await fetchBuoyData(buoyConfig.backup);
  }
  
  return {
    inlet_id: inletId,
    inlet_name: inletId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    buoy_station: conditions?.station_id || buoyConfig.primary,
    distance_nm: 0, // Distance calculated on client side
    conditions,
    last_updated: new Date()
  };
}

/**
 * Format wind for display
 */
export function formatWind(speed?: number, direction?: number): string {
  if (!speed) return 'Calm';
  
  const directionText = direction ? getCompassDirection(direction) : '';
  return `${Math.round(speed)} kts ${directionText}`.trim();
}

/**
 * Format waves for display
 */
export function formatWaves(height?: number, period?: number): string {
  if (!height) return 'Flat';
  
  const heightText = `${height.toFixed(1)} ft`;
  const periodText = period ? `@ ${Math.round(period)}s` : '';
  return `${heightText} ${periodText}`.trim();
}

/**
 * Convert degrees to compass direction
 */
function getCompassDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Get fishing conditions assessment
 */
export function assessFishingConditions(data: BuoyData): {
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  factors: string[];
} {
  const factors: string[] = [];
  let score = 100;
  
  // Wind conditions
  if (data.wind_speed_kt) {
    if (data.wind_speed_kt < 10) {
      factors.push('Light winds');
    } else if (data.wind_speed_kt < 15) {
      factors.push('Moderate winds');
      score -= 10;
    } else if (data.wind_speed_kt < 20) {
      factors.push('Fresh winds');
      score -= 20;
    } else {
      factors.push('Strong winds');
      score -= 40;
    }
  }
  
  // Wave conditions
  if (data.wave_height_ft) {
    if (data.wave_height_ft < 2) {
      factors.push('Calm seas');
    } else if (data.wave_height_ft < 4) {
      factors.push('Light chop');
      score -= 10;
    } else if (data.wave_height_ft < 6) {
      factors.push('Moderate seas');
      score -= 25;
    } else {
      factors.push('Rough seas');
      score -= 40;
    }
  }
  
  // Water temperature (optimal 68-78°F for most species)
  if (data.water_temp_f) {
    if (data.water_temp_f >= 68 && data.water_temp_f <= 78) {
      factors.push('Ideal water temp');
    } else if (data.water_temp_f >= 60 && data.water_temp_f <= 85) {
      factors.push('Good water temp');
      score -= 10;
    } else {
      factors.push('Challenging water temp');
      score -= 20;
    }
  }
  
  // Determine rating
  let rating: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 80) rating = 'excellent';
  else if (score >= 60) rating = 'good';
  else if (score >= 40) rating = 'fair';
  else rating = 'poor';
  
  return { rating, factors };
}
