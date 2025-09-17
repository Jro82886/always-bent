/**
 * Data validation and sanitization
 * Prevents injection attacks and bad data
 */

// Coordinate validation
export function validateCoordinates(lat: any, lng: any): boolean {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  
  // Valid latitude: -90 to 90
  // Valid longitude: -180 to 180
  return latitude >= -90 && latitude <= 90 && 
         longitude >= -180 && longitude <= 180;
}

// East Coast bounds validation
export function validateEastCoastBounds(lat: number, lng: number): boolean {
  // Rough East Coast boundaries
  const MIN_LAT = 24;  // Florida Keys
  const MAX_LAT = 45;  // Maine/Canada border
  const MIN_LNG = -82; // Western extent
  const MAX_LNG = -65; // Eastern extent (well offshore)
  
  return lat >= MIN_LAT && lat <= MAX_LAT && 
         lng >= MIN_LNG && lng <= MAX_LNG;
}

// Sanitize user input
export function sanitizeInput(input: any, type: 'string' | 'number' | 'boolean' = 'string'): any {
  if (input === null || input === undefined) {
    return type === 'string' ? '' : type === 'number' ? 0 : false;
  }
  
  switch (type) {
    case 'string':
      // Remove HTML/script tags, limit length
      return String(input)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim()
        .slice(0, 1000); // Max 1000 chars
      
    case 'number':
      const num = parseFloat(input);
      return isNaN(num) ? 0 : num;
      
    case 'boolean':
      return Boolean(input);
      
    default:
      return input;
  }
}

// Validate inlet ID
export function validateInletId(inletId: any): boolean {
  if (typeof inletId !== 'string') return false;
  
  const validInlets = [
    'montauk', 'shinnecock', 'moriches', 'fire-island', 'jones',
    'east-rockaway', 'rockaway', 'sandy-hook', 'manasquan', 'barnegat',
    'little-egg', 'atlantic-city', 'ocean-city', 'cape-may', 'delaware',
    'ocean-city-md', 'chincoteague', 'cape-charles', 'virginia-beach',
    'oregon-inlet', 'cape-hatteras', 'ocracoke', 'beaufort', 'cape-fear',
    'georgetown', 'charleston'
  ];
  
  return validInlets.includes(inletId);
}

// Validate date range
export function validateDateRange(startDate: any, endDate: any): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  // Dates must be within last year and not in future
  return start >= oneYearAgo && start <= now && 
         end >= oneYearAgo && end <= now && 
         start <= end;
}

// Validate polygon bounds
export function validatePolygon(polygon: any): boolean {
  if (!polygon || !polygon.geometry || !polygon.geometry.coordinates) {
    return false;
  }
  
  const coords = polygon.geometry.coordinates[0];
  if (!Array.isArray(coords) || coords.length < 4) {
    return false;
  }
  
  // Check if all coordinates are valid
  for (const coord of coords) {
    if (!Array.isArray(coord) || coord.length !== 2) {
      return false;
    }
    if (!validateCoordinates(coord[1], coord[0])) {
      return false;
    }
  }
  
  // Check if polygon is closed (first and last point are same)
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return false;
  }
  
  return true;
}

// Validate area size (prevent huge selections)
export function validateAreaSize(areaKm2: number): boolean {
  const MAX_AREA = 10000; // 10,000 km² max
  const MIN_AREA = 0.1;    // 0.1 km² min
  
  return areaKm2 >= MIN_AREA && areaKm2 <= MAX_AREA;
}

// Validate API response
export function validateApiResponse(response: any, expectedShape: object): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  // Check if response matches expected shape
  for (const [key, type] of Object.entries(expectedShape)) {
    if (!(key in response)) {
      console.warn(`Missing expected field: ${key}`);
      return false;
    }
    
    const actualType = Array.isArray(response[key]) ? 'array' : typeof response[key];
    if (actualType !== type) {
      console.warn(`Field ${key} has wrong type. Expected ${type}, got ${actualType}`);
      return false;
    }
  }
  
  return true;
}

// Validate temperature value
export function validateTemperature(temp: any, unit: 'F' | 'C' = 'F'): boolean {
  const temperature = parseFloat(temp);
  if (isNaN(temperature)) return false;
  
  if (unit === 'F') {
    // Reasonable Fahrenheit range for ocean
    return temperature >= 28 && temperature <= 95;
  } else {
    // Celsius range
    return temperature >= -2 && temperature <= 35;
  }
}

// Validate vessel data
export function validateVesselData(vessel: any): boolean {
  if (!vessel || typeof vessel !== 'object') return false;
  
  // Required fields
  const required = ['lat', 'lon', 'timestamp'];
  for (const field of required) {
    if (!(field in vessel)) return false;
  }
  
  // Validate coordinates
  if (!validateCoordinates(vessel.lat, vessel.lon)) return false;
  
  // Validate timestamp (not too old, not in future)
  const timestamp = new Date(vessel.timestamp);
  if (isNaN(timestamp.getTime())) return false;
  
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return timestamp >= oneWeekAgo && timestamp <= now;
}

// Sanitize error messages (don't leak sensitive info)
export function sanitizeErrorMessage(error: any): string {
  const message = error?.message || error?.toString() || 'Unknown error';
  
  // Remove sensitive patterns
  const sanitized = message
    .replace(/api[_-]?key[=:]\S+/gi, 'API_KEY=***')
    .replace(/token[=:]\S+/gi, 'TOKEN=***')
    .replace(/password[=:]\S+/gi, 'PASSWORD=***')
    .replace(/\/users\/\d+/g, '/users/***')
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, 'xxx.xxx.xxx.xxx'); // IP addresses
  
  return sanitized.slice(0, 500); // Limit length
}
