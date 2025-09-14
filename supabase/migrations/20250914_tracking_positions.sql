-- Create tracking positions table
CREATE TABLE IF NOT EXISTS tracking_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  boat_name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  speed DECIMAL(5, 2), -- knots
  heading INTEGER, -- degrees 0-359
  accuracy DECIMAL(6, 2), -- meters
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracking_user_time ON tracking_positions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_timestamp ON tracking_positions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_boat ON tracking_positions(boat_name, timestamp DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE tracking_positions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own positions
CREATE POLICY "Users can insert own positions" ON tracking_positions
  FOR INSERT WITH CHECK (true); -- Allow all inserts for now

-- Policy: Users can read all positions (for fleet/community features)
CREATE POLICY "Users can read all positions" ON tracking_positions
  FOR SELECT USING (true); -- Allow all reads for now

-- Policy: Users can update their own positions
CREATE POLICY "Users can update own positions" ON tracking_positions
  FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

-- Policy: Users can delete their own positions
CREATE POLICY "Users can delete own positions" ON tracking_positions
  FOR DELETE USING (user_id = current_setting('app.current_user_id', true));
