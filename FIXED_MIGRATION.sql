-- ====================================
-- MILESTONE 1 - FIXED DATABASE MIGRATION
-- Handles existing tables properly
-- ====================================

-- 1. Check and alter profiles table structure
DO $$
BEGIN
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles'
                   AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT UNIQUE;
    END IF;

    -- Add other columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles'
                   AND column_name = 'captain_name') THEN
        ALTER TABLE public.profiles ADD COLUMN captain_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles'
                   AND column_name = 'boat_name') THEN
        ALTER TABLE public.profiles ADD COLUMN boat_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles'
                   AND column_name = 'home_port') THEN
        ALTER TABLE public.profiles ADD COLUMN home_port TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles'
                   AND column_name = 'membership_plan') THEN
        ALTER TABLE public.profiles ADD COLUMN membership_plan TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles'
                   AND column_name = 'membership_status') THEN
        ALTER TABLE public.profiles ADD COLUMN membership_status TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles'
                   AND column_name = 'deleted_at') THEN
        ALTER TABLE public.profiles ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. Create snips table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.snips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  inlet_slug TEXT NOT NULL,
  date DATE NOT NULL,
  area_nm2 NUMERIC,
  species TEXT[],
  sst_mean_f NUMERIC,
  sst_p10_f NUMERIC,
  sst_p90_f NUMERIC,
  sst_grad_f NUMERIC,
  chl_mean NUMERIC,
  chl_p10 NUMERIC,
  chl_p90 NUMERIC,
  chl_grad NUMERIC,
  narrative JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS snips_user_date_idx ON public.snips (user_id, date DESC);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- 4. Disable RLS for testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.snips DISABLE ROW LEVEL SECURITY;

-- 5. Insert or update demo user
INSERT INTO public.profiles (
  id,
  email,
  captain_name,
  boat_name,
  home_port,
  membership_plan,
  membership_status
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  'demo@alwaysbent.com',
  'Captain Demo',
  'Sea Explorer',
  'Ocean City, MD',
  'premium',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  captain_name = EXCLUDED.captain_name,
  boat_name = EXCLUDED.boat_name,
  home_port = EXCLUDED.home_port,
  membership_plan = EXCLUDED.membership_plan,
  membership_status = EXCLUDED.membership_status,
  updated_at = NOW();

-- 6. Insert sample snip data
INSERT INTO public.snips (
  user_id,
  inlet_slug,
  date,
  area_nm2,
  sst_mean_f,
  sst_p10_f,
  sst_p90_f,
  sst_grad_f,
  chl_mean,
  chl_p10,
  chl_p90,
  narrative
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  'md-ocean-city',
  '2025-01-20',
  25.5,
  48.5,
  45.2,
  52.1,
  0.8,
  0.35,
  0.12,
  0.58,
  '{"sstText": "Sea surface temps average 48.5°F with moderate gradient.", "chlText": "Chlorophyll averages 0.35 mg/m³.", "synth": "Good fishing conditions detected."}'::JSONB
) ON CONFLICT DO NOTHING;

-- 7. Show results
SELECT 'Migration Complete!' AS status;

SELECT COUNT(*) as profile_count FROM public.profiles WHERE email = 'demo@alwaysbent.com';
SELECT COUNT(*) as snips_count FROM public.snips;