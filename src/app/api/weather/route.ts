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
        // Return mock data as fallback
        return NextResponse.json({
          waves: { height: 2.5, period: 10, direction: 180 },
          water: { temperature: 72 },
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
      // Return mock data as fallback
      return NextResponse.json({
        waves: { height: 2.5, period: 10, direction: 180 },
        water: { temperature: 72 },
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
    
    // Transform StormGlass data to match LiveWeatherWidget format
    const weatherData = {
      waves: {
        height: stormData.weather?.swellFt || 2.5,
        period: stormData.weather?.swellPeriodS || 10,
        direction: getDirectionDegrees(stormData.weather?.windDir || 'N')
      },
      water: {
        temperature: toF(stormData.weather?.sstC || 22)
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
    
    return NextResponse.json(weatherData);
    
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
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