-- Restore profiles table to proper UUID-based structure
-- Run this in Supabase SQL Editor after fixing the AuthProvider code

-- Step 1: Drop the permissive policies we created
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON profiles;

-- Step 2: Change id back to UUID (if it was changed to TEXT)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'id'
        AND data_type = 'text'
    ) THEN
        -- This will fail if there are non-UUID values - clean those first
        ALTER TABLE profiles ALTER COLUMN id TYPE UUID USING id::UUID;
        RAISE NOTICE 'Changed profiles.id from TEXT back to UUID';
    ELSE
        RAISE NOTICE 'profiles.id is already UUID type';
    END IF;
END $$;

-- Step 3: Recreate proper RLS policies
-- Public can read all profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can insert their own profile (auth.uid() must match id)
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Step 4: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant appropriate permissions
GRANT SELECT ON profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'PROFILES TABLE RESTORED TO PROPER STATE';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '✅ id column is UUID type';
    RAISE NOTICE '✅ RLS policies use auth.uid() = id';
    RAISE NOTICE '✅ Public read, authenticated write';
END $$;
