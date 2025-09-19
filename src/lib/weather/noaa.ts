/**
 * NOAA Buoy Data Integration
 * Free weather data from NOAA buoys for community features
 * Last updated: 2025-09-19 - Force Vercel rebuild
 */

// Map inlet IDs to nearest NOAA buoy stations
export const INLET_BUOY_MAP: { [key: string]: { primary: string; backup?: string; name: string } } = {
  // Maine
  'me-casco-bay': { primary: '44007', name: 'Portland Buoy' },
  
  // Massachusetts  
  'ma-cape-cod-canal': { primary: '44018', name: 'Cape Cod Bay' },
  'ma-stellwagen-bank': { primary: '44013', name: 'Boston Buoy' },
  
  // Rhode Island
  'ri-block-island': { primary: '44097', name: 'Block Island' },
  
  // New York
  'ny-montauk': { primary: '44017', name: 'Montauk Point' },
  'ny-fire-island': { primary: '44025', backup: '44065', name: 'Long Island Buoy' },
  
  // New Jersey
  'nj-barnegat': { primary: '44091', backup: '44065', name: 'Barnegat Bay' },
  'nj-cape-may': { primary: '44009', name: 'Delaware Bay' },
  
  // Delaware
  'de-indian-river': { primary: '44009', name: 'Delaware Bay' },
  
  // Maryland
  'md-ocean-city': { primary: '44009', backup: '44014', name: 'Delaware Bay' },
  
  // Virginia
  'va-rudee': { primary: '44014', backup: '44099', name: 'Virginia Beach' },
  'va-lynnhaven': { primary: '44014', name: 'Virginia Beach' },
  
  // North Carolina
  'nc-oregon-inlet': { primary: '44095', backup: '44100', name: 'Oregon Inlet' },
  'nc-hatteras': { primary: '41025', name: 'Diamond Shoals' },
  'nc-ocracoke': { primary: '41025', backup: '44095', name: 'Diamond Shoals' },
  'nc-beaufort': { primary: '41013', name: 'Frying Pan Shoals' },
  'nc-morehead': { primary: '41013', backup: '41035', name: 'Frying Pan Shoals' },
  
  // South Carolina
  'sc-murrells': { primary: '41004', name: 'EDISTO' },
  'sc-charleston': { primary: '41004', backup: '41008', name: 'EDISTO' },
  
  // Georgia
  'ga-savannah': { primary: '41008', name: 'Grays Reef' },
  
  // Florida
  'fl-mayport': { primary: '41112', backup: '41008', name: 'Offshore Fernandina Beach' },
  'fl-ponce': { primary: '41113', name: 'Cape Canaveral Nearshore' },
  
  // Default
  'default': { primary: '44025', name: 'Long Island Buoy' }
};

export interface NOAABuoyData {
  station_id: string;
  station_name: string;
  time: Date;
  wind_direction: number | null;
  wind_speed: number | null;
  wind_gust: number | null;
  wave_height: number | null;
  dominant_wave_period: number | null;
  average_wave_period: number | null;
  wave_direction: number | null;
  sea_pressure: number | null;
  air_temp: number | null;
  water_temp: number | null;
  dewpoint: number | null;
  visibility: number | null;
  tide: number | null;
}

/**
 * Parse NOAA buoy data from their text format
 */
function parseBuoyData(text: string, stationId: string, stationName: string): NOAABuoyData | null {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 3) return null;

  // First line is header with column names
  const headers = lines[0].replace('#', '').trim().split(/\s+/);
  
  // Second line is units (skip)
  // Third line is the most recent data
  const data = lines[2].trim().split(/\s+/);
  
  // Map headers to data
  const getValue = (header: string): number | null => {
    const index = headers.indexOf(header);
    if (index === -1 || !data[index] || data[index] === 'MM') return null;
    return parseFloat(data[index]);
  };

  // Parse date/time
  const year = getValue('YY');
  const month = getValue('MM');
  const day = getValue('DD');
  const hour = getValue('hh');
  const minute = getValue('mm');
  
  if (!year || !month || !day || !hour) return null;
  
  const time = new Date(Date.UTC(
    year < 100 ? 2000 + year : year,
    month - 1,
    day,
    hour,
    minute || 0
  ));

  return {
    station_id: stationId,
    station_name: stationName,
    time,
    wind_direction: getValue('WDIR'),
    wind_speed: getValue('WSPD') ? getValue('WSPD')! * 1.94384 : null, // m/s to knots
    wind_gust: getValue('GST') ? getValue('GST')! * 1.94384 : null, // m/s to knots
    wave_height: getValue('WVHT') ? getValue('WVHT')! * 3.28084 : null, // m to ft
    dominant_wave_period: getValue('DPD'),
    average_wave_period: getValue('APD'),
    wave_direction: getValue('MWD'),
    sea_pressure: getValue('PRES') ? getValue('PRES')! * 0.02953 : null, // mb to inHg
    air_temp: getValue('ATMP') ? getValue('ATMP')! * 9/5 + 32 : null, // C to F
    water_temp: getValue('WTMP') ? getValue('WTMP')! * 9/5 + 32 : null, // C to F
    dewpoint: getValue('DEWP') ? getValue('DEWP')! * 9/5 + 32 : null, // C to F
    visibility: getValue('VIS') ? getValue('VIS')! * 0.621371 : null, // km to miles
    tide: getValue('TIDE')
  };
}

/**
 * Fetch data from a NOAA buoy
 */
export async function fetchBuoyData(stationId: string): Promise<NOAABuoyData | null> {
  try {
    const url = `https://www.ndbc.noaa.gov/data/realtime2/${stationId}.txt`;
    const response = await fetch(url);
    
    if (!response.ok) {
      
      return null;
    }

    const text = await response.text();
    const stationName = INLET_BUOY_MAP[stationId]?.name || stationId;
    
    return parseBuoyData(text, stationId, stationName);
  } catch (error) {
    
    return null;
  }
}

/**
 * Get weather data for an inlet
 */
export async function getInletWeather(inletId: string): Promise<NOAABuoyData | null> {
  const buoyConfig = INLET_BUOY_MAP[inletId] || INLET_BUOY_MAP.default;
  
  // Try primary buoy first
  let data = await fetchBuoyData(buoyConfig.primary);
  
  // If primary fails and backup exists, try backup
  if (!data && buoyConfig.backup) {
    
    data = await fetchBuoyData(buoyConfig.backup);
  }
  
  return data;
}

/**
 * Format NOAA data for display
 */
export function formatNOAAData(data: NOAABuoyData) {
  const formatWind = () => {
    if (!data.wind_speed) return 'No data';
    const speed = Math.round(data.wind_speed);
    const gust = data.wind_gust ? ` G${Math.round(data.wind_gust)}` : '';
    const dir = data.wind_direction ? ` ${getCompassDirection(data.wind_direction)}` : '';
    return `${speed}${gust} kts${dir}`;
  };

  const formatWaves = () => {
    if (!data.wave_height) return 'No data';
    const height = data.wave_height.toFixed(1);
    const period = data.dominant_wave_period ? ` @ ${Math.round(data.dominant_wave_period)}s` : '';
    const dir = data.wave_direction ? ` ${getCompassDirection(data.wave_direction)}` : '';
    return `${height} ft${period}${dir}`;
  };

  const formatTemp = (temp: number | null, label: string) => {
    if (!temp) return `${label}: --`;
    return `${label}: ${Math.round(temp)}°F`;
  };

  const formatTime = () => {
    const now = new Date();
    const age = Math.round((now.getTime() - data.time.getTime()) / (1000 * 60));
    if (age < 60) return `${age} min ago`;
    if (age < 120) return '1 hour ago';
    return `${Math.floor(age / 60)} hours ago`;
  };

  return {
    wind: formatWind(),
    waves: formatWaves(),
    airTemp: formatTemp(data.air_temp, 'Air'),
    waterTemp: formatTemp(data.water_temp, 'Water'),
    pressure: data.sea_pressure ? `${data.sea_pressure.toFixed(2)} inHg` : '--',
    visibility: data.visibility ? `${Math.round(data.visibility)} mi` : '--',
    time: formatTime(),
    raw: data
  };
}

/**
 * Get compass direction from degrees
 */
function getCompassDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Type alias for compatibility with weather components
// IMPORTANT: These exports are used by UnifiedCommandCenter, UnifiedOceanConditions, WeatherDisplay
export type InletWeather = {
  conditions: NOAABuoyData;
  station: string;
};

// Export helper functions for formatting
export function formatWind(speedKt: number | null, direction: number | null): string {
  if (speedKt === null || speedKt === undefined) return '--';
  const directionText = direction !== null ? getCompassDirection(direction) : '';
  return `${Math.round(speedKt)}kt ${directionText}`.trim();
}

export function formatWaves(heightFt: number | null, periodSec: number | null): string {
  if (heightFt === null || heightFt === undefined) return '--';
  const periodText = periodSec !== null ? ` @ ${Math.round(periodSec)}s` : '';
  return `${heightFt.toFixed(1)}ft${periodText}`;
}

export function assessFishingConditions(conditions: NOAABuoyData) {
  const { wind_speed, wave_height } = conditions;
  
  let rating: 'excellent' | 'good' | 'fair' | 'poor';
  let description: string;
  
  // Handle null values
  const windSpeed = wind_speed || 0;
  const waveHeight = wave_height || 0;
  
  if (windSpeed <= 10 && waveHeight <= 3) {
    rating = 'excellent';
    description = 'Perfect conditions';
  } else if (windSpeed <= 15 && waveHeight <= 5) {
    rating = 'good';
    description = 'Good fishing weather';
  } else if (windSpeed <= 20 && waveHeight <= 7) {
    rating = 'fair';
    description = 'Fishable conditions';
  } else {
    rating = 'poor';
    description = 'Challenging conditions';
  }
  
  return { rating, description };
}