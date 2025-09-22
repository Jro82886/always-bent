-- RUN THIS IN SUPABASE SQL EDITOR RIGHT NOW
-- This fixes the 500 errors for fleet vessels

-- 1. Drop the broken view
DROP VIEW IF EXISTS public.vessels_latest CASCADE;

-- 2. Create the correct view
CREATE VIEW public.vessels_latest AS
SELECT DISTINCT ON (vessel_id)
  id,
  vessel_id,
  user_id,  
  inlet_id,
  lat,
  lng,
  speed_kn,
  heading_deg,
  recorded_at,  -- THIS IS THE FIX - keep original name
  meta,
  COALESCE((meta->>'name')::text, 'Vessel ' || vessel_id) as name,
  COALESCE((meta->>'has_report')::boolean, false) as has_report
FROM public.vessel_positions
WHERE recorded_at > now() - interval '10 minutes'
ORDER BY vessel_id, recorded_at DESC;

-- 3. Grant permissions
GRANT SELECT ON public.vessels_latest TO anon;
GRANT SELECT ON public.vessels_latest TO authenticated;

-- 4. Test it works
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'vessels_latest' 
ORDER BY ordinal_position;

-- Should show: id, vessel_id, user_id, inlet_id, lat, lng, speed_kn, heading_deg, recorded_at, meta, name, has_report
