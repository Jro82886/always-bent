-- Create a function to safely upsert user profiles
-- This handles both creating new profiles and updating existing ones

-- Drop the function if it exists
DROP FUNCTION IF EXISTS upsert_user_profile(UUID, TEXT, TEXT, TEXT, TEXT);

-- Create the upsert profile function
CREATE OR REPLACE FUNCTION upsert_user_profile(
  user_id UUID,
  captain_name_param TEXT,
  boat_name_param TEXT,
  home_port_param TEXT DEFAULT NULL,
  email_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  captain_name TEXT,
  boat_name TEXT,
  home_port TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update the profile
  RETURN QUERY
  INSERT INTO profiles (
    id,
    captain_name,
    boat_name,
    home_port,
    email,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    captain_name_param,
    boat_name_param,
    home_port_param,
    email_param,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    captain_name = EXCLUDED.captain_name,
    boat_name = EXCLUDED.boat_name,
    home_port = COALESCE(EXCLUDED.home_port, profiles.home_port),
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = NOW()
  RETURNING 
    profiles.id,
    profiles.captain_name,
    profiles.boat_name,
    profiles.home_port,
    profiles.email,
    profiles.created_at,
    profiles.updated_at;
END;
$$;

-- Create a function to get user profile with auth check
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  captain_name TEXT,
  boat_name TEXT,
  home_port TEXT,
  email TEXT,
  username TEXT,
  share_tracks BOOLEAN,
  share_catches BOOLEAN,
  experience_level TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only return profile if user is authenticated and requesting their own profile
  IF auth.uid() IS NULL OR auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized access to profile';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.captain_name,
    p.boat_name,
    p.home_port,
    p.email,
    p.username,
    p.share_tracks,
    p.share_catches,
    p.experience_level,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = user_id;
END;
$$;

-- Create a function to update profile settings
CREATE OR REPLACE FUNCTION update_profile_settings(
  user_id UUID,
  share_tracks_param BOOLEAN DEFAULT NULL,
  share_catches_param BOOLEAN DEFAULT NULL,
  experience_level_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated and updating their own profile
  IF auth.uid() IS NULL OR auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized profile update';
  END IF;
  
  -- Update only the provided fields
  UPDATE profiles
  SET
    share_tracks = COALESCE(share_tracks_param, share_tracks),
    share_catches = COALESCE(share_catches_param, share_catches),
    experience_level = COALESCE(experience_level_param, experience_level),
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION upsert_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_settings TO authenticated;

-- Create an index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_captain_name ON profiles(captain_name);
CREATE INDEX IF NOT EXISTS idx_profiles_boat_name ON profiles(boat_name);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Create the trigger
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON FUNCTION upsert_user_profile IS 'Safely creates or updates a user profile with the provided information';
COMMENT ON FUNCTION get_user_profile IS 'Retrieves a user profile with authentication check';
COMMENT ON FUNCTION update_profile_settings IS 'Updates user sharing preferences and experience level';
