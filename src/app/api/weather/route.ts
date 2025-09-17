import { NextRequest, NextResponse } from 'next/server';

// OpenWeather API integration for real weather data
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

// Inlet coordinates for weather fetching
const INLET_COORDS: Record<string, { lat: number; lon: number }> = {
  'montauk': { lat: 41.0359, lon: -71.9545 },
  'shinnecock': { lat: 40.8426, lon: -72.5042 },
  'moriches': { lat: 40.7668, lon: -72.7543 },
  'fire-island': { lat: 40.6470, lon: -73.2580 },
  'jones': { lat: 40.5965, lon: -73.5776 },
  'east-rockaway': { lat: 40.5937, lon: -73.7552 },
  'rockaway': { lat: 40.5673, lon: -73.9372 },
  'sandy-hook': { lat: 40.4237, lon: -74.0018 },
  'manasquan': { lat: 40.1029, lon: -74.0376 },
  'barnegat': { lat: 39.7585, lon: -74.1097 },
  'little-egg': { lat: 39.5034, lon: -74.3168 },
  'atlantic-city': { lat: 39.3573, lon: -74.4180 },
  'ocean-city': { lat: 39.2776, lon: -74.5746 },
  'cape-may': { lat: 38.9326, lon: -74.9060 },
  'delaware': { lat: 38.7817, lon: -75.1196 },
  'ocean-city-md': { lat: 38.3365, lon: -75.0849 },
  'chincoteague': { lat: 37.9332, lon: -75.3788 },
  'cape-charles': { lat: 37.2671, lon: -75.9066 },
  'virginia-beach': { lat: 36.8529, lon: -75.9780 },
  'oregon-inlet': { lat: 35.7955, lon: -75.5483 },
  'cape-hatteras': { lat: 35.2206, lon: -75.5357 },
  'ocracoke': { lat: 35.1146, lon: -75.9861 },
  'beaufort': { lat: 34.7180, lon: -76.6705 },
  'cape-fear': { lat: 33.8433, lon: -78.0156 },
  'georgetown': { lat: 33.3588, lon: -79.2823 },
  'charleston': { lat: 32.7765, lon: -79.9311 },
};

interface WeatherData {
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

function getMockWeatherData(inletId: string): WeatherData {
  // Generate realistic mock data based on season
  const month = new Date().getMonth();
  const hour = new Date().getHours();
  
  // Base temperature by season
  let baseTemp = 70;
  if (month >= 5 && month <= 8) {
    baseTemp = 80; // Summer
  } else if (month >= 11 || month <= 2) {
    baseTemp = 45; // Winter
  } else {
    baseTemp = 65; // Spring/Fall
  }
  
  // Adjust for time of day
  const dayAdjust = hour >= 6 && hour <= 18 ? 5 : -5;
  const temp = baseTemp + dayAdjust + (Math.random() * 10 - 5);
  
  return {
    temp: Math.round(temp),
    feelsLike: Math.round(temp - 3),
    humidity: 60 + Math.round(Math.random() * 30),
    pressure: 1013 + Math.round(Math.random() * 20 - 10),
    windSpeed: Math.round(5 + Math.random() * 15),
    windDirection: Math.round(Math.random() * 360),
    windGust: Math.round(10 + Math.random() * 20),
    cloudCover: Math.round(Math.random() * 100),
    visibility: 10,
    conditions: ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
    icon: '01d',
    sunrise: '06:30',
    sunset: '19:45'
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const inletId = searchParams.get('inlet') || 'ocean-city';
  
  // If no API key, return mock data
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === '[YOUR_API_KEY_HERE]') {
    console.log('⚠️ OpenWeather API key not configured, returning mock weather data');
    return NextResponse.json({
      source: 'mock',
      inlet: inletId,
      weather: getMockWeatherData(inletId),
      timestamp: new Date().toISOString()
    });
  }
  
  const coords = INLET_COORDS[inletId];
  if (!coords) {
    return NextResponse.json(
      { error: 'Invalid inlet ID' },
      { status: 400 }
    );
  }
  
  try {
    // Fetch current weather
    const weatherUrl = `${OPENWEATHER_BASE}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
    const weatherRes = await fetch(weatherUrl);
    
    if (!weatherRes.ok) {
      throw new Error(`OpenWeather API error: ${weatherRes.status}`);
    }
    
    const weatherData = await weatherRes.json();
    
    // Parse the response
    const weather: WeatherData = {
      temp: Math.round(weatherData.main.temp),
      feelsLike: Math.round(weatherData.main.feels_like),
      humidity: weatherData.main.humidity,
      pressure: weatherData.main.pressure,
      windSpeed: Math.round(weatherData.wind.speed),
      windDirection: weatherData.wind.deg,
      windGust: weatherData.wind.gust ? Math.round(weatherData.wind.gust) : undefined,
      cloudCover: weatherData.clouds.all,
      visibility: weatherData.visibility / 1000, // Convert to km
      conditions: weatherData.weather[0].main,
      icon: weatherData.weather[0].icon,
      sunrise: new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      sunset: new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    };
    
    return NextResponse.json({
      source: 'openweather',
      inlet: inletId,
      weather,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Weather API error:', error);
    // Fallback to mock data on error
    return NextResponse.json({
      source: 'mock',
      inlet: inletId,
      weather: getMockWeatherData(inletId),
      timestamp: new Date().toISOString(),
      error: 'API error - using mock data'
    });
  }
}
