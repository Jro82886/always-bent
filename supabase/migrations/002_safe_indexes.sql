-- SAFE PERFORMANCE INDEXES
-- Only creates indexes on columns we know exist

-- 1. Basic foreign key indexes (these should always work)
CREATE INDEX IF NOT EXISTS idx_catch_reports_user_id 
  ON public.catch_reports(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_id 
  ON public.profiles(id);

-- 2. Try vessel_tracks if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'vessel_tracks') THEN
    CREATE INDEX IF NOT EXISTS idx_vessel_tracks_user_id 
      ON public.vessel_tracks(user_id);
  END IF;
END $$;

-- 3. Try snip_analyses if it exists  
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'snip_analyses') THEN
    CREATE INDEX IF NOT EXISTS idx_snip_analyses_user_id 
      ON public.snip_analyses(user_id);
  END IF;
END $$;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Basic indexes created successfully!';
  RAISE NOTICE 'Run the check_tables.sql to see what other indexes we can add';
END $$;
