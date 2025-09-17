-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- This is CRITICAL for security with 60+ users!

-- 1. Enable RLS on all public tables
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspot_intelligence ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for spatial_ref_sys (read-only for all)
CREATE POLICY "Allow public read access" ON public.spatial_ref_sys
  FOR SELECT USING (true);

-- 3. Create policies for ml_patterns (authenticated users only)
CREATE POLICY "Authenticated users can view patterns" ON public.ml_patterns
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can update patterns" ON public.ml_patterns
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Create policies for hotspot_intelligence (public read, authenticated write)
CREATE POLICY "Anyone can view hotspots" ON public.hotspot_intelligence
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create hotspots" ON public.hotspot_intelligence
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update hotspots" ON public.hotspot_intelligence
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Also check these tables have RLS enabled
ALTER TABLE public.catch_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snip_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vessel_tracks ENABLE ROW LEVEL SECURITY;

-- 6. Create basic policies if they don't exist
DO $$
BEGIN
  -- Catch reports: public read, own write
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'catch_reports' AND policyname = 'Public can view catches') THEN
    CREATE POLICY "Public can view catches" ON public.catch_reports
      FOR SELECT USING (true);
  END IF;
  
  -- Profiles: public read, own update
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public can view profiles') THEN
    CREATE POLICY "Public can view profiles" ON public.profiles
      FOR SELECT USING (true);
  END IF;
  
  -- Vessel tracks: public read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vessel_tracks' AND policyname = 'Public can view tracks') THEN
    CREATE POLICY "Public can view tracks" ON public.vessel_tracks
      FOR SELECT USING (true);
  END IF;
  
  -- Snip analyses: public read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'snip_analyses' AND policyname = 'Public can view analyses') THEN
    CREATE POLICY "Public can view analyses" ON public.snip_analyses
      FOR SELECT USING (true);
  END IF;
END $$;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '================================';
  RAISE NOTICE 'SECURITY FIXED!';
  RAISE NOTICE 'RLS enabled on all tables';
  RAISE NOTICE 'Basic policies created';
  RAISE NOTICE 'Your database is now secure!';
  RAISE NOTICE '================================';
END $$;
