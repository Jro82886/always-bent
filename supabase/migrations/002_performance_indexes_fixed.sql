-- PERFORMANCE INDEXES FOR ABFI (FIXED VERSION)
-- This matches your actual database structure

-- 1. Fix "Unindexed foreign keys" for catch_reports
CREATE INDEX IF NOT EXISTS idx_catch_reports_user_id 
  ON public.catch_reports(user_id);

-- 2. Fix "Unindexed foreign keys" for profiles  
CREATE INDEX IF NOT EXISTS idx_profiles_id 
  ON public.profiles(id);

-- 3. Fix indexes for snip_analyses (without is_public column)
CREATE INDEX IF NOT EXISTS idx_snip_analyses_created_at 
  ON public.snip_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_snip_analyses_user_id 
  ON public.snip_analyses(user_id);

-- 4. Fix vessel_tracks indexes
CREATE INDEX IF NOT EXISTS idx_vessel_tracks_user_id 
  ON public.vessel_tracks(user_id);

CREATE INDEX IF NOT EXISTS idx_vessel_tracks_timestamp 
  ON public.vessel_tracks(timestamp DESC);

-- 5. Fix hotspot_intelligence index  
CREATE INDEX IF NOT EXISTS idx_hotspot_intelligence_created_at 
  ON public.hotspot_intelligence(created_at DESC);

-- 6. Additional performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_catch_reports_created_at 
  ON public.catch_reports(created_at DESC);

-- 7. Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_catch_reports_user_created 
  ON public.catch_reports(user_id, created_at DESC);

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'SUCCESS: Performance indexes created!';
  RAISE NOTICE 'Your database is now optimized';
END $$;
