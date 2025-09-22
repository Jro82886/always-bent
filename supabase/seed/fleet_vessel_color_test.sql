-- =========================================================
-- Fleet Color Lock — Quick Seed (Supabase SQL)
-- Test data to verify fleet vessel colors match inlet palette
-- =========================================================

-- =========================================================
-- 0) Optional: clean recent test data (safe for local/stage)
-- =========================================================
-- delete from vessel_positions where recorded_at > now() - interval '1 day' and source = 'seed';
-- delete from reports where created_at > now() - interval '1 day' and source = 'seed';

-- =========================================================
-- 1) Seed six vessels across three inlets
--    (2 per inlet, with fresh "online" pings)
-- =========================================================

-- Montauk Harbor (expected color: #dc2626 RED in config)
select vessel_positions_upsert(
  '11111111-1111-1111-1111-111111111111'::uuid, -- vessel_id
  null, -- user_id (optional)
  'ny-montauk', -- inlet_id
  41.0467, -- lat
  -71.9495, -- lon
  10.2, -- speed_kn
  210, -- heading_deg
  'seed', -- source
  now() - interval '2 minutes', -- recorded_at
  8.4, -- accuracy_m
  null, -- device_id
  '{"name": "FV Redtail"}'::jsonb -- meta
);

select vessel_positions_upsert(
  '11111111-1111-1111-1111-222222222222'::uuid,
  null,
  'ny-montauk',
  41.0352,
  -71.9580,
  8.6,
  185,
  'seed',
  now() - interval '6 minutes',
  12.1,
  null,
  '{"name": "FV Lady Montauk"}'::jsonb
);

-- Ocean City Inlet (expected color: #059669 TEAL in config)
select vessel_positions_upsert(
  '22222222-2222-2222-2222-111111111111'::uuid,
  null,
  'md-ocean-city',
  38.3297,
  -75.0869,
  9.1,
  145,
  'seed',
  now() - interval '3 minutes',
  9.9,
  null,
  '{"name": "FV Rip Runner"}'::jsonb
);

select vessel_positions_upsert(
  '22222222-2222-2222-2222-222222222222'::uuid,
  null,
  'md-ocean-city',
  38.3342,
  -75.1040,
  6.3,
  120,
  'seed',
  now() - interval '8 minutes',
  10.5,
  null,
  '{"name": "FV Sandbar"}'::jsonb
);

-- Hatteras Inlet (expected color: #16a34a GREEN in config)
select vessel_positions_upsert(
  '33333333-3333-3333-3333-111111111111'::uuid,
  null,
  'nc-hatteras',
  35.1997,
  -75.7172,
  7.8,
  60,
  'seed',
  now() - interval '4 minutes',
  11.2,
  null,
  '{"name": "FV Breaker"}'::jsonb
);

select vessel_positions_upsert(
  '33333333-3333-3333-3333-222222222222'::uuid,
  null,
  'nc-hatteras',
  35.2151,
  -75.7310,
  5.7,
  95,
  'seed',
  now() - interval '9 minutes',
  10.8,
  null,
  '{"name": "FV Shoal Dancer"}'::jsonb
);

-- =========================================================
-- 2) Optional: add short "trail" points for one vessel per inlet
--    (use different recorded_at times to render blue tracks)
-- =========================================================

-- Montauk trail (FV Redtail)
select vessel_positions_upsert(
  '11111111-1111-1111-1111-111111111111'::uuid,
  null,
  'ny-montauk',
  41.0400,
  -71.9550,
  8.2,
  200,
  'seed',
  now() - interval '30 minutes',
  9.0,
  null,
  '{"name": "FV Redtail"}'::jsonb
);

select vessel_positions_upsert(
  '11111111-1111-1111-1111-111111111111'::uuid,
  null,
  'ny-montauk',
  41.0430,
  -71.9520,
  9.4,
  205,
  'seed',
  now() - interval '20 minutes',
  10.2,
  null,
  '{"name": "FV Redtail"}'::jsonb
);

-- Ocean City trail (FV Rip Runner)
select vessel_positions_upsert(
  '22222222-2222-2222-2222-111111111111'::uuid,
  null,
  'md-ocean-city',
  38.3260,
  -75.0900,
  8.8,
  150,
  'seed',
  now() - interval '25 minutes',
  10.1,
  null,
  '{"name": "FV Rip Runner"}'::jsonb
);

select vessel_positions_upsert(
  '22222222-2222-2222-2222-111111111111'::uuid,
  null,
  'md-ocean-city',
  38.3280,
  -75.0880,
  9.0,
  146,
  'seed',
  now() - interval '15 minutes',
  9.7,
  null,
  '{"name": "FV Rip Runner"}'::jsonb
);

-- Hatteras trail (FV Breaker)
select vessel_positions_upsert(
  '33333333-3333-3333-3333-111111111111'::uuid,
  null,
  'nc-hatteras',
  35.2052,
  -75.7235,
  7.2,
  70,
  'seed',
  now() - interval '22 minutes',
  11.5,
  null,
  '{"name": "FV Breaker"}'::jsonb
);

select vessel_positions_upsert(
  '33333333-3333-3333-3333-111111111111'::uuid,
  null,
  'nc-hatteras',
  35.2023,
  -75.7200,
  7.6,
  65,
  'seed',
  now() - interval '12 minutes',
  11.0,
  null,
  '{"name": "FV Breaker"}'::jsonb
);

-- =========================================================
-- 3) Optional: tie one recent report to a vessel (catch badge)
-- =========================================================
-- If using the unified reports table with vessel_id support
/*
insert into reports (
  id, 
  user_id, 
  inlet_id, 
  type, 
  status, 
  source, 
  payload_json, 
  created_at, 
  updated_at,
  meta
)
values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid, -- test user
  'ny-montauk',
  'bite',
  'complete',
  'seed',
  jsonb_build_object(
    'summary', 'Hot bite detected near edge; birds briefly pinned.',
    'species', array['Yellowfin Tuna'],
    'coords', jsonb_build_object('lat', 41.0467, 'lon', -71.9495)
  ),
  now() - interval '20 minutes',
  now() - interval '20 minutes',
  jsonb_build_object('vessel_id', '11111111-1111-1111-1111-111111111111')
);
*/

-- =========================================================
-- Expected Results:
-- Select Montauk → Fleet dots = RED (#dc2626)
-- Select Ocean City → Fleet dots = TEAL (#059669)  
-- Select Hatteras → Fleet dots = GREEN (#16a34a)
-- =========================================================
