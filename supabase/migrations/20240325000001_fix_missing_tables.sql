-- Fix missing tables and views for Always Bent
-- This migration creates the missing chat_messages table and vessels_latest view

-- 1. Create chat_messages table for inlet chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inlet_id text NOT NULL,
  user_id uuid NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_inlet_created 
ON public.chat_messages(inlet_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat
CREATE POLICY "Anyone can read messages" ON public.chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true); -- Using ephemeral auth for now

-- Grant permissions
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO anon;

-- 2. Create vessel_positions table if it doesn't exist
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

-- Create indexes for vessel_positions
CREATE INDEX IF NOT EXISTS idx_vessel_positions_vessel_time 
ON public.vessel_positions(vessel_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_vessel_positions_inlet_time 
ON public.vessel_positions(inlet_id, recorded_at DESC);

-- Enable RLS on vessel_positions
ALTER TABLE public.vessel_positions ENABLE ROW LEVEL SECURITY;

-- RLS policies for vessel_positions
CREATE POLICY "Anyone can read vessel positions" ON public.vessel_positions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert vessel positions" ON public.vessel_positions
  FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.vessel_positions TO authenticated;
GRANT ALL ON public.vessel_positions TO anon;

-- 3. Create vessels_latest view for fleet API
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
  -- Add calculated fields
  CASE 
    WHEN recorded_at > now() - interval '5 minutes' THEN true
    ELSE false
  END as is_online,
  -- Mock some data for testing
  COALESCE((meta->>'name')::text, 'Vessel ' || substr(vessel_id, 1, 8)) as name,
  COALESCE((meta->>'has_report')::boolean, false) as has_report
FROM public.vessel_positions
WHERE recorded_at > now() - interval '7 days'
ORDER BY vessel_id, recorded_at DESC;

-- Grant permissions on view
GRANT SELECT ON public.vessels_latest TO authenticated;
GRANT SELECT ON public.vessels_latest TO anon;

-- 4. Insert some test fleet data (remove after testing)
-- This gives you some boats to see while testing
INSERT INTO public.vessel_positions (vessel_id, inlet_id, lat, lng, speed_kn, heading_deg, recorded_at, meta)
VALUES 
  -- Montauk boats
  ('test-boat-1', 'ny-montauk', 41.0467, -71.9495, 8.5, 45, now() - interval '2 minutes', 
   '{"name": "Sea Hunter", "type": "fleet", "captain": "Test Captain 1"}'::jsonb),
  ('test-boat-2', 'ny-montauk', 41.0567, -71.9395, 12.0, 90, now() - interval '3 minutes',
   '{"name": "Wave Runner", "type": "fleet", "captain": "Test Captain 2"}'::jsonb),
  
  -- Ocean City boats  
  ('test-boat-3', 'ocean-city', 38.3267, -75.0895, 6.0, 180, now() - interval '1 minute',
   '{"name": "Blue Marlin", "type": "fleet", "captain": "Test Captain 3", "has_report": true}'::jsonb),
  ('test-boat-4', 'ocean-city', 38.3367, -75.0795, 15.0, 270, now() - interval '4 minutes',
   '{"name": "Salty Dog", "type": "fleet", "captain": "Test Captain 4"}'::jsonb),
   
  -- Hatteras boats
  ('test-boat-5', 'hatteras', 35.2167, -75.5395, 10.0, 315, now() - interval '2 minutes',
   '{"name": "Carolina Queen", "type": "fleet", "captain": "Test Captain 5"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5. Create a simple vessel_positions_recent view for trails
CREATE OR REPLACE VIEW public.vessel_positions_recent AS
SELECT * FROM public.vessel_positions
WHERE recorded_at > now() - interval '24 hours'
ORDER BY vessel_id, recorded_at DESC;

-- Grant permissions
GRANT SELECT ON public.vessel_positions_recent TO authenticated;
GRANT SELECT ON public.vessel_positions_recent TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Created: chat_messages table';
  RAISE NOTICE 'Created: vessel_positions table (if missing)';
  RAISE NOTICE 'Created: vessels_latest view';
  RAISE NOTICE 'Created: vessel_positions_recent view';
  RAISE NOTICE 'Inserted: 5 test vessels (remove after testing)';
END $$;
