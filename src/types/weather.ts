// Weather data types for the application

export interface WeatherAPIResponse {
  waves: {
    height: number;
    period: number;
    direction: number;
  };
  water: {
    temperature: number;
  };
  wind: {
    speed: number;
    direction: number;
  };
  pressure?: {
    value: number;
    trend: string;
  };
  source?: {
    id: string;
    status: string;
  };
  lastUpdate: string;
}

// Legacy format for backward compatibility
export interface LegacyWeatherConditions {
  water_temp: number;
  wind_speed: number;
  wind_direction: number;
  wave_height: number;
  dominant_wave_period: number;
  visibility?: number;
  sea_pressure?: number;
}

// Adapter to convert new format to legacy format
export function weatherToLegacyConditions(weather: WeatherAPIResponse): LegacyWeatherConditions {
  return {
    water_temp: weather.water.temperature,
    wind_speed: weather.wind.speed,
    wind_direction: weather.wind.direction,
    wave_height: weather.waves.height,
    dominant_wave_period: weather.waves.period,
    visibility: 10, // Default value
    sea_pressure: weather.pressure?.value || 1013
  };
}
