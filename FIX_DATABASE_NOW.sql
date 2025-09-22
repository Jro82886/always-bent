-- COPY AND PASTE THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- This fixes all the missing tables causing 404/500 errors

-- 1. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inlet_id text NOT NULL,
  user_id uuid NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_inlet_created 
ON public.chat_messages(inlet_id, created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages" ON public.chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO anon;

-- 2. Vessel Positions Table (if missing)
CREATE TABLE IF NOT EXISTS public.vessel_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id text NOT NULL,
  user_id uuid,
  inlet_id text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  speed_kn double precision,
  heading_deg double precision,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_vessel_positions_vessel_time 
ON public.vessel_positions(vessel_id, recorded_at DESC);

ALTER TABLE public.vessel_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vessel positions" ON public.vessel_positions
  FOR SELECT USING (true);

GRANT ALL ON public.vessel_positions TO authenticated;
GRANT ALL ON public.vessel_positions TO anon;

-- 3. Vessels Latest View (REQUIRED FOR FLEET API)
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
  recorded_at as timestamp,
  meta,
  COALESCE((meta->>'name')::text, 'Vessel ' || substr(vessel_id, 1, 8)) as name,
  COALESCE((meta->>'has_report')::boolean, false) as has_report
FROM public.vessel_positions
WHERE recorded_at > now() - interval '10 minutes'
ORDER BY vessel_id, recorded_at DESC;

GRANT SELECT ON public.vessels_latest TO authenticated;
GRANT SELECT ON public.vessels_latest TO anon;

-- 4. Test Data (DELETE AFTER TESTING)
INSERT INTO public.vessel_positions (vessel_id, inlet_id, lat, lng, speed_kn, heading_deg, meta)
VALUES 
  ('test-1', 'ny-montauk', 41.0467, -71.9495, 8.5, 45, '{"name": "Test Boat 1"}'::jsonb),
  ('test-2', 'ocean-city', 38.3267, -75.0895, 6.0, 180, '{"name": "Test Boat 2"}'::jsonb)
ON CONFLICT DO NOTHING;
