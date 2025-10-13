import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const inletId = searchParams.get('inlet');
    
    if (!inletId) {
      return NextResponse.json(
        { error: 'inlet parameter is required' },
        { status: 400 }
      );
    }
    
    // Get inlet coordinates
    const { getInletById } = await import('@/lib/inlets');
    const inlet = getInletById(inletId);
    
    if (!inlet) {
      return NextResponse.json(
        { error: 'Invalid inlet ID' },
        { status: 400 }
      );
    }
    
    const [lng, lat] = inlet.center;
    
    // Use the StormGlass API through our stormio endpoint
    let stormData: any;
    try {
      const stormioResponse = await fetch(
        `${req.nextUrl.origin}/api/stormio?lat=${lat}&lng=${lng}`,
        { cache: 'no-store' }
      );
      
      if (!stormioResponse.ok) {
        console.error('StormGlass API error:', stormioResponse.status);
        // Return mock data as fallback - try Copernicus for real SST
        const coperniceusSST = await fetchCopernicusSST(lat, lng);
        return NextResponse.json({
          waves: { height: 2.5, period: 10, direction: 180 },
          water: { temperature: coperniceusSST || 0 },
          wind: { speed: 12, direction: 180 },
          weather: {
            sstC: 22.2,
            windKt: 12,
            windDir: 'S',
            swellFt: 2.5,
            swellPeriodS: 10
          }
        });
      }
      
      stormData = await stormioResponse.json();
    } catch (stormError) {
      console.error('StormGlass fetch error:', stormError);
      // Return mock data as fallback - try Copernicus for real SST
      const coperniceusSST = await fetchCopernicusSST(lat, lng);
      return NextResponse.json({
        waves: { height: 2.5, period: 10, direction: 180 },
        water: { temperature: coperniceusSST || 0 },
        wind: { speed: 12, direction: 180 },
        weather: {
          sstC: 22.2,
          windKt: 12,
          windDir: 'S',
          swellFt: 2.5,
          swellPeriodS: 10
        }
      });
    }
    
    // Get water temperature - prioritize real data sources
    // 1. Try Copernicus (most accurate satellite data)
    let waterTempF: number | null = await fetchCopernicusSST(lat, lng);

    // 2. Fall back to StormGlass if Copernicus unavailable
    if (!waterTempF && stormData.weather?.sstC) {
      const stormglassTempF = toF(stormData.weather.sstC);
      console.log(`[Weather] StormGlass SST: ${stormglassTempF}°F`);

      // Only use if physically possible
      if (validateWaterTemp(stormglassTempF)) {
        waterTempF = stormglassTempF;
      } else {
        console.log(`[Weather] Rejecting impossible StormGlass temp: ${stormglassTempF}°F`);
      }
    }

    // 3. Last resort: no data available
    if (!waterTempF) {
      console.log('[Weather] No SST data available from any source');
      waterTempF = null; // Let the client handle missing data
    }

    const weatherData = {
      waves: {
        height: stormData.weather?.swellFt || 2.5,
        period: stormData.weather?.swellPeriodS || 10,
        direction: getDirectionDegrees(stormData.weather?.windDir || 'N')
      },
      water: {
        temperature: waterTempF || 0  // 0 indicates no data
      },
      wind: {
        speed: stormData.weather?.windKt || 10,
        direction: getDirectionDegrees(stormData.weather?.windDir || 'N')
      },
      pressure: {
        value: stormData.weather?.pressureHpa || 1013,
        trend: stormData.weather?.pressureTrend || 'steady'
      },
      source: stormData.sources?.[0] || { id: 'stormglass', status: 'ok' },
      lastUpdate: stormData.lastIso || new Date().toISOString()
    };
    
    // DEV LOG: Log actual weather response shape
    if (process.env.NODE_ENV === 'development') {
      console.log('[WEATHER API] Actual response:', JSON.stringify(weatherData, null, 2));
    }
    
    return new NextResponse(JSON.stringify(weatherData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      }
    });
    
  } catch (error) {
    console.error('Weather API error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch weather data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      }
    });
  }
}

// Helper to convert compass direction to degrees
function getDirectionDegrees(dir: string): number {
  const directions: Record<string, number> = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
    'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
    'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
    'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
  };
  return directions[dir] || 0;
}

// Convert Celsius to Fahrenheit
function toF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

// Validate water temperature is physically possible
function validateWaterTemp(tempF: number): boolean {
  // Only reject if physically impossible
  // Ocean water freezes at ~28°F due to salt
  // Max recorded ocean temp is ~100°F in shallow Persian Gulf
  return tempF >= 28 && tempF <= 100;
}

// Fetch real SST from Copernicus via our raster API
async function fetchCopernicusSST(lat: number, lng: number): Promise<number | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    // Add timeout to prevent long waits
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

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
              [lng - 0.05, lat - 0.05],
              [lng + 0.05, lat - 0.05],
              [lng + 0.05, lat + 0.05],
              [lng - 0.05, lat + 0.05],
              [lng - 0.05, lat - 0.05]
            ]]
          }
        },
        timeISO: new Date().toISOString(),
        layers: ['sst']
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.stats?.sst?.mean_f) {
        console.log(`[Weather] Copernicus SST: ${data.stats.sst.mean_f}°F`);
        return data.stats.sst.mean_f;
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('[Weather] Copernicus SST timeout - falling back to StormGlass');
    } else {
      console.error('[Weather] Copernicus SST fetch error:', error);
    }
  }
  return null;
}