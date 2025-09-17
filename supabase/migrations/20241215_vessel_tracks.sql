-- Vessel Tracks Table
-- Stores user vessel positions for track history

CREATE TABLE IF NOT EXISTS vessel_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  captain_name TEXT,
  boat_name TEXT,
  
  -- Position data
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2), -- knots
  heading DECIMAL(5, 2), -- degrees
  
  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_lat CHECK (lat >= -90 AND lat <= 90),
  CONSTRAINT valid_lng CHECK (lng >= -180 AND lng <= 180),
  CONSTRAINT valid_speed CHECK (speed >= 0 AND speed <= 100),
  CONSTRAINT valid_heading CHECK (heading >= 0 AND heading <= 360)
);

-- Indexes for performance
CREATE INDEX idx_vessel_tracks_user_id ON vessel_tracks(user_id);
CREATE INDEX idx_vessel_tracks_timestamp ON vessel_tracks(timestamp DESC);
CREATE INDEX idx_vessel_tracks_created_at ON vessel_tracks(created_at DESC);
CREATE INDEX idx_vessel_tracks_location ON vessel_tracks(lat, lng);

-- Enable RLS
ALTER TABLE vessel_tracks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own tracks"
  ON vessel_tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view tracks from last 7 days"
  ON vessel_tracks FOR SELECT
  USING (
    timestamp > NOW() - INTERVAL '7 days'
  );

-- Function to auto-cleanup old tracks
CREATE OR REPLACE FUNCTION cleanup_old_vessel_tracks()
RETURNS void AS $$
BEGIN
  DELETE FROM vessel_tracks 
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-vessel-tracks', '0 3 * * *', 'SELECT cleanup_old_vessel_tracks();');
