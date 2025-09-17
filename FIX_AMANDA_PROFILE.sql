-- Fix Amanda's existing profile
-- Run this in Supabase SQL Editor

-- First, let's see what's in the profiles table for your user
SELECT * FROM profiles WHERE email LIKE '%amanda%' OR email LIKE '%hiamandak%';

-- Update your existing profile with the captain and boat name
UPDATE profiles 
SET 
  captain_name = 'Amanda',
  boat_name = 'Reel Amanda',
  home_port = 'Ocean City',
  updated_at = NOW()
WHERE email = 'hiamandak@gmail.com';

-- If the update says "0 rows affected", then create the profile:
-- INSERT INTO profiles (id, email, captain_name, boat_name, home_port, created_at, updated_at)
-- SELECT 
--   id,
--   email,
--   'Amanda',
--   'Reel Amanda', 
--   'Ocean City',
--   NOW(),
--   NOW()
-- FROM auth.users 
-- WHERE email = 'hiamandak@gmail.com'
-- ON CONFLICT (id) DO UPDATE
-- SET 
--   captain_name = EXCLUDED.captain_name,
--   boat_name = EXCLUDED.boat_name,
--   home_port = EXCLUDED.home_port,
--   updated_at = NOW();

-- Verify it worked
SELECT * FROM profiles WHERE email = 'hiamandak@gmail.com';
