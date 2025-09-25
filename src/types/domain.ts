// Core domain types for ABFI

// Result type for better error handling
export type Result<T, E = Error> = 
  | { ok: true; data: T }
  | { ok: false; error: E };

// Ocean data types
export interface SSTReading {
  mean: number;
  min: number;
  max: number;
  p10: number;
  p50: number;
  p90: number;
  stddev: number;
  gradient: number;
  units: '°F' | '°C';
  n_valid: number;
  n_nodata: number;
}

export interface ChlReading {
  mean: number;
  min: number;
  max: number;
  p10: number;
  p50: number;
  p90: number;
  stddev: number;
  gradient: number;
  units: 'mg/m³';
  n_valid: number;
  n_nodata: number;
}

export interface AnalyzeResponse {
  timeUsed: string;
  results: {
    sst?: SSTReading;
    chl?: ChlReading;
  };
  notes?: string[];
  requested_at: string;
  request_id?: string;
}

// App state types
export type InletId = string;
export type Mode = 'analysis' | 'tracking' | 'community' | 'trends';

// Vessel types
export interface VesselData {
  gfw_count: number;
  fleet_count: number;
  activity_score: number;
  activity_text: string;
  since_hours: number;
}

// Weather types
export interface WeatherData {
  wind: {
    speed: number;
    direction: number;
    gusts?: number;
  };
  waves: {
    height: number;
    period: number;
    direction?: number;
  };
  temperature: {
    air: number;
    water: number;
  };
  conditions: string;
  updated_at: string;
}
