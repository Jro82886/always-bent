-- Update the profiles table to use Amanda's real credentials
UPDATE public.profiles
SET
  email = 'amanda@alwaysbent.com',
  captain_name = 'Captain Amanda',
  boat_name = 'Always Bent',
  home_port = 'Ocean City, MD',
  membership_plan = 'premium',
  membership_status = 'active'
WHERE id = '123e4567-e89b-12d3-a456-426614174000';

-- Verify the update
SELECT * FROM public.profiles WHERE email = 'amanda@alwaysbent.com';