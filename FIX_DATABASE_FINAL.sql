-- FINAL FIX - Run this in Supabase SQL Editor
-- This fixes the column name mismatch causing 500 errors

-- Drop the old view if it exists
DROP VIEW IF EXISTS public.vessels_latest;

-- Create the correct vessels_latest view with proper column names
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
  recorded_at,  -- Keep original column name, not 'timestamp'
  meta,
  COALESCE((meta->>'name')::text, 'Vessel ' || substr(vessel_id, 1, 8)) as name,
  COALESCE((meta->>'has_report')::boolean, false) as has_report
FROM public.vessel_positions
WHERE recorded_at > now() - interval '10 minutes'
ORDER BY vessel_id, recorded_at DESC;

-- Grant permissions
GRANT SELECT ON public.vessels_latest TO authenticated;
GRANT SELECT ON public.vessels_latest TO anon;

-- Verify the view works
SELECT count(*) as vessel_count FROM vessels_latest;

-- Show what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vessels_latest'
ORDER BY ordinal_position;
