-- Seed test data for species functionality with visual language demo
-- Only run this in development/testing environments
-- Shows: inlet strips/dots (chrome) + species pills (content)

INSERT INTO reports (id, type, created_at, summary, conditions, inlet_id, species, analysis_text, user_id)
VALUES
  -- Montauk: Yellowfin + Mahi (yesterday)
  (
    gen_random_uuid(), 
    'abfi', 
    now() - interval '1 day',
    'Yellowfin blitz on the west wall; birds tight.',
    jsonb_build_object(
      'sstF', 74.2,
      'windKt', 12,
      'windDir', 'SW',
      'swellFt', 3,
      'periodS', 8
    ),
    'ny-montauk',
    ARRAY['yellowfin-tuna', 'mahi'],
    'Found cleaner water on the edge; temp break ~0.8°F. Yellowfin were crushing ballyhoo on the long rigger. Mahi showed up around noon hitting anything flashy.',
    '00000000-0000-0000-0000-000000000000'
  ),
  
  -- Hudson Canyon: Swordfish (3 days ago)
  (
    gen_random_uuid(), 
    'abfi', 
    now() - interval '3 days',
    'Night drop 1,500 ft; swordfish on the second drift.',
    jsonb_build_object(
      'sstF', 72.1,
      'windKt', 9,
      'windDir', 'E',
      'swellFt', 4,
      'periodS', 10
    ),
    'nj-barnegat',
    ARRAY['swordfish'],
    'Glow stick green worked better; current eased after midnight. Classic bill whacking the bait - let him eat for a full minute before coming tight.',
    '00000000-0000-0000-0000-000000000000'
  ),
  
  -- Hatteras: Bluefin + Wahoo (5 days ago)
  (
    gen_random_uuid(), 
    'abfi', 
    now() - interval '5 days',
    'Short rip fired at sunrise; two bluefin, one wahoo on high-speed.',
    jsonb_build_object(
      'sstF', 75.5,
      'windKt', 15,
      'windDir', 'SE',
      'swellFt', 2,
      'periodS', 7
    ),
    'nc-hatteras',
    ARRAY['bluefin-tuna', 'wahoo'],
    'Stayed inside the color change; bait piled on the seam. Wahoo hit the pink/blue Ilander at dawn, bluefin came up on live baits.',
    '00000000-0000-0000-0000-000000000000'
  ),
  
  -- Jupiter: Sailfish (this morning)
  (
    gen_random_uuid(), 
    'abfi', 
    now() - interval '2 hours',
    'Live-bait kite set off the pier; sail in 160 ft.',
    jsonb_build_object(
      'sstF', 82.6,
      'windKt', 8,
      'windDir', 'N',
      'swellFt', 2,
      'periodS', 7
    ),
    'fl-jupiter',
    ARRAY['sailfish'],
    'Slow drift south; best bite 9:15–10:00. Goggle-eyes were money, threadfins got short strikes.',
    '00000000-0000-0000-0000-000000000000'
  ),
  
  -- Oregon Inlet: Bigeye + Marlin (last week)
  (
    gen_random_uuid(), 
    'abfi', 
    now() - interval '7 days',
    'Greasy calm; bigeye early, white marlin midday behind the spread.',
    jsonb_build_object(
      'sstF', 76.3,
      'windKt', 5,
      'windDir', 'W',
      'swellFt', 1,
      'periodS', 6
    ),
    'nc-oregon-inlet',
    ARRAY['bigeye-tuna', 'marlin'],
    'Small ballyhoo on flat lines; birds scattered but marks were solid. Bigeye came on chunk at first light, marlin ate the left long.',
    '00000000-0000-0000-0000-000000000000'
  )
ON CONFLICT (id) DO NOTHING;
