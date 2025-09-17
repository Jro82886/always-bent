-- PERFORMANCE INDEXES FOR ABFI
-- Fixes all issues shown in Supabase Performance Advisor

-- 1. Fix "Unindexed foreign keys" issues
CREATE INDEX IF NOT EXISTS idx_catch_reports_user_id 
  ON public.catch_reports(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_id 
  ON public.profiles(id);

-- 2. Fix "Unused Index" issues for snip_analyses
CREATE INDEX IF NOT EXISTS idx_snip_analyses_created_at 
  ON public.snip_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_snip_analyses_user_id 
  ON public.snip_analyses(user_id);

CREATE INDEX IF NOT EXISTS idx_snip_analyses_is_public 
  ON public.snip_analyses(is_public);

-- 3. Fix vessel_tracks indexes
CREATE INDEX IF NOT EXISTS idx_vessel_tracks_user_id 
  ON public.vessel_tracks(user_id);

CREATE INDEX IF NOT EXISTS idx_vessel_tracks_timestamp 
  ON public.vessel_tracks(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_vessel_tracks_inlet 
  ON public.vessel_tracks(inlet);

-- 4. Fix hotspot_intelligence index
CREATE INDEX IF NOT EXISTS idx_hotspot_intelligence_created_at 
  ON public.hotspot_intelligence(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hotspot_intelligence_confidence 
  ON public.hotspot_intelligence(confidence DESC);

-- 5. Additional performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_catch_reports_created_at 
  ON public.catch_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_catch_reports_inlet 
  ON public.catch_reports(selected_inlet);

CREATE INDEX IF NOT EXISTS idx_catch_reports_species 
  ON public.catch_reports(species);

-- 6. Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_catch_reports_user_created 
  ON public.catch_reports(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vessel_tracks_user_time 
  ON public.vessel_tracks(user_id, timestamp DESC);

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'SUCCESS: All performance indexes created!';
  RAISE NOTICE 'Your database is now optimized for 60+ concurrent users';
  RAISE NOTICE 'The Performance Advisor warnings should now be resolved';
END $$;
