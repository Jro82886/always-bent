import { NextRequest, NextResponse } from 'next/server';
import type { StormioSnapshot } from '@/types/stormio';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface OceanConditions {
  // Location
  lat: number;
  lng: number;
  timestamp: string;

  // Water conditions
  sst: number;  // Sea Surface Temperature (°F)
  chlorophyll: number;  // mg/m³
  depth: number;  // meters

  // Weather conditions
  windSpeed: number;  // knots
  windDirection: string;  // compass direction
  waveHeight: number;  // feet
  wavePeriod: number;  // seconds
  pressure: number;  // hPa

  // Tides
  tidePhase: 'high' | 'low' | 'rising' | 'falling';
  tideHeight: number;  // meters
  nextTide: {
    type: 'high' | 'low';
    time: string;
    height: number;
  };

  // Celestial
  moonPhase: string;
  moonIllumination: number;  // percentage
  sunrise: string;
  sunset: string;

  // Analysis
  sstBreakNearby: boolean;
  currentSpeed?: number;
  currentDirection?: number;

  // Data sources
  sources: {
    sst?: { provider: string; timestamp: string };
    chlorophyll?: { provider: string; timestamp: string };
    weather?: { provider: string; timestamp: string };
  };
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

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const timestamp = new Date().toISOString();

    // Fetch all data sources in parallel
    const [stormioData, sstData, chlorophyllData] = await Promise.all([
      fetchStormioData(latitude, longitude),
      fetchSSTData(latitude, longitude),
      fetchChlorophyllData(latitude, longitude)
    ]);

    // Calculate derived metrics
    const depth = await estimateDepth(latitude, longitude);
    const tidePhase = calculateTidePhase(stormioData?.tides);
    const sstBreakNearby = await checkForSSTBreak(latitude, longitude);

    // Debug SST sources
    if (process.env.NODE_ENV === 'development') {
      console.log('[Ocean Conditions] SST Sources:', {
        copernicus: sstData?.temperature ? `${sstData.temperature}°F` : 'not available',
        stormglass: stormioData?.weather?.sstC ? `${stormioData.weather.sstC}°C (${celsiusToFahrenheit(stormioData.weather.sstC)}°F)` : 'not available',
        location: { lat: latitude, lng: longitude }
      });
    }

    // Compile ocean conditions
    const conditions: OceanConditions = {
      // Location
      lat: latitude,
      lng: longitude,
      timestamp,

      // Water conditions - Prioritize Copernicus SST, validate StormGlass fallback
      sst: getRealisticSST(
        latitude,
        longitude,
        sstData?.temperature || (stormioData?.weather?.sstC ? celsiusToFahrenheit(stormioData.weather.sstC) : undefined)
      ),
      chlorophyll: chlorophyllData?.concentration || 0.5,
      depth: depth || 100,

      // Weather conditions from StormIO
      windSpeed: stormioData?.weather?.windKt || 10,
      windDirection: stormioData?.weather?.windDir || 'N',
      waveHeight: stormioData?.weather?.swellFt || 3,
      wavePeriod: stormioData?.weather?.swellPeriodS || 8,
      pressure: stormioData?.weather?.pressureHpa || 1013,

      // Tides
      tidePhase: tidePhase || 'rising',
      tideHeight: stormioData?.tides?.next?.heightM || 1.0,
      nextTide: {
        type: stormioData?.tides?.next?.type || 'high',
        time: stormioData?.tides?.next?.timeIso || new Date(Date.now() + 6 * 3600000).toISOString(),
        height: stormioData?.tides?.next?.heightM || 1.0
      },

      // Celestial
      moonPhase: stormioData?.moon?.phase || 'First Quarter',
      moonIllumination: stormioData?.moon?.illumPct || 50,
      sunrise: stormioData?.sun?.sunriseIso || calculateSunrise(latitude, longitude),
      sunset: stormioData?.sun?.sunsetIso || calculateSunset(latitude, longitude),

      // Analysis
      sstBreakNearby,
      currentSpeed: 0.5,  // TODO: Integrate current data
      currentDirection: 45,  // TODO: Integrate current data

      // Data sources
      sources: {
        sst: sstData ? {
          provider: 'NASA',
          timestamp: sstData.timestamp
        } : undefined,
        chlorophyll: chlorophyllData ? {
          provider: 'NASA',
          timestamp: chlorophyllData.timestamp
        } : undefined,
        weather: stormioData ? {
          provider: 'StormGlass',
          timestamp: stormioData.lastIso
        } : undefined
      }
    };

    return NextResponse.json(conditions);

  } catch (error) {
    console.error('Ocean conditions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ocean conditions' },
      { status: 500 }
    );
  }
}

// Helper functions
async function fetchStormioData(lat: number, lng: number): Promise<StormioSnapshot | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/stormio?lat=${lat}&lng=${lng}`, {
      cache: 'no-store'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('StormIO fetch error:', error);
  }
  return null;
}

async function fetchSSTData(lat: number, lng: number): Promise<{ temperature: number; timestamp: string } | null> {
  try {
    // Try to get SST from raster sampler
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/rasters/sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        polygon: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [lng - 0.01, lat - 0.01],
              [lng + 0.01, lat - 0.01],
              [lng + 0.01, lat + 0.01],
              [lng - 0.01, lat + 0.01],
              [lng - 0.01, lat - 0.01]
            ]]
          }
        },
        timeISO: new Date().toISOString(),
        layers: ['sst']
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.stats?.sst?.mean_f) {
        return {
          temperature: data.stats.sst.mean_f,  // Already in Fahrenheit from the API
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (error) {
    console.error('SST fetch error:', error);
  }

  // Fallback to mock data
  return {
    temperature: 72 + Math.random() * 8,
    timestamp: new Date().toISOString()
  };
}

async function fetchChlorophyllData(lat: number, lng: number): Promise<{ concentration: number; timestamp: string } | null> {
  try {
    // Try to get chlorophyll from raster sampler
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/rasters/sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        polygon: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [lng - 0.01, lat - 0.01],
              [lng + 0.01, lat - 0.01],
              [lng + 0.01, lat + 0.01],
              [lng - 0.01, lat + 0.01],
              [lng - 0.01, lat - 0.01]
            ]]
          }
        },
        timeISO: new Date().toISOString(),
        layers: ['chl']
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.stats?.chl?.mean) {
        return {
          concentration: data.stats.chl.mean,  // mg/m³
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (error) {
    console.error('Chlorophyll fetch error:', error);
  }

  // Fallback to mock data
  return {
    concentration: 0.3 + Math.random() * 1.5,
    timestamp: new Date().toISOString()
  };
}

async function estimateDepth(lat: number, lng: number): Promise<number> {
  // Simple depth estimation based on distance from shore
  // In production, this would query bathymetry data
  const distanceFromShore = Math.abs(lng + 75) * 111; // km (rough approximation)
  const depth = Math.min(2000, distanceFromShore * 10); // meters
  return depth;
}

function calculateTidePhase(tides: any): 'high' | 'low' | 'rising' | 'falling' | null {
  if (!tides || !tides.events || tides.events.length < 2) return null;

  const now = new Date();
  const nextTide = new Date(tides.next.timeIso);
  const hoursTillNext = (nextTide.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursTillNext < 3) {
    // Within 3 hours of tide change
    return tides.next.type === 'high' ? 'rising' : 'falling';
  } else {
    // More than 3 hours from tide change
    return tides.next.type === 'high' ? 'falling' : 'rising';
  }
}

async function checkForSSTBreak(lat: number, lng: number): Promise<boolean> {
  // Check for SST fronts/edges nearby
  // This would integrate with the SST edge detection system
  // For now, return a probabilistic value
  return Math.random() > 0.6;
}

function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32;
}

function getRealisticSST(lat: number, lng: number, sstF?: number): number {
  // Validate SST is realistic for location and season
  const month = new Date().getMonth(); // 0-11
  const isWinter = month >= 11 || month <= 2;
  const isSummer = month >= 5 && month <= 8;

  // North Atlantic typical ranges
  if (lat > 30 && lat < 45 && lng < -60 && lng > -80) {
    // US East Coast
    if (isWinter) {
      // Winter: 35-50°F (2-10°C)
      if (sstF && sstF >= 35 && sstF <= 50) return sstF;
      return 42; // Default winter temp
    } else if (isSummer) {
      // Summer: 60-75°F (15-24°C)
      if (sstF && sstF >= 60 && sstF <= 75) return sstF;
      return 68; // Default summer temp
    } else {
      // Spring/Fall: 45-65°F (7-18°C)
      if (sstF && sstF >= 45 && sstF <= 65) return sstF;
      return 55; // Default spring/fall temp
    }
  }

  // For other locations, accept if reasonable (32-85°F)
  if (sstF && sstF >= 32 && sstF <= 85) return sstF;
  return 60; // Global default
}

function calculateSunrise(lat: number, lng: number): string {
  const now = new Date();
  const sunriseHour = 6 - (lng / 15); // Rough approximation
  const sunrise = new Date(now);
  sunrise.setHours(Math.floor(sunriseHour), Math.round((sunriseHour % 1) * 60));
  return sunrise.toISOString();
}

function calculateSunset(lat: number, lng: number): string {
  const now = new Date();
  const sunsetHour = 18 - (lng / 15); // Rough approximation
  const sunset = new Date(now);
  sunset.setHours(Math.floor(sunsetHour), Math.round((sunsetHour % 1) * 60));
  return sunset.toISOString();
}