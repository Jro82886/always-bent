-- CORRECT PERFORMANCE INDEXES FOR YOUR ACTUAL TABLES
-- Based on your actual database structure

-- 1. CATCH_REPORTS INDEXES
CREATE INDEX IF NOT EXISTS idx_catch_reports_user_id 
  ON public.catch_reports(user_id);

CREATE INDEX IF NOT EXISTS idx_catch_reports_snip_analysis_id 
  ON public.catch_reports(snip_analysis_id);

CREATE INDEX IF NOT EXISTS idx_catch_reports_created_at 
  ON public.catch_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_catch_reports_species 
  ON public.catch_reports(species);

-- 2. PROFILES INDEXES  
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
  ON public.profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
  ON public.profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_username 
  ON public.profiles(username);

-- 3. SNIP_ANALYSES INDEXES
CREATE INDEX IF NOT EXISTS idx_snip_analyses_user_id 
  ON public.snip_analyses(user_id);

CREATE INDEX IF NOT EXISTS idx_snip_analyses_created_at 
  ON public.snip_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_snip_analyses_analyzed_at 
  ON public.snip_analyses(analyzed_at DESC);

-- 4. VESSEL_TRACKS INDEXES
CREATE INDEX IF NOT EXISTS idx_vessel_tracks_user_id 
  ON public.vessel_tracks(user_id);

CREATE INDEX IF NOT EXISTS idx_vessel_tracks_trip_id 
  ON public.vessel_tracks(trip_id);

CREATE INDEX IF NOT EXISTS idx_vessel_tracks_timestamp 
  ON public.vessel_tracks(timestamp DESC);

-- 5. HOTSPOT_INTELLIGENCE INDEXES
CREATE INDEX IF NOT EXISTS idx_hotspot_intelligence_updated_at 
  ON public.hotspot_intelligence(updated_at DESC);

-- 6. COMPOSITE INDEXES for complex queries
CREATE INDEX IF NOT EXISTS idx_catch_reports_user_created 
  ON public.catch_reports(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vessel_tracks_user_timestamp 
  ON public.vessel_tracks(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_snip_analyses_user_created 
  ON public.snip_analyses(user_id, created_at DESC);

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '================================';
  RAISE NOTICE 'SUCCESS: All indexes created!';
  RAISE NOTICE 'Your database is now optimized for:';
  RAISE NOTICE '- Fast user lookups';
  RAISE NOTICE '- Quick time-based queries';
  RAISE NOTICE '- Efficient foreign key joins';
  RAISE NOTICE '================================';
END $$;
