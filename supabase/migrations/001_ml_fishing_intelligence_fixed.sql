-- ML-Ready Schema for Always Bent Fishing Intelligence
-- FIXED VERSION - No syntax errors

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  conditions JSONB NOT NULL DEFAULT '{}',
  detected_features JSONB DEFAULT '[]',
  report_text TEXT,
  primary_hotspot GEOMETRY(Point, 4326),
  hotspot_confidence FLOAT CHECK (hotspot_confidence >= 0 AND hotspot_confidence <= 1),
  success_prediction FLOAT CHECK (success_prediction >= 0 AND success_prediction <= 1),
  predicted_species JSONB DEFAULT '[]',
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  actual_success BOOLEAN,
  actual_catches JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  layers_active TEXT[] DEFAULT '{}',
  used_for_training BOOLEAN DEFAULT false,
  training_weight FLOAT DEFAULT 1.0
);

-- User tracking data
CREATE TABLE IF NOT EXISTS vessel_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  trip_id UUID,
  location GEOMETRY(Point, 4326) NOT NULL,
  speed_knots FLOAT,
  heading INTEGER CHECK (heading >= 0 AND heading <= 360),
  sst FLOAT,
  depth_meters FLOAT,
  activity_type TEXT CHECK (activity_type IN ('traveling', 'fishing', 'drifting', 'anchored', 'completed')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_private BOOLEAN DEFAULT true
);

-- Catch reports
CREATE TABLE IF NOT EXISTS catch_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  snip_analysis_id UUID REFERENCES snip_analyses(id),
  location GEOMETRY(Point, 4326) NOT NULL,
  species TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  weight_lbs FLOAT,
  length_inches FLOAT,
  water_temp FLOAT,
  water_color TEXT CHECK (water_color IN ('blue', 'green', 'blended', 'muddy')),
  water_clarity TEXT CHECK (water_clarity IN ('clear', 'semi-clear', 'murky')),
  method TEXT CHECK (method IN ('trolling', 'chunking', 'jigging', 'live-bait', 'casting', 'bottom')),
  depth_fished INTEGER,
  time_of_catch TIMESTAMPTZ,
  birds_present BOOLEAN,
  bait_present BOOLEAN,
  current_direction TEXT,
  temperature_break BOOLEAN,
  notes TEXT,
  photo_urls TEXT[],
  share_publicly BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML Pattern Storage
CREATE TABLE IF NOT EXISTS ml_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type TEXT NOT NULL,
  condition_signature JSONB NOT NULL,
  success_rate FLOAT,
  sample_size INTEGER,
  confidence_score FLOAT,
  applicable_regions GEOMETRY(MultiPolygon, 4326),
  seasonal_relevance JSONB,
  species_correlation JSONB,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated hotspot intelligence
CREATE TABLE IF NOT EXISTS hotspot_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location GEOMETRY(Point, 4326) NOT NULL,
  radius_km FLOAT DEFAULT 1.0,
  total_reports INTEGER DEFAULT 0,
  success_rate FLOAT,
  avg_catch_size FLOAT,
  best_months INTEGER[],
  best_time_of_day TEXT[],
  best_tide TEXT[],
  optimal_sst_range FLOAT[],
  optimal_current_speed FLOAT[],
  primary_species TEXT[],
  data_quality_score FLOAT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_snip_analyses_geometry ON snip_analyses USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_snip_analyses_hotspot ON snip_analyses USING GIST (primary_hotspot);
CREATE INDEX IF NOT EXISTS idx_vessel_tracks_location ON vessel_tracks USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_catch_reports_location ON catch_reports USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_hotspot_intelligence_location ON hotspot_intelligence USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_snip_analyses_created ON snip_analyses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vessel_tracks_timestamp ON vessel_tracks (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_catch_reports_time ON catch_reports (time_of_catch DESC);
CREATE INDEX IF NOT EXISTS idx_snip_analyses_user ON snip_analyses (user_id);
CREATE INDEX IF NOT EXISTS idx_vessel_tracks_user ON vessel_tracks (user_id);
CREATE INDEX IF NOT EXISTS idx_catch_reports_user ON catch_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_snip_analyses_training ON snip_analyses (used_for_training, actual_success);
CREATE INDEX IF NOT EXISTS idx_ml_patterns_type ON ml_patterns (pattern_type);
CREATE INDEX IF NOT EXISTS idx_snip_conditions ON snip_analyses USING GIN (conditions);
CREATE INDEX IF NOT EXISTS idx_snip_features ON snip_analyses USING GIN (detected_features);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Calculate area when snip polygon created
CREATE OR REPLACE FUNCTION calculate_snip_area()
RETURNS TRIGGER AS $$
BEGIN
  NEW.area_sq_km = ST_Area(NEW.geometry::geography) / 1000000.0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_calculate_area') THEN
    CREATE TRIGGER trigger_calculate_area
    BEFORE INSERT OR UPDATE ON snip_analyses
    FOR EACH ROW
    EXECUTE FUNCTION calculate_snip_area();
  END IF;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE snip_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessel_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE catch_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own analyses" ON snip_analyses;
DROP POLICY IF EXISTS "Users can view own tracks" ON vessel_tracks;
DROP POLICY IF EXISTS "Users can view shared catches" ON catch_reports;

-- Create new policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analyses" ON snip_analyses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tracks" ON vessel_tracks
  FOR SELECT USING (auth.uid() = user_id OR is_private = false);

CREATE POLICY "Users can view shared catches" ON catch_reports
  FOR SELECT USING (auth.uid() = user_id OR share_publicly = true);

-- ============================================
-- INITIAL ML SEED PATTERNS
-- ============================================

-- Only insert if table is empty
INSERT INTO ml_patterns (pattern_type, condition_signature, success_rate, sample_size, confidence_score)
SELECT * FROM (VALUES 
  ('edge_catch', 
   '{"sst_gradient_min": 1.5, "sst_gradient_max": 3.0, "time_of_day": ["dawn", "dusk"]}'::jsonb,
   0.75, 100, 0.85),
  ('eddy_catch',
   '{"eddy_present": true, "eddy_diameter_km_min": 2.0, "chlorophyll_min": 1.5}'::jsonb,
   0.68, 75, 0.78),
  ('convergence_catch',
   '{"current_convergence": true, "birds_present": true, "water_color": ["blended"]}'::jsonb,
   0.82, 150, 0.91)
) AS v(pattern_type, condition_signature, success_rate, sample_size, confidence_score)
WHERE NOT EXISTS (SELECT 1 FROM ml_patterns LIMIT 1);

-- ============================================
-- HELPER VIEWS
-- ============================================

-- Drop view if exists and recreate
DROP VIEW IF EXISTS recent_activity;

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
DROP VIEW IF EXISTS condition_success_rates;

CREATE VIEW condition_success_rates AS
SELECT
  ROUND((conditions->>'sst_gradient_max')::numeric, 1) as gradient_strength,
  COUNT(*) as sample_size,
  AVG(CASE WHEN actual_success THEN 1 ELSE 0 END) as success_rate
FROM snip_analyses
WHERE actual_success IS NOT NULL
GROUP BY gradient_strength
HAVING COUNT(*) >= 5;

-- Grant permissions for anon users to read certain views
GRANT SELECT ON recent_activity TO anon;
GRANT SELECT ON condition_success_rates TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'ML Fishing Intelligence schema created successfully!';
END;
$$;
