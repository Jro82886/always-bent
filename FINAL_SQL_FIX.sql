-- FINAL FIX FOR FLEET 500 ERRORS
-- Run this in Supabase SQL Editor

-- 1. Drop the incorrect view
DROP VIEW IF EXISTS public.vessels_latest;

-- 2. Create with correct column names
CREATE OR REPLACE VIEW public.vessels_latest AS
SELECT DISTINCT ON (vessel_id)
  id,
  vessel_id,
  user_id,
  inlet_id,
  lat,
  lng,
  speed_kn,
  heading_deg,
  recorded_at,  -- Keep original column name (NOT "timestamp")
  meta,
  COALESCE((meta->>'name')::text, 'Vessel ' || substr(vessel_id, 1, 8)) as name,
  COALESCE((meta->>'has_report')::boolean, false) as has_report
FROM public.vessel_positions
WHERE recorded_at > now() - interval '10 minutes'
ORDER BY vessel_id, recorded_at DESC;

-- 3. Grant permissions
GRANT SELECT ON public.vessels_latest TO authenticated, anon;

-- 4. Verify it worked
SELECT vessel_id, recorded_at, inlet_id
FROM public.vessels_latest
LIMIT 3;

-- Should return rows with recorded_at column (no error)
