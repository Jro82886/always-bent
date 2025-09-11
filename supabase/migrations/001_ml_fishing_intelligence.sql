-- ML-Ready Schema for Always Bent Fishing Intelligence
-- This schema is designed to collect data from day one for future ML training

-- Enable PostGIS for spatial operations
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;

-- ============================================
-- CORE TABLES
-- ============================================

-- User profiles with privacy settings
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  share_tracks BOOLEAN DEFAULT false,
  share_catches BOOLEAN DEFAULT false,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'expert', 'pro')),
  home_port TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snip analyses with ML-ready structure
CREATE TABLE IF NOT EXISTS snip_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  geometry GEOMETRY(Polygon, 4326) NOT NULL,
  area_sq_km FLOAT,
  
  -- Environmental conditions at time of snip
  conditions JSONB NOT NULL DEFAULT '{}',
  /* conditions structure:
  {
    "sst_min": 72.5,
    "sst_max": 78.2,
    "sst_gradient_max": 2.3,
    "chlorophyll_avg": 1.2,
    "current_speed_avg": 0.5,
    "current_direction": 45,
    "wave_height": 3.2,
    "moon_phase": 0.75,
    "tide_state": "incoming",
    "time_of_day": "morning"
  }
  */
  
  -- Detected features
  detected_features JSONB DEFAULT '[]',
  /* features structure:
  [
    {
      "type": "edge",
      "strength": 2.3,
      "length_km": 5.2,
      "orientation": 45,
      "confidence": 0.92
    },
    {
      "type": "eddy",
      "diameter_km": 3.5,
      "rotation": "clockwise",
      "core_temp": 76.5,
      "confidence": 0.88
    }
  ]
  */
  
  -- Generated report
  report_text TEXT,
  primary_hotspot GEOMETRY(Point, 4326),
  hotspot_confidence FLOAT CHECK (hotspot_confidence >= 0 AND hotspot_confidence <= 1),
  
  -- ML predictions
  success_prediction FLOAT CHECK (success_prediction >= 0 AND success_prediction <= 1),
  predicted_species JSONB DEFAULT '[]', -- [{"species": "yellowfin", "probability": 0.75}]
  
  -- User feedback for training
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  actual_success BOOLEAN,
  actual_catches JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  layers_active TEXT[] DEFAULT '{}', -- ['sst', 'chlorophyll', 'currents']
  
  -- ML training flags
  used_for_training BOOLEAN DEFAULT false,
  training_weight FLOAT DEFAULT 1.0 -- Higher weight for validated catches
);

-- User tracking data
CREATE TABLE IF NOT EXISTS vessel_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  trip_id UUID,
  location GEOMETRY(Point, 4326) NOT NULL,
  speed_knots FLOAT,
  heading INTEGER CHECK (heading >= 0 AND heading <= 360),
  
  -- Environmental data at this point
  sst FLOAT,
  depth_meters FLOAT,
  
  -- Activity markers
  activity_type TEXT CHECK (activity_type IN ('traveling', 'fishing', 'drifting', 'anchored')),
  
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_private BOOLEAN DEFAULT true
);

-- Catch reports
CREATE TABLE IF NOT EXISTS catch_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  snip_analysis_id UUID REFERENCES snip_analyses(id),
  location GEOMETRY(Point, 4326) NOT NULL,
  
  -- Catch details
  species TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  weight_lbs FLOAT,
  length_inches FLOAT,
  
  -- Conditions
  water_temp FLOAT,
  water_color TEXT CHECK (water_color IN ('blue', 'green', 'blended', 'muddy')),
  water_clarity TEXT CHECK (water_clarity IN ('clear', 'semi-clear', 'murky')),
  
  -- Fishing details
  method TEXT CHECK (method IN ('trolling', 'chunking', 'jigging', 'live-bait', 'casting', 'bottom')),
  depth_fished INTEGER,
  time_of_catch TIMESTAMPTZ,
  
  -- Environmental observations
  birds_present BOOLEAN,
  bait_present BOOLEAN,
  current_direction TEXT,
  temperature_break BOOLEAN,
  
  notes TEXT,
  photo_urls TEXT[],
  
  -- Privacy
  share_publicly BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML Pattern Storage
CREATE TABLE IF NOT EXISTS ml_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type TEXT NOT NULL, -- 'edge_catch', 'eddy_catch', 'convergence_catch'
  
  -- Pattern signature (what conditions lead to success)
  condition_signature JSONB NOT NULL,
  /* Example:
  {
    "sst_gradient_min": 1.5,
    "sst_gradient_max": 3.0,
    "chlorophyll_min": 1.0,
    "current_speed_range": [0.3, 0.8],
    "time_of_day": ["dawn", "dusk"],
    "moon_phase_range": [0.5, 1.0]
  }
  */
  
  -- Pattern performance
  success_rate FLOAT,
  sample_size INTEGER,
  confidence_score FLOAT,
  
  -- Geographic relevance
  applicable_regions GEOMETRY(MultiPolygon, 4326),
  seasonal_relevance JSONB, -- {"spring": 0.9, "summer": 1.0, "fall": 0.7, "winter": 0.3}
  
  -- Species correlation
  species_correlation JSONB, -- {"yellowfin": 0.85, "mahi": 0.72, "wahoo": 0.45}
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated hotspot intelligence
CREATE TABLE IF NOT EXISTS hotspot_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location GEOMETRY(Point, 4326) NOT NULL,
  radius_km FLOAT DEFAULT 1.0,
  
  -- Aggregated success metrics
  total_reports INTEGER DEFAULT 0,
  success_rate FLOAT,
  avg_catch_size FLOAT,
  
  -- Temporal patterns
  best_months INTEGER[], -- [4,5,6,9,10]
  best_time_of_day TEXT[], -- ['dawn', 'dusk']
  best_tide TEXT[], -- ['incoming', 'slack']
  
  -- Environmental preferences
  optimal_sst_range FLOAT[],
  optimal_current_speed FLOAT[],
  
  -- Top species
  primary_species TEXT[],
  
  -- ML confidence
  data_quality_score FLOAT,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Spatial indexes for fast geographic queries
CREATE INDEX idx_snip_analyses_geometry ON snip_analyses USING GIST (geometry);
CREATE INDEX idx_snip_analyses_hotspot ON snip_analyses USING GIST (primary_hotspot);
CREATE INDEX idx_vessel_tracks_location ON vessel_tracks USING GIST (location);
CREATE INDEX idx_catch_reports_location ON catch_reports USING GIST (location);
CREATE INDEX idx_hotspot_intelligence_location ON hotspot_intelligence USING GIST (location);

-- Temporal indexes for time-based queries
CREATE INDEX idx_snip_analyses_created ON snip_analyses (created_at DESC);
CREATE INDEX idx_vessel_tracks_timestamp ON vessel_tracks (timestamp DESC);
CREATE INDEX idx_catch_reports_time ON catch_reports (time_of_catch DESC);

-- User indexes
CREATE INDEX idx_snip_analyses_user ON snip_analyses (user_id);
CREATE INDEX idx_vessel_tracks_user ON vessel_tracks (user_id);
CREATE INDEX idx_catch_reports_user ON catch_reports (user_id);

-- ML training indexes
CREATE INDEX idx_snip_analyses_training ON snip_analyses (used_for_training, actual_success);
CREATE INDEX idx_ml_patterns_type ON ml_patterns (pattern_type);

-- JSONB indexes for condition queries
CREATE INDEX idx_snip_conditions ON snip_analyses USING GIN (conditions);
CREATE INDEX idx_snip_features ON snip_analyses USING GIN (detected_features);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update hotspot intelligence when new catch reported
CREATE OR REPLACE FUNCTION update_hotspot_intelligence()
RETURNS TRIGGER AS $$
BEGIN
  -- Find or create hotspot within 1km of catch
  INSERT INTO hotspot_intelligence (
    location,
    total_reports,
    success_rate,
    primary_species
  )
  VALUES (
    NEW.location,
    1,
    1.0,
    ARRAY[NEW.species]
  )
  ON CONFLICT (location) 
  DO UPDATE SET
    total_reports = hotspot_intelligence.total_reports + 1,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hotspot
AFTER INSERT ON catch_reports
FOR EACH ROW
EXECUTE FUNCTION update_hotspot_intelligence();

-- Calculate area when snip polygon created
CREATE OR REPLACE FUNCTION calculate_snip_area()
RETURNS TRIGGER AS $$
BEGIN
  NEW.area_sq_km = ST_Area(NEW.geometry::geography) / 1000000.0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_area
BEFORE INSERT OR UPDATE ON snip_analyses
FOR EACH ROW
EXECUTE FUNCTION calculate_snip_area();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE snip_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessel_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE catch_reports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data (unless explicitly shared)
CREATE POLICY "Users can view own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analyses" ON snip_analyses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tracks" ON vessel_tracks
  FOR SELECT USING (auth.uid() = user_id OR is_private = false);

CREATE POLICY "Users can view shared catches" ON catch_reports
  FOR SELECT USING (auth.uid() = user_id OR share_publicly = true);

-- ============================================
-- INITIAL ML SEED PATTERNS (East Coast)
-- ============================================

INSERT INTO ml_patterns (pattern_type, condition_signature, success_rate, sample_size, confidence_score)
VALUES 
  ('edge_catch', 
   '{"sst_gradient_min": 1.5, "sst_gradient_max": 3.0, "time_of_day": ["dawn", "dusk"]}',
   0.75, 100, 0.85),
  ('eddy_catch',
   '{"eddy_present": true, "eddy_diameter_km_min": 2.0, "chlorophyll_min": 1.5}',
   0.68, 75, 0.78),
  ('convergence_catch',
   '{"current_convergence": true, "birds_present": true, "water_color": ["blended"]}',
   0.82, 150, 0.91);

-- ============================================
-- HELPER VIEWS
-- ============================================

-- Recent activity view for map display
CREATE VIEW recent_activity AS
SELECT 
  'catch' as type,
  location,
  species as label,
  time_of_catch as timestamp,
  user_id
FROM catch_reports
WHERE time_of_catch > NOW() - INTERVAL '24 hours'
  AND share_publicly = true

UNION ALL

SELECT
  'track' as type,
  location,
  activity_type as label,
  timestamp,
  user_id
FROM vessel_tracks
WHERE timestamp > NOW() - INTERVAL '24 hours'
  AND is_private = false;

-- Success rate by conditions view
CREATE VIEW condition_success_rates AS
SELECT
  ROUND((conditions->>'sst_gradient_max')::numeric, 1) as gradient_strength,
  COUNT(*) as sample_size,
  AVG(CASE WHEN actual_success THEN 1 ELSE 0 END) as success_rate
FROM snip_analyses
WHERE actual_success IS NOT NULL
GROUP BY gradient_strength
HAVING COUNT(*) >= 5;

COMMENT ON SCHEMA public IS 'ML-ready schema for Always Bent Fishing Intelligence platform';
