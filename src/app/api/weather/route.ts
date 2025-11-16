import { NextRequest, NextResponse } from 'next/server';
import { lonLat2pixel } from '@/lib/wmts/coordinates';
import { WMTS_LAYERS } from '@/lib/wmts/layers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Copernicus credentials
const COPERNICUS_USER = process.env.COPERNICUS_USER || '';
const COPERNICUS_PASS = process.env.COPERNICUS_PASS || '';

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
    let sstSource = 'copernicus';

    // 2. Fall back to StormGlass if Copernicus unavailable
    if (!waterTempF && stormData.weather?.sstC) {
      const stormglassTempF = toF(stormData.weather?.sstC);
      console.log(`[Weather] StormGlass SST: ${stormglassTempF}°F`);

      // Only use if physically possible
      if (validateWaterTemp(stormglassTempF)) {
        waterTempF = stormglassTempF;
        sstSource = 'stormglass';
      } else {
        console.log(`[Weather] Rejecting impossible StormGlass temp: ${stormglassTempF}°F`);
      }
    }

    // 3. Last resort: no data available
    if (!waterTempF) {
      console.log('[Weather] No SST data available from any source');
      waterTempF = null; // Let the client handle missing data
      sstSource = 'none';
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
      source: { id: sstSource, status: waterTempF ? 'ok' : 'no_data' },
      lastUpdate: new Date().toISOString()
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

// Helper to try a specific coordinate
async function tryCoordinate(lat: number, lng: number, zoom: number, timeParam: string): Promise<number | null> {
  try {
    const { tileCol, tileRow, i, j } = lonLat2pixel(lng, lat, zoom);

    // Build GetFeatureInfo URL
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
      // Convert Kelvin to Fahrenheit
      const tempC = tempK - 273.15;
      const tempF = Math.round(tempC * 9/5 + 32);
      return tempF;
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Fetch real SST from Copernicus via our raster API
async function fetchCopernicusSST(lat: number, lng: number): Promise<number | null> {
  if (!COPERNICUS_USER || !COPERNICUS_PASS) {
    console.log('[Weather] Copernicus credentials not configured');
    return null;
  }

  try {
    // Use yesterday's date (Copernicus has 1-2 day processing lag)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const timeParam = yesterday.toISOString().split('T')[0];

    // Use zoom 8 for good balance of coverage and resolution
    const zoom = 8;

    // Try exact coordinates first
    let tempF = await tryCoordinate(lat, lng, zoom, timeParam);

    if (tempF !== null) {
      console.log(`[Weather] Copernicus SST at exact coords: ${tempF}°F`);
      return tempF;
    }

    // If no data at exact coordinates (common for inlets very close to shore),
    // try offset coordinates ~5km offshore (east)
    console.log(`[Weather] No data at exact coords, trying offshore offset...`);
    const offsetLng = lng + 0.045; // ~5km east at mid-latitudes
    tempF = await tryCoordinate(lat, offsetLng, zoom, timeParam);

    if (tempF !== null) {
      console.log(`[Weather] Copernicus SST at offshore offset: ${tempF}°F`);
      return tempF;
    }

    console.log(`[Weather] No Copernicus data for lat=${lat}, lng=${lng} (tried exact + offset)`);
    return null;

  } catch (error: any) {
    console.log(`[Weather] Copernicus error: ${error.message}`);
    return null;
  }
}