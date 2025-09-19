import { NextRequest, NextResponse } from 'next/server';

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
    
    // Make request to Stormglass API (using STORMGLASS_API_KEY)
    const stormglassApiKey = process.env.STORMGLASS_API_KEY || process.env.STORMIO_API_KEY;
    if (!stormglassApiKey) {
      console.error('STORMGLASS_API_KEY not configured');
      // Return mock data for development
      const mockData = generateMockStormioData(parseFloat(lat), parseFloat(lng));
      return NextResponse.json(mockData);
    }
    
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
      // Return mock data on error
      const mockData = generateMockStormioData(parseFloat(lat), parseFloat(lng));
      mockData.sources = [{
        id: 'stormglass',
        status: 'error',
        lastIso: new Date().toISOString()
      }];
      return NextResponse.json(mockData);
    }
    
    const weatherData = await weatherResponse.json();
    
    // Fetch tide data
    const tideResponse = await fetch(tideUrl, {
      headers: {
        'Authorization': stormglassApiKey,
        'Accept': 'application/json'
      }
    });
    
    let tideData = null;
    if (tideResponse.ok) {
      tideData = await tideResponse.json();
    }
    
    // Fetch astronomy data (moon phase, sunrise/sunset)
    const astronomyResponse = await fetch(astronomyUrl, {
      headers: {
        'Authorization': stormglassApiKey,
        'Accept': 'application/json'
      }
    });
    
    let astronomyData = null;
    if (astronomyResponse.ok) {
      astronomyData = await astronomyResponse.json();
    }
    
    // Get the first hour of data from Stormglass
    const currentHour = weatherData.hours?.[0] || {};
    const waterTemp = currentHour.waterTemperature?.noaa || currentHour.waterTemperature?.sg || 22;
    const windSpeed = currentHour.windSpeed?.noaa || currentHour.windSpeed?.sg || 10;
    const windDir = currentHour.windDirection?.noaa || currentHour.windDirection?.sg || 45;
    const waveHeight = currentHour.waveHeight?.noaa || currentHour.waveHeight?.sg || 1;
    const wavePeriod = currentHour.wavePeriod?.noaa || currentHour.wavePeriod?.sg || 8;
    const pressure = currentHour.pressure?.noaa || currentHour.pressure?.sg || 1013;
    const airTemp = currentHour.airTemperature?.noaa || currentHour.airTemperature?.sg || 25;
    
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
        id: 'stormglass',
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
  return {
    tides: generateMockTides(),
    moon: calculateMoonPhase(),
    sun: calculateSunTimes(lat, lng),
    weather: {
      sstC: 22 + Math.random() * 4,
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
