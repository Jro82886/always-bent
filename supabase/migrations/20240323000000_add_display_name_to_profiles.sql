-- Add display_name to profiles table for identity enrichment
-- This migration is idempotent - safe to run multiple times

-- Add display_name column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Optional: Copy captain_name to display_name if display_name is null
UPDATE public.profiles 
SET display_name = captain_name 
WHERE display_name IS NULL AND captain_name IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.display_name IS 'Display name shown as captain in reports';
COMMENT ON COLUMN public.profiles.boat_name IS 'Boat name shown in reports';

-- Verify the columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'display_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'boat_name'
  ) THEN
    RAISE NOTICE 'Success: Both display_name and boat_name columns exist in profiles table';
  ELSE
    RAISE EXCEPTION 'Error: Required columns missing from profiles table';
  END IF;
END $$;
