-- Setup script for Always Bent Fleet tracking
-- Run this in your Supabase SQL editor

-- Create vessels_latest view for the fleet online API
CREATE OR REPLACE VIEW vessels_latest AS
SELECT DISTINCT ON (vessel_id) 
  vessel_id,
  user_id,
  inlet_id,
  lat,
  lon,
  speed_kn,
  heading_deg,
  recorded_at,
  accuracy_m,
  meta
FROM vessel_positions
WHERE recorded_at > NOW() - INTERVAL '24 hours'
ORDER BY vessel_id, recorded_at DESC;

-- Grant permissions
GRANT SELECT ON vessels_latest TO anon, authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vessel_positions_inlet_time 
ON vessel_positions(inlet_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_vessel_positions_vessel_time 
ON vessel_positions(vessel_id, recorded_at DESC);

-- Test the view
SELECT COUNT(*) as vessel_count FROM vessels_latest;
