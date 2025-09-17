// Weather data service for command bridge integration

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  cloudCover: number;
  visibility: number;
  conditions: string;
  icon: string;
  sunrise: string;
  sunset: string;
}

export interface WeatherResponse {
  source: 'openweather' | 'mock';
  inlet: string;
  weather: WeatherData;
  timestamp: string;
  error?: string;
}

// Cache weather data for 10 minutes
const CACHE_DURATION = 10 * 60 * 1000;
const weatherCache = new Map<string, { data: WeatherResponse; expires: number }>();

export async function getWeatherData(inletId: string): Promise<WeatherResponse> {
  // Check cache first
  const cached = weatherCache.get(inletId);
  if (cached && cached.expires > Date.now()) {
    console.log(`📊 Using cached weather for ${inletId}`);
    return cached.data;
  }
  
  try {
    console.log(`🌤️ Fetching weather for ${inletId}...`);
    const response = await fetch(`/api/weather?inlet=${inletId}`);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    weatherCache.set(inletId, {
      data,
      expires: Date.now() + CACHE_DURATION
    });
    
    if (data.source === 'mock') {
      console.log(`⚠️ Using mock weather data for ${inletId}`);
    } else {
      console.log(`✅ Got real weather data for ${inletId}`);
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    
    // Return a basic fallback
    return {
      source: 'mock',
      inlet: inletId,
      weather: {
        temp: 70,
        feelsLike: 68,
        humidity: 65,
        pressure: 1013,
        windSpeed: 10,
        windDirection: 180,
        cloudCover: 50,
        visibility: 10,
        conditions: 'Partly Cloudy',
        icon: '02d',
        sunrise: '06:30',
        sunset: '19:30'
      },
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch weather data'
    };
  }
}

// Format wind direction to compass
export function formatWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Get fishing condition score based on weather
export function getWeatherScore(weather: WeatherData): {
  score: number;
  factors: string[];
} {
  let score = 70; // Base score
  const factors: string[] = [];
  
  // Wind conditions (most important for fishing)
  if (weather.windSpeed < 5) {
    score += 15;
    factors.push('🎯 Calm winds - perfect conditions');
  } else if (weather.windSpeed < 10) {
    score += 10;
    factors.push('✅ Light winds - good conditions');
  } else if (weather.windSpeed < 15) {
    score += 0;
    factors.push('⚠️ Moderate winds - fishable');
  } else if (weather.windSpeed < 20) {
    score -= 10;
    factors.push('⚠️ Strong winds - challenging');
  } else {
    score -= 25;
    factors.push('❌ High winds - dangerous conditions');
  }
  
  // Pressure trends (fish are sensitive to pressure)
  if (weather.pressure > 1015) {
    score += 10;
    factors.push('📈 High pressure - fish active');
  } else if (weather.pressure < 1010) {
    score -= 5;
    factors.push('📉 Low pressure - fish may be sluggish');
  }
  
  // Cloud cover (affects light penetration)
  if (weather.cloudCover > 30 && weather.cloudCover < 70) {
    score += 5;
    factors.push('☁️ Partial clouds - ideal light conditions');
  }
  
  // Visibility
  if (weather.visibility < 5) {
    score -= 10;
    factors.push('🌫️ Poor visibility - navigation hazard');
  }
  
  // Temperature extremes
  if (weather.temp < 40 || weather.temp > 95) {
    score -= 15;
    factors.push('🌡️ Extreme temperatures');
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    factors
  };
}
