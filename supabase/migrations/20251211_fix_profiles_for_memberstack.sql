-- Fix profiles table to work with Memberstack authentication
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hobvjmmambhonsugehge/sql

-- =============================================
-- PROBLEM:
-- The profiles table was designed for Supabase Auth users with:
--   1. Foreign key constraint: id REFERENCES auth.users(id)
--   2. RLS policies requiring auth.uid() = id
--
-- Memberstack users have different IDs that don't exist in auth.users,
-- causing 406 (GET blocked by RLS) and 400 (INSERT fails FK constraint)
-- =============================================

-- Step 1: Drop the foreign key constraint to auth.users
-- This allows Memberstack IDs (which aren't in auth.users) to be stored
DO $$
BEGIN
    -- Find and drop the FK constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'profiles_id_fkey'
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
        RAISE NOTICE 'Dropped foreign key constraint profiles_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint profiles_id_fkey does not exist (already dropped or different name)';
    END IF;
END $$;

-- Step 2: Change id column type to TEXT to support Memberstack string IDs
-- Memberstack IDs are like "mem_sb_xxx" not UUIDs
DO $$
BEGIN
    -- Check current column type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'id'
        AND data_type = 'uuid'
    ) THEN
        -- Need to alter column type - this may fail if there's data
        -- First drop dependent constraints
        ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
        RAISE NOTICE 'Changed profiles.id from UUID to TEXT';
    ELSE
        RAISE NOTICE 'profiles.id is already TEXT type';
    END IF;
END $$;

-- Step 3: Drop existing RLS policies that may conflict
DO $$
BEGIN
    -- Drop old restrictive policies
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Public can view profiles" ON profiles;
    RAISE NOTICE 'Dropped existing RLS policies';
END $$;

-- Step 4: Create new permissive RLS policies for Memberstack
-- Allow public read access (needed for lookups)
CREATE POLICY "profiles_select_all" ON profiles
    FOR SELECT
    USING (true);

-- Allow inserts for anyone (Memberstack handles auth)
CREATE POLICY "profiles_insert_all" ON profiles
    FOR INSERT
    WITH CHECK (true);

-- Allow updates for anyone (frontend handles auth via Memberstack)
CREATE POLICY "profiles_update_all" ON profiles
    FOR UPDATE
    USING (true);

-- Step 5: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant permissions to anon role
GRANT SELECT, INSERT, UPDATE ON profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- Step 7: Make email NOT unique (multiple Memberstack profiles may share email in edge cases)
DO $$
BEGIN
    -- Drop unique constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'profiles_email_key'
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_email_key;
        RAISE NOTICE 'Dropped unique constraint on email';
    END IF;
END $$;

-- Step 8: Make email nullable (not all Memberstack users may have email)
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- Step 9: Add index on email for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'PROFILES TABLE FIXED FOR MEMBERSTACK!';
    RAISE NOTICE '=========================================';
    RAISE NOTICE '✅ Removed auth.users foreign key constraint';
    RAISE NOTICE '✅ Changed id column to TEXT (supports Memberstack IDs)';
    RAISE NOTICE '✅ Created permissive RLS policies';
    RAISE NOTICE '✅ Granted anon permissions';
    RAISE NOTICE '✅ Made email nullable and non-unique';
    RAISE NOTICE '';
    RAISE NOTICE 'Memberstack users can now create/read profiles!';
END $$;
