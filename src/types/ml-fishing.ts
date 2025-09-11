// ML-Ready Types for Always Bent Fishing Intelligence

export interface SnipAnalysis {
  id: string;
  user_id: string;
  geometry: GeoJSON.Polygon;
  area_sq_km: number;
  
  // Environmental conditions
  conditions: {
    sst_min: number;
    sst_max: number;
    sst_gradient_max: number;
    chlorophyll_avg?: number;
    current_speed_avg?: number;
    current_direction?: number;
    wave_height?: number;
    moon_phase?: number;
    tide_state?: 'incoming' | 'outgoing' | 'slack' | 'high' | 'low';
    time_of_day: 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night';
  };
  
  // Detected features
  detected_features: Array<
    | {
        type: 'edge';
        strength: number; // Temperature difference in °F
        length_km: number;
        orientation: number; // Degrees
        confidence: number; // 0-1
      }
    | {
        type: 'eddy';
        diameter_km: number;
        rotation: 'clockwise' | 'counter-clockwise';
        core_temp: number;
        confidence: number;
      }
    | {
        type: 'convergence';
        strength: number;
        length_km: number;
        confidence: number;
      }
  >;
  
  // Analysis results
  report_text: string;
  primary_hotspot?: {
    lat: number;
    lng: number;
  };
  hotspot_confidence: number;
  
  // ML predictions
  success_prediction: number; // 0-1 probability
  predicted_species: Array<{
    species: string;
    probability: number;
  }>;
  
  // User feedback
  user_rating?: 1 | 2 | 3 | 4 | 5;
  actual_success?: boolean;
  actual_catches?: CatchReport[];
  
  // Metadata
  created_at: string;
  analyzed_at?: string;
  layers_active: ('sst' | 'chlorophyll' | 'currents' | 'salinity')[];
}

export interface CatchReport {
  id: string;
  user_id: string;
  snip_analysis_id?: string;
  location: {
    lat: number;
    lng: number;
  };
  
  // Catch details
  species: string;
  quantity: number;
  weight_lbs?: number;
  length_inches?: number;
  
  // Conditions
  water_temp?: number;
  water_color?: 'blue' | 'green' | 'blended' | 'muddy';
  water_clarity?: 'clear' | 'semi-clear' | 'murky';
  
  // Fishing details
  method?: 'trolling' | 'chunking' | 'jigging' | 'live-bait' | 'casting' | 'bottom';
  depth_fished?: number;
  time_of_catch: string;
  
  // Environmental observations
  birds_present?: boolean;
  bait_present?: boolean;
  current_direction?: string;
  temperature_break?: boolean;
  
  notes?: string;
  photo_urls?: string[];
  share_publicly: boolean;
  
  created_at: string;
}

export interface VesselTrack {
  id: string;
  user_id: string;
  trip_id?: string;
  location: {
    lat: number;
    lng: number;
  };
  speed_knots?: number;
  heading?: number;
  
  // Environmental
  sst?: number;
  depth_meters?: number;
  
  // Activity
  activity_type?: 'traveling' | 'fishing' | 'drifting' | 'anchored';
  
  timestamp: string;
  is_private: boolean;
}

export interface MLPattern {
  id: string;
  pattern_type: 'edge_catch' | 'eddy_catch' | 'convergence_catch';
  
  condition_signature: {
    sst_gradient_min?: number;
    sst_gradient_max?: number;
    chlorophyll_min?: number;
    current_speed_range?: [number, number];
    time_of_day?: string[];
    moon_phase_range?: [number, number];
    [key: string]: any;
  };
  
  // Performance metrics
  success_rate: number;
  sample_size: number;
  confidence_score: number;
  
  // Relevance
  seasonal_relevance?: {
    spring: number;
    summer: number;
    fall: number;
    winter: number;
  };
  
  species_correlation?: Record<string, number>;
  
  last_updated: string;
}

export interface HotspotIntelligence {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  radius_km: number;
  
  // Metrics
  total_reports: number;
  success_rate: number;
  avg_catch_size?: number;
  
  // Patterns
  best_months?: number[];
  best_time_of_day?: string[];
  best_tide?: string[];
  
  // Optimal conditions
  optimal_sst_range?: [number, number];
  optimal_current_speed?: [number, number];
  
  primary_species?: string[];
  data_quality_score: number;
  
  updated_at: string;
}

// Analysis Report Format
export interface SnipReport {
  title: string;
  generated_at: string;
  
  primary_hotspot: {
    location: { lat: number; lng: number };
    confidence: number;
    gradient_strength: number;
    optimal_approach?: string;
  };
  
  water_movement: {
    current_speed?: number;
    current_direction?: string;
    eddies?: Array<{
      type: string;
      size: string;
      location: { lat: number; lng: number };
    }>;
    convergence_zones?: boolean;
  };
  
  recent_activity: {
    vessel_count: number;
    catch_reports: Array<{
      species: string;
      time_ago: string;
      user?: string;
    }>;
    peak_bite_time?: string;
  };
  
  ml_prediction: {
    success_probability: number;
    confidence: number;
    based_on_samples: number;
    recommended_method?: string;
    target_species?: Array<{
      species: string;
      probability: number;
    }>;
  };
  
  recommendations: string[];
}
