-- ====================================
-- MILESTONE 1 - COMPLETE WORKING MIGRATION
-- For Supabase Project: MVP 9/11
-- ====================================

-- STEP 1: Fix the profiles table (it exists but missing columns)
-- Add columns one by one to avoid conflicts

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS captain_name TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS boat_name TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS home_port TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS membership_plan TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS membership_status TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- STEP 2: Create the snips table
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

-- STEP 3: Create indexes
CREATE INDEX IF NOT EXISTS snips_user_date_idx ON public.snips (user_id, date DESC);

-- STEP 4: Disable RLS for demo (we'll enable it later with proper auth)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.snips DISABLE ROW LEVEL SECURITY;

-- STEP 5: Insert or update the demo user
INSERT INTO public.profiles (
  id,
  email,
  captain_name,
  boat_name,
  home_port,
  membership_plan,
  membership_status,
  created_at,
  updated_at
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  'demo@alwaysbent.com',
  'Captain Demo',
  'Sea Explorer',
  'Ocean City, MD',
  'premium',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  captain_name = EXCLUDED.captain_name,
  boat_name = EXCLUDED.boat_name,
  home_port = EXCLUDED.home_port,
  membership_plan = EXCLUDED.membership_plan,
  membership_status = EXCLUDED.membership_status,
  updated_at = NOW();

-- STEP 6: Insert a sample snip to show it works
INSERT INTO public.snips (
  id,
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
  narrative,
  created_at
) VALUES (
  gen_random_uuid(),
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
  '{"sstText": "Sea surface temps average 48.5°F with moderate gradient.", "chlText": "Chlorophyll averages 0.35 mg/m³.", "synth": "Good fishing conditions detected."}'::JSONB,
  NOW()
) ON CONFLICT DO NOTHING;

-- STEP 7: Verify everything worked
SELECT
  'Tables Created Successfully!' AS status,
  (SELECT COUNT(*) FROM public.profiles WHERE email = 'demo@alwaysbent.com') AS demo_users,
  (SELECT COUNT(*) FROM public.snips) AS saved_analyses;