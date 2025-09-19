/**
 * Stormglass Weather API Integration
 * Provides marine weather data including moon phases and tides
 */

const STORMGLASS_API_KEY = process.env.NEXT_PUBLIC_STORMGLASS_API_KEY || '';
const STORMGLASS_BASE_URL = 'https://api.stormglass.io/v2';

export interface StormglassWeatherData {
  hours: Array<{
    time: string;
    airTemperature: { sg: number };
    waterTemperature: { sg: number };
    waveHeight: { sg: number };
    wavePeriod: { sg: number };
    waveDirection: { sg: number };
    windSpeed: { sg: number };
    windDirection: { sg: number };
    currentSpeed: { sg: number };
    currentDirection: { sg: number };
    visibility: { sg: number };
    pressure: { sg: number };
  }>;
  meta: {
    cost: number;
    dailyQuota: number;
    lat: number;
    lng: number;
    requestCount: number;
  };
}

export interface StormglassTideData {
  data: Array<{
    time: string;
    height: number;
    type: 'high' | 'low';
  }>;
  meta: {
    station: {
      name: string;
      lat: number;
      lng: number;
    };
  };
}

export interface StormglassMoonData {
  data: Array<{
    time: string;
    moonPhase: {
      current: {
        text: string;
        value: number;
      };
      closest: {
        text: string;
        time: string;
        value: number;
      };
    };
    moonrise: string;
    moonset: string;
  }>;
}

/**
 * Get weather data from Stormglass
 */
export async function getStormglassWeather(lat: number, lng: number): Promise<StormglassWeatherData | null> {
  if (!STORMGLASS_API_KEY) {
    console.error('[Stormglass] No API key configured');
    return null;
  }

  try {
    const params = [
      'airTemperature',
      'waterTemperature',
      'waveHeight',
      'wavePeriod',
      'waveDirection',
      'windSpeed',
      'windDirection',
      'currentSpeed',
      'currentDirection',
      'visibility',
      'pressure'
    ].join(',');

    const end = new Date();
    const start = new Date();
    start.setHours(start.getHours() - 12);

    const response = await fetch(
      `${STORMGLASS_BASE_URL}/weather/point?lat=${lat}&lng=${lng}&params=${params}&start=${start.toISOString()}&end=${end.toISOString()}&source=sg`,
      {
        headers: {
          'Authorization': STORMGLASS_API_KEY
        }
      }
    );

    if (!response.ok) {
      console.error('[Stormglass] Weather API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Stormglass] Weather fetch error:', error);
    return null;
  }
}

/**
 * Get tide data from Stormglass
 */
export async function getStormglassTides(lat: number, lng: number): Promise<StormglassTideData | null> {
  if (!STORMGLASS_API_KEY) {
    console.error('[Stormglass] No API key configured');
    return null;
  }

  try {
    const end = new Date();
    end.setDate(end.getDate() + 2); // Get 2 days of tide data
    const start = new Date();

    const response = await fetch(
      `${STORMGLASS_BASE_URL}/tide/extremes/point?lat=${lat}&lng=${lng}&start=${start.toISOString()}&end=${end.toISOString()}`,
      {
        headers: {
          'Authorization': STORMGLASS_API_KEY
        }
      }
    );

    if (!response.ok) {
      console.error('[Stormglass] Tide API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Stormglass] Tide fetch error:', error);
    return null;
  }
}

/**
 * Get moon phase data from Stormglass
 */
export async function getStormglassMoon(lat: number, lng: number): Promise<StormglassMoonData | null> {
  if (!STORMGLASS_API_KEY) {
    console.error('[Stormglass] No API key configured');
    return null;
  }

  try {
    const date = new Date().toISOString().split('T')[0];

    const response = await fetch(
      `${STORMGLASS_BASE_URL}/astronomy/point?lat=${lat}&lng=${lng}&date=${date}`,
      {
        headers: {
          'Authorization': STORMGLASS_API_KEY
        }
      }
    );

    if (!response.ok) {
      console.error('[Stormglass] Moon API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Stormglass] Moon fetch error:', error);
    return null;
  }
}

/**
 * Format Stormglass data for our app
 */
export function formatStormglassData(
  weather: StormglassWeatherData | null,
  tides: StormglassTideData | null,
  moon: StormglassMoonData | null
) {
  const current = weather?.hours[weather.hours.length - 1];
  
  return {
    weather: current ? {
      airTemp: Math.round(current.airTemperature.sg * 9/5 + 32), // Convert to F
      waterTemp: Math.round(current.waterTemperature.sg * 9/5 + 32), // Convert to F
      waveHeight: Math.round(current.waveHeight.sg * 3.28084 * 10) / 10, // Convert to ft
      wavePeriod: Math.round(current.wavePeriod.sg),
      waveDirection: Math.round(current.waveDirection.sg),
      windSpeed: Math.round(current.windSpeed.sg * 2.237), // Convert to mph
      windDirection: Math.round(current.windDirection.sg),
      currentSpeed: Math.round(current.currentSpeed.sg * 1.944 * 10) / 10, // Convert to knots
      currentDirection: Math.round(current.currentDirection.sg),
      visibility: Math.round(current.visibility.sg * 0.621371), // Convert to miles
      pressure: Math.round(current.pressure.sg * 0.02953 * 100) / 100 // Convert to inHg
    } : null,
    
    tides: tides ? {
      next: tides.data[0] ? {
        time: new Date(tides.data[0].time),
        height: Math.round(tides.data[0].height * 3.28084 * 10) / 10, // Convert to ft
        type: tides.data[0].type
      } : null,
      upcoming: tides.data.slice(0, 4).map(t => ({
        time: new Date(t.time),
        height: Math.round(t.height * 3.28084 * 10) / 10,
        type: t.type
      }))
    } : null,
    
    moon: moon?.data[0] ? {
      phase: moon.data[0].moonPhase.current.text,
      illumination: Math.round(moon.data[0].moonPhase.current.value * 100),
      moonrise: moon.data[0].moonrise ? new Date(moon.data[0].moonrise) : null,
      moonset: moon.data[0].moonset ? new Date(moon.data[0].moonset) : null
    } : null
  };
}

/**
 * Get formatted marine conditions for a location
 */
export async function getMarineConditions(lat: number, lng: number) {
  const [weather, tides, moon] = await Promise.all([
    getStormglassWeather(lat, lng),
    getStormglassTides(lat, lng),
    getStormglassMoon(lat, lng)
  ]);

  return formatStormglassData(weather, tides, moon);
}
