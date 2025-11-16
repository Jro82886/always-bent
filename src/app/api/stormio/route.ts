import { NextRequest, NextResponse } from 'next/server';
import { lonLat2pixel } from '@/lib/wmts/coordinates';
import { WMTS_LAYERS, buildGetFeatureInfoUrl } from '@/lib/wmts/layers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Cache responses for 30 seconds to protect rate limits
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

import type { StormioSnapshot } from '@/types/stormio';

interface StormioResponse extends StormioSnapshot {
  sources: Array<{
    id: string;
    status: 'ok' | 'stale' | 'error';
    lastIso: string;
  }>;
}

// Copernicus credentials
const COPERNICUS_USER = process.env.COPERNICUS_USER || '';
const COPERNICUS_PASS = process.env.COPERNICUS_PASS || '';

/**
 * Fetch SST from Copernicus GetFeatureInfo (PRIMARY DATA SOURCE)
 * Returns temperature in Celsius or null if unavailable
 */
async function fetchCopernicusSST(lat: number, lng: number): Promise<number | null> {
  if (!COPERNICUS_USER || !COPERNICUS_PASS) {
    console.log('[COPERNICUS] Credentials not configured');
    return null;
  }

  try {
    // Use yesterday's date (Copernicus has 1-2 day processing lag)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const timeParam = yesterday.toISOString().split('T')[0];

    // Use zoom 8 for good balance of coverage and resolution
    const zoom = 8;

    const url = buildGetFeatureInfoUrl(
      WMTS_LAYERS.SST,
      0, 0, 0, 0, // Placeholder values - buildGetFeatureInfoUrl doesn't use these directly
      zoom,
      timeParam,
      { user: COPERNICUS_USER, pass: COPERNICUS_PASS }
    );

    // Actually we need to calculate tile coordinates properly
    const { tileCol, tileRow, i, j } = lonLat2pixel(lng, lat, zoom);

    // Build proper URL with calculated coordinates
    const params = new URLSearchParams({
      service: 'WMTS',
      request: 'GetFeatureInfo',
      version: '1.0.0',
      layer: WMTS_LAYERS.SST.layerPath,
      tilematrixset: 'EPSG:3857',
      tilematrix: zoom.toString(),
      tilerow: tileRow.toString(),
      tilecol: tileCol.toString(),
      i: i.toString(),
      j: j.toString(),
      infoformat: 'application/json',
      time: timeParam
    });

    const copernicusUrl = `https://wmts.marine.copernicus.eu/teroWmts?${params}`;

    const response = await fetch(copernicusUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${COPERNICUS_USER}:${COPERNICUS_PASS}`).toString('base64'),
        'Accept': 'application/json',
        'User-Agent': 'alwaysbent-abfi'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      console.log(`[COPERNICUS] HTTP ${response.status} for lat=${lat}, lng=${lng}`);
      return null;
    }

    const data = await response.json();

    // Extract temperature (in Kelvin)
    let tempK: number | null = null;
    if (data.features && data.features.length > 0) {
      tempK = data.features[0].properties?.analysed_sst ||
              data.features[0].properties?.value;
    }

    if (tempK !== null && tempK !== undefined) {
      // Convert Kelvin to Celsius
      const tempC = tempK - 273.15;
      console.log(`[COPERNICUS] ✓ SST for lat=${lat}, lng=${lng}: ${tempK.toFixed(2)}K (${tempC.toFixed(1)}°C)`);
      return tempC;
    }

    console.log(`[COPERNICUS] No data in response for lat=${lat}, lng=${lng}`);
    return null;

  } catch (error: any) {
    console.log(`[COPERNICUS] Error: ${error.message}`);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'lat and lng parameters are required' },
        { status: 400 }
      );
    }
    
    // Check cache
    const cacheKey = `${lat},${lng}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // PRIMARY: Try Copernicus SST first (satellite data)
    console.log(`[STORMIO] Attempting Copernicus SST for lat=${lat}, lng=${lng}`);
    const copernicusTemp = await fetchCopernicusSST(parseFloat(lat), parseFloat(lng));

    // FALLBACK: Try Stormglass API if Copernicus fails
    const stormglassApiKey = process.env.STORMGLASS_API_KEY || process.env.STORMIO_API_KEY;
    let useStormglass = false;

    if (!copernicusTemp && stormglassApiKey) {
      console.log('[STORMIO] Copernicus failed, trying StormGlass API');
      useStormglass = true;
    } else if (!copernicusTemp && !stormglassApiKey) {
      console.log('[STORMIO] Both Copernicus and StormGlass unavailable, using mock data');
      const mockData = generateMockStormioData(parseFloat(lat), parseFloat(lng));
      return NextResponse.json(mockData);
    }
    
    // Fetch from StormGlass only if needed (fallback)
    let weatherData: any = null;
    let tideData: any = null;
    let astronomyData: any = null;

    if (useStormglass) {
      // Using Stormglass API v2
      const stormglassUrl = `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=waterTemperature,windSpeed,windDirection,waveHeight,wavePeriod,pressure,airTemperature&source=noaa,sg`;
      const tideUrl = `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lng}`;
      const astronomyUrl = `https://api.stormglass.io/v2/astronomy/point?lat=${lat}&lng=${lng}`;

      // Fetch weather data
      const weatherResponse = await fetch(stormglassUrl, {
        headers: {
          'Authorization': stormglassApiKey,
          'Accept': 'application/json'
        }
      });

      if (!weatherResponse.ok) {
        console.error('Stormglass weather API error:', weatherResponse.status);
        // If StormGlass fails, use Copernicus data if available
        if (copernicusTemp) {
          console.log('[STORMIO] StormGlass failed, using Copernicus SST with mock supplemental data');
          useStormglass = false; // Fall through to Copernicus-only path below
        } else {
          // Return mock data on error
          const mockData = generateMockStormioData(parseFloat(lat), parseFloat(lng));
          mockData.sources = [{
            id: 'stormglass',
            status: 'error',
            lastIso: new Date().toISOString()
          }];
          return NextResponse.json(mockData);
        }
      } else {
        weatherData = await weatherResponse.json();
      }
    }

    // Only fetch tides and astronomy if we're using StormGlass successfully
    if (useStormglass && weatherData) {
      const tideUrl = `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lng}`;
      const astronomyUrl = `https://api.stormglass.io/v2/astronomy/point?lat=${lat}&lng=${lng}`;

      // Fetch tide data
      const tideResponse = await fetch(tideUrl, {
        headers: {
          'Authorization': stormglassApiKey!,
          'Accept': 'application/json'
        }
      });

      if (tideResponse.ok) {
        tideData = await tideResponse.json();
      }

      // Fetch astronomy data (moon phase, sunrise/sunset)
      const astronomyResponse = await fetch(astronomyUrl, {
        headers: {
          'Authorization': stormglassApiKey!,
          'Accept': 'application/json'
        }
      });

      if (astronomyResponse.ok) {
        astronomyData = await astronomyResponse.json();
      }
    }
    
    // Get weather data - prioritize Copernicus SST if available
    const currentHour = weatherData?.hours?.[0] || {};

    // CRITICAL: Use Copernicus SST if available, otherwise StormGlass or default
    const waterTemp = copernicusTemp !== null ? copernicusTemp :
                      (currentHour.waterTemperature?.noaa || currentHour.waterTemperature?.sg || 14);

    const windSpeed = currentHour.windSpeed?.noaa || currentHour.windSpeed?.sg || 10;
    const windDir = currentHour.windDirection?.noaa || currentHour.windDirection?.sg || 45;
    const waveHeight = currentHour.waveHeight?.noaa || currentHour.waveHeight?.sg || 1;
    const wavePeriod = currentHour.wavePeriod?.noaa || currentHour.wavePeriod?.sg || 8;
    const pressure = currentHour.pressure?.noaa || currentHour.pressure?.sg || 1013;
    const airTemp = currentHour.airTemperature?.noaa || currentHour.airTemperature?.sg || 20;
    
    // Convert wind direction degrees to compass
    const getWindDirection = (degrees: number) => {
      const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      const index = Math.round(degrees / 22.5) % 16;
      return directions[index];
    };
    
    // Process tide data to normalized format
    const tides = tideData?.data ? {
      next: tideData.data[0] ? {
        type: tideData.data[0].type as 'high' | 'low',
        timeIso: tideData.data[0].time,
        heightM: tideData.data[0].height
      } : { type: 'high' as const, timeIso: new Date().toISOString(), heightM: 1.5 },
      events: tideData.data.slice(0, 4).map((tide: any) => ({
        type: tide.type as 'high' | 'low',
        timeIso: tide.time,
        heightM: tide.height
      }))
    } : generateMockTides();
    
    // Process astronomy data
    const astroData = astronomyData?.data?.[0] || {};
    const moonPhase = astroData.moonPhase ? {
      phase: getMoonPhaseName(astroData.moonPhase.current.value),
      illumPct: Math.round(astroData.moonFraction?.current?.value * 100) || 50
    } : calculateMoonPhase();
    
    const sun = astroData.sunrise && astroData.sunset ? {
      sunriseIso: astroData.sunrise,
      sunsetIso: astroData.sunset
    } : calculateSunTimes(parseFloat(lat), parseFloat(lng));
    
    // Normalize to exact StormioSnapshot format
    const normalized: StormioResponse = {
      weather: {
        sstC: waterTemp,
        windKt: windSpeed * 1.94384, // m/s to knots
        windDir: getWindDirection(windDir),
        swellFt: waveHeight * 3.28084, // meters to feet
        swellPeriodS: wavePeriod,
        pressureHpa: pressure,
        pressureTrend: 'steady' // Would need historical data
      },
      moon: moonPhase,
      tides,
      sun,
      lastIso: new Date().toISOString(),
      sources: [{
        id: copernicusTemp !== null ? 'copernicus' : (useStormglass ? 'stormglass' : 'mock'),
        status: 'ok',
        lastIso: new Date().toISOString()
      }]
    };
    
    // Update cache
    cache.set(cacheKey, { data: normalized, timestamp: Date.now() });
    
    return NextResponse.json(normalized);
    
  } catch (error) {
    console.error('Stormio API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch weather data',
        sources: [{
          id: 'stormio',
          status: 'error',
          lastIso: new Date().toISOString()
        }]
      },
      { status: 500 }
    );
  }
}

// Helper functions for mock data and calculations
function generateMockStormioData(lat: number, lng: number): StormioResponse {
  const now = new Date();
  const month = now.getMonth(); // 0 = January, 10 = November

  // Season-aware SST for US East Coast (latitude ~38-40°N) in KELVIN
  // Based on actual Ocean City, MD seasonal temperatures
  const seasonalSSTKelvin = [
    281.15,  // Jan: ~46°F / 8°C
    280.15,  // Feb: ~45°F / 7°C
    282.15,  // Mar: ~48°F / 9°C
    284.15,  // Apr: ~52°F / 11°C
    287.15,  // May: ~57°F / 14°C
    292.15,  // Jun: ~66°F / 19°C
    296.15,  // Jul: ~73°F / 23°C
    297.15,  // Aug: ~75°F / 24°C
    295.15,  // Sep: ~72°F / 22°C
    291.15,  // Oct: ~64°F / 18°C
    287.15,  // Nov: ~57°F / 14°C
    283.15   // Dec: ~50°F / 10°C
  ];

  const baseTempK = seasonalSSTKelvin[month];

  return {
    tides: generateMockTides(),
    moon: calculateMoonPhase(),
    sun: calculateSunTimes(lat, lng),
    weather: {
      sstC: baseTempK - 273.15 + Math.random() * 2 - 1, // Convert to Celsius for API compatibility, ±1°C variation
      windKt: 8 + Math.random() * 12,
      windDir: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
      swellFt: 2 + Math.random() * 4,
      swellPeriodS: 6 + Math.random() * 6,
      pressureHpa: 1008 + Math.random() * 10,
      pressureTrend: ['rising', 'falling', 'steady'][Math.floor(Math.random() * 3)] as 'rising' | 'falling' | 'steady'
    },
    lastIso: now.toISOString(),
    sources: [{
      id: 'stormio',
      status: 'ok',
      lastIso: now.toISOString()
    }]
  };
}

function generateMockTides() {
  const now = new Date();
  const events = [];
  
  // Generate 4 tide events
  for (let i = 0; i < 4; i++) {
    const time = new Date(now);
    time.setHours(6 + i * 6, Math.floor(Math.random() * 60));
    events.push({
      type: (i % 2 === 0 ? 'high' : 'low') as 'high' | 'low',
      timeIso: time.toISOString(),
      heightM: i % 2 === 0 ? 1.0 + Math.random() * 0.5 : 0.2 + Math.random() * 0.3
    });
  }
  
  return {
    next: events[0],
    events
  };
}

function getMoonPhaseName(phase: number): string {
  // Stormglass provides phase as 0-1
  if (phase < 0.0625) return 'New Moon';
  else if (phase < 0.1875) return 'Waxing Crescent';
  else if (phase < 0.3125) return 'First Quarter';
  else if (phase < 0.4375) return 'Waxing Gibbous';
  else if (phase < 0.5625) return 'Full Moon';
  else if (phase < 0.6875) return 'Waning Gibbous';
  else if (phase < 0.8125) return 'Last Quarter';
  else if (phase < 0.9375) return 'Waning Crescent';
  else return 'New Moon';
}

function calculateMoonPhase() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Simple moon phase calculation
  const julianDate = Math.floor((date.getTime() / 86400000) - (date.getTimezoneOffset() / 1440) + 2440587.5);
  const daysSinceNew = (julianDate - 2451549.5) % 29.53059;
  const phase = daysSinceNew / 29.53059;
  
  let phaseName: string;
  if (phase < 0.0625) phaseName = 'New Moon';
  else if (phase < 0.1875) phaseName = 'Waxing Crescent';
  else if (phase < 0.3125) phaseName = 'First Quarter';
  else if (phase < 0.4375) phaseName = 'Waxing Gibbous';
  else if (phase < 0.5625) phaseName = 'Full Moon';
  else if (phase < 0.6875) phaseName = 'Waning Gibbous';
  else if (phase < 0.8125) phaseName = 'Last Quarter';
  else if (phase < 0.9375) phaseName = 'Waning Crescent';
  else phaseName = 'New Moon';
  
  return {
    phase: phaseName,
    illumPct: Math.round(Math.abs(0.5 - phase) * 200)
  };
}

function calculateSunTimes(lat: number, lng: number) {
  const now = new Date();
  const julianDay = Math.floor((now.getTime() / 86400000) + 2440587.5);
  const n = julianDay - 2451545.0 + 0.0008;
  const meanAnomaly = (357.5291 + 0.98560028 * n) % 360;
  const center = 1.9148 * Math.sin(meanAnomaly * Math.PI / 180);
  const lambda = (280.46 + 0.98565 * n + center) % 360;
  const declination = Math.asin(0.39779 * Math.sin(lambda * Math.PI / 180));
  
  const hourAngle = Math.acos(-Math.tan(lat * Math.PI / 180) * Math.tan(declination));
  const sunrise = 12 - hourAngle * 12 / Math.PI - lng / 15;
  const sunset = 12 + hourAngle * 12 / Math.PI - lng / 15;
  
  const sunriseTime = new Date(now);
  sunriseTime.setHours(Math.floor(sunrise), Math.round((sunrise % 1) * 60));
  
  const sunsetTime = new Date(now);
  sunsetTime.setHours(Math.floor(sunset), Math.round((sunset % 1) * 60));
  
  return {
    sunriseIso: sunriseTime.toISOString(),
    sunsetIso: sunsetTime.toISOString()
  };
}
