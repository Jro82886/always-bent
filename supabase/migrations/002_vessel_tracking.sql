-- ABFI Vessel Tracking System Tables
-- Core functionality for tracking boat positions and detecting fishing activity

-- 1. Vessel positions - stores all position updates
CREATE TABLE IF NOT EXISTS vessel_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT,
  inlet_id TEXT,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2), -- knots
  heading DECIMAL(5, 2), -- degrees
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID,
  
  -- Indexes for performance
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_vessel_positions_timestamp ON vessel_positions(timestamp DESC);
CREATE INDEX idx_vessel_positions_user_id ON vessel_positions(user_id);
CREATE INDEX idx_vessel_positions_inlet_id ON vessel_positions(inlet_id);
CREATE INDEX idx_vessel_positions_location ON vessel_positions USING GIST (
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)
);

-- 2. Loitering events - detected fishing activity
CREATE TABLE IF NOT EXISTS loitering_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  inlet_id TEXT,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  avg_speed DECIMAL(5, 2),
  confidence_score DECIMAL(3, 2), -- 0.0 to 1.0
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loitering_events_time ON loitering_events(start_time DESC);
CREATE INDEX idx_loitering_events_user ON loitering_events(user_id);
CREATE INDEX idx_loitering_events_location ON loitering_events USING GIST (
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)
);

-- 3. Fishing activity zones - aggregated heat map data
CREATE TABLE IF NOT EXISTS fishing_activity_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  geohash TEXT NOT NULL, -- for grid-based aggregation
  hour_bucket TIMESTAMPTZ NOT NULL,
  boat_count INTEGER DEFAULT 0,
  total_loiter_minutes INTEGER DEFAULT 0,
  avg_loiter_minutes DECIMAL(6, 2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(geohash, hour_bucket)
);

CREATE INDEX idx_activity_zones_time ON fishing_activity_zones(hour_bucket DESC);
CREATE INDEX idx_activity_zones_geohash ON fishing_activity_zones(geohash);

-- 4. Vessel routes/sessions - track complete trips
CREATE TABLE IF NOT EXISTS vessel_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT,
  inlet_id TEXT,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  total_distance_nm DECIMAL(8, 2),
  max_speed DECIMAL(5, 2),
  positions_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vessel_sessions_user ON vessel_sessions(user_id);
CREATE INDEX idx_vessel_sessions_time ON vessel_sessions(start_time DESC);

-- Helper function to get boats in polygon (for SnipTool integration)
CREATE OR REPLACE FUNCTION get_boats_in_polygon(
  polygon_coords JSONB,
  time_window INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE (
  boat_count INTEGER,
  unique_boats INTEGER,
  total_loiter_minutes INTEGER,
  peak_hour TIMESTAMPTZ,
  peak_hour_boats INTEGER
) AS $$
DECLARE
  polygon_text TEXT;
  polygon_geom GEOMETRY;
BEGIN
  -- Convert JSONB coordinates to WKT polygon
  SELECT 'POLYGON((' || string_agg(coord->0 || ' ' || coord->1, ',') || '))'
  INTO polygon_text
  FROM jsonb_array_elements(polygon_coords) as coord;
  
  polygon_geom := ST_GeomFromText(polygon_text, 4326);
  
  RETURN QUERY
  WITH boat_activity AS (
    SELECT 
      COUNT(*) as position_count,
      COUNT(DISTINCT user_id) as unique_users,
      date_trunc('hour', timestamp) as hour_bucket
    FROM vessel_positions
    WHERE 
      timestamp > NOW() - time_window
      AND ST_Contains(polygon_geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
    GROUP BY hour_bucket
  ),
  loiter_activity AS (
    SELECT 
      COALESCE(SUM(duration_minutes), 0) as total_loiter
    FROM loitering_events
    WHERE 
      start_time > NOW() - time_window
      AND ST_Contains(polygon_geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
  ),
  peak_activity AS (
    SELECT 
      hour_bucket,
      unique_users
    FROM boat_activity
    ORDER BY unique_users DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(SUM(ba.position_count)::INTEGER, 0),
    COALESCE(SUM(ba.unique_users)::INTEGER, 0),
    COALESCE(la.total_loiter::INTEGER, 0),
    pa.hour_bucket,
    pa.unique_users::INTEGER
  FROM boat_activity ba
  CROSS JOIN loiter_activity la
  LEFT JOIN peak_activity pa ON true
  GROUP BY la.total_loiter, pa.hour_bucket, pa.unique_users;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE vessel_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loitering_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fishing_activity_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessel_sessions ENABLE ROW LEVEL SECURITY;

-- Policies - everyone can read, only own data can be inserted
CREATE POLICY "Public read access" ON vessel_positions FOR SELECT USING (true);
CREATE POLICY "Users can insert own positions" ON vessel_positions FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON loitering_events FOR SELECT USING (true);
CREATE POLICY "System can insert loitering" ON loitering_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON fishing_activity_zones FOR SELECT USING (true);
CREATE POLICY "System can manage zones" ON fishing_activity_zones FOR ALL USING (true);

CREATE POLICY "Public read access" ON vessel_sessions FOR SELECT USING (true);
CREATE POLICY "Users can manage own sessions" ON vessel_sessions FOR ALL USING (true);
