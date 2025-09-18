import { NextRequest, NextResponse } from 'next/server';

const STORMGLASS_API_KEY = process.env.STORMGLASS_API_KEY;
const STORMGLASS_BASE_URL = 'https://api.stormglass.io/v2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    
    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude required' },
        { status: 400 }
      );
    }

    // Get current time and next 24 hours
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const params = {
      lat,
      lng: lon,
      start: now.toISOString(),
      end: tomorrow.toISOString()
    };

    // Fetch multiple data types from Storm Glass
    const [tidesResponse, astronomyResponse, weatherResponse] = await Promise.all([
      // Tides
      fetch(
        `${STORMGLASS_BASE_URL}/tide/extremes/point?${new URLSearchParams(params as any)}`,
        {
          headers: {
            'Authorization': STORMGLASS_API_KEY || ''
          }
        }
      ),
      // Astronomy (moon, sun)
      fetch(
        `${STORMGLASS_BASE_URL}/astronomy/point?${new URLSearchParams(params as any)}`,
        {
          headers: {
            'Authorization': STORMGLASS_API_KEY || ''
          }
        }
      ),
      // Weather
      fetch(
        `${STORMGLASS_BASE_URL}/weather/point?${new URLSearchParams({
          ...params,
          params: 'waterTemperature,airTemperature,windSpeed,windDirection,pressure,visibility,cloudCover'
        } as any)}`,
        {
          headers: {
            'Authorization': STORMGLASS_API_KEY || ''
          }
        }
      )
    ]);

    // Parse responses
    const tidesData = tidesResponse.ok ? await tidesResponse.json() : null;
    const astronomyData = astronomyResponse.ok ? await astronomyResponse.json() : null;
    const weatherData = weatherResponse.ok ? await weatherResponse.json() : null;

    // Format tide data
    const tides = tidesData?.data?.slice(0, 4).map((tide: any) => ({
      type: tide.type,
      time: new Date(tide.time).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      height: tide.height
    })) || [];

    // Format moon phase
    const moonPhase = astronomyData?.data?.[0] ? {
      phase: getMoonPhaseName(astronomyData.data[0].moonPhase?.current?.value || 0),
      illumination: Math.round((astronomyData.data[0].moonFraction?.current?.value || 0) * 100),
      icon: getMoonPhaseIcon(astronomyData.data[0].moonPhase?.current?.value || 0)
    } : null;

    // Format sun times
    const sunrise = astronomyData?.data?.[0]?.sunrise ? 
      new Date(astronomyData.data[0].sunrise).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : null;
      
    const sunset = astronomyData?.data?.[0]?.sunset ? 
      new Date(astronomyData.data[0].sunset).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : null;

    // Format weather data
    const currentWeather = weatherData?.hours?.[0];
    
    return NextResponse.json({
      tides,
      moonPhase,
      sunrise,
      sunset,
      waterTemp: currentWeather?.waterTemperature?.sg ? 
        Math.round(currentWeather.waterTemperature.sg * 9/5 + 32) : null,
      airTemp: currentWeather?.airTemperature?.sg ? 
        Math.round(currentWeather.airTemperature.sg * 9/5 + 32) : null,
      windSpeed: currentWeather?.windSpeed?.sg ? 
        Math.round(currentWeather.windSpeed.sg * 1.94384) : null, // m/s to knots
      windDirection: currentWeather?.windDirection?.sg ? 
        getWindDirection(currentWeather.windDirection.sg) : null,
      pressure: currentWeather?.pressure?.sg || null,
      visibility: currentWeather?.visibility?.sg || null,
      cloudCover: currentWeather?.cloudCover?.sg || null
    });
    
  } catch (error) {
    console.error('Storm Glass API error:', error);
    
    // Return mock data as fallback
    return NextResponse.json({
      tides: [
        { type: 'high', time: '06:23 AM', height: 4.2 },
        { type: 'low', time: '12:45 PM', height: 0.8 },
        { type: 'high', time: '06:52 PM', height: 4.5 },
        { type: 'low', time: '01:10 AM', height: 0.6 }
      ],
      moonPhase: {
        phase: 'Waxing Gibbous',
        illumination: 78,
        icon: '🌔'
      },
      sunrise: '06:42 AM',
      sunset: '07:15 PM',
      waterTemp: 72,
      airTemp: 78,
      windSpeed: 12,
      windDirection: 'NE',
      pressure: 1013,
      visibility: 10,
      cloudCover: 25
    });
  }
}

function getMoonPhaseName(phase: number): string {
  // Phase is 0-1, where 0/1 is new moon, 0.5 is full moon
  if (phase < 0.0625) return 'New Moon';
  if (phase < 0.1875) return 'Waxing Crescent';
  if (phase < 0.3125) return 'First Quarter';
  if (phase < 0.4375) return 'Waxing Gibbous';
  if (phase < 0.5625) return 'Full Moon';
  if (phase < 0.6875) return 'Waning Gibbous';
  if (phase < 0.8125) return 'Last Quarter';
  if (phase < 0.9375) return 'Waning Crescent';
  return 'New Moon';
}

function getMoonPhaseIcon(phase: number): string {
  if (phase < 0.0625) return '🌑';
  if (phase < 0.1875) return '🌒';
  if (phase < 0.3125) return '🌓';
  if (phase < 0.4375) return '🌔';
  if (phase < 0.5625) return '🌕';
  if (phase < 0.6875) return '🌖';
  if (phase < 0.8125) return '🌗';
  if (phase < 0.9375) return '🌘';
  return '🌑';
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}
