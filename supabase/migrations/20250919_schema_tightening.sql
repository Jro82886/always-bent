-- ABFI Schema Tightening - September 19, 2025
-- Normalizes Stormio snapshots, adds indexes, enforces RLS

-- ============================================
-- 1. BITE REPORTS IMPROVEMENTS
-- ============================================

-- Ensure geography column is properly typed
ALTER TABLE bite_reports
  ALTER COLUMN location TYPE geography(Point, 4326);

-- Generate lat/lon from geography so they never drift
ALTER TABLE bite_reports
  DROP COLUMN IF EXISTS lat_gen,
  DROP COLUMN IF EXISTS lon_gen,
  ADD COLUMN lat_gen double precision
    GENERATED ALWAYS AS (ST_Y(location::geometry)) STORED,
  ADD COLUMN lon_gen double precision
    GENERATED ALWAYS AS (ST_X(location::geometry)) STORED;

-- Create enum for bite status
DO $$ BEGIN
  CREATE TYPE bite_status AS ENUM ('pending_analysis', 'analyzed', 'analysis_failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Convert status to enum
ALTER TABLE bite_reports
  ALTER COLUMN status TYPE bite_status USING status::bite_status;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_bite_reports_created_desc 
  ON bite_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bite_reports_inlet_created 
  ON bite_reports (inlet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bite_reports_loc_gix 
  ON bite_reports USING GIST (location);

-- ============================================
-- 2. CATCH REPORTS IMPROVEMENTS
-- ============================================

-- Add geography column for spatial queries
ALTER TABLE catch_reports
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Backfill location from lat/lng
UPDATE catch_reports
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE location IS NULL AND lat IS NOT NULL AND lng IS NOT NULL;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_catch_reports_created_desc 
  ON catch_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catch_reports_inlet_created 
  ON catch_reports (selected_inlet, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catch_reports_loc_gix 
  ON catch_reports USING GIST (location);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on both tables
ALTER TABLE bite_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE catch_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS bite_owner_rw ON bite_reports;
DROP POLICY IF EXISTS catch_owner_rw ON catch_reports;
DROP POLICY IF EXISTS catch_public_read ON catch_reports;
DROP POLICY IF EXISTS "Users can view all analyzed reports from last 3 days" ON bite_reports;
DROP POLICY IF EXISTS "Users can insert their own bites" ON bite_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON bite_reports;
DROP POLICY IF EXISTS "Catch reports are viewable by everyone" ON catch_reports;
DROP POLICY IF EXISTS "Users can create own catch reports" ON catch_reports;
DROP POLICY IF EXISTS "Users can update own catch reports" ON catch_reports;

-- Bite reports: owners can read/write their own
CREATE POLICY bite_owner_rw ON bite_reports
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Bite reports: public can view analyzed reports from last 3 days
CREATE POLICY bite_public_recent ON bite_reports
  FOR SELECT
  USING (
    status = 'analyzed' AND 
    created_at > NOW() - INTERVAL '3 days'
  );

-- Catch reports: owners can read/write their own
CREATE POLICY catch_owner_rw ON catch_reports
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Catch reports: public read for community
CREATE POLICY catch_public_read ON catch_reports
  FOR SELECT USING (true);

-- ============================================
-- 4. RETENTION: AUTO-DELETE OLD BITES
-- ============================================

-- Function to prune bites older than 7 days
CREATE OR REPLACE FUNCTION prune_old_bites()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM bite_reports 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Schedule daily cleanup at 3 AM (requires pg_cron extension)
-- Uncomment when pg_cron is enabled:
-- SELECT cron.schedule('prune_bites_daily', '0 3 * * *', $$SELECT prune_old_bites();$$);

-- For now, you can run manually: SELECT prune_old_bites();

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to get recent feed by inlet (fast query)
CREATE OR REPLACE FUNCTION get_inlet_feed(
  p_inlet_id TEXT,
  p_hours INTEGER DEFAULT 24,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  captain_name TEXT,
  species TEXT,
  notes TEXT,
  selected_inlet TEXT,
  created_at TIMESTAMPTZ,
  conditions JSONB,
  lat FLOAT,
  lng FLOAT
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id, user_id, captain_name, species, notes,
    selected_inlet, created_at, conditions, lat, lng
  FROM catch_reports
  WHERE selected_inlet = p_inlet_id
    AND created_at >= NOW() - INTERVAL '1 hour' * p_hours
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

-- Function to get recent bites (best first)
CREATE OR REPLACE FUNCTION get_recent_bites(
  p_days INTEGER DEFAULT 3,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  bite_id TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ,
  inlet_id TEXT,
  species TEXT,
  notes TEXT,
  context JSONB,
  lat_gen DOUBLE PRECISION,
  lon_gen DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id, bite_id, user_id, created_at, inlet_id, 
    species, notes, context, lat_gen, lon_gen
  FROM bite_reports
  WHERE created_at >= NOW() - INTERVAL '1 day' * p_days
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_inlet_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_bites TO authenticated;
GRANT EXECUTE ON FUNCTION prune_old_bites TO service_role;

-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE bite_reports IS 'Quick bite logs from ABFI button with Stormio weather snapshot';
COMMENT ON TABLE catch_reports IS 'Full fishing reports from community with optional analysis';
COMMENT ON COLUMN bite_reports.context IS 'Stormio snapshot at bite time: {weather, moon, tides, sun, lastIso}';
COMMENT ON COLUMN catch_reports.conditions IS 'Stormio snapshot + optional analysis from Snip Tool';
COMMENT ON FUNCTION get_inlet_feed IS 'Fast query for community feed by inlet';
COMMENT ON FUNCTION get_recent_bites IS 'Get recent bite reports for analysis';
COMMENT ON FUNCTION prune_old_bites IS 'Auto-delete bites older than 7 days (run daily)';
