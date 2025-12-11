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

-- Step 1: Drop ALL existing RLS policies FIRST (before any column changes)
-- This is required because policies depend on the id column
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON profiles;

-- Step 2: Drop the foreign key constraint to auth.users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'profiles_id_fkey'
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
        RAISE NOTICE 'Dropped foreign key constraint profiles_id_fkey';
    ELSE
        RAISE NOTICE 'FK constraint profiles_id_fkey does not exist';
    END IF;
END $$;

-- Step 3: Change id column type to TEXT (supports Memberstack string IDs like "mem_sb_xxx")
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'id'
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
        RAISE NOTICE 'Changed profiles.id from UUID to TEXT';
    ELSE
        RAISE NOTICE 'profiles.id is already TEXT type';
    END IF;
END $$;

-- Step 4: Create new permissive RLS policies for Memberstack
CREATE POLICY "profiles_select_all" ON profiles
    FOR SELECT
    USING (true);

CREATE POLICY "profiles_insert_all" ON profiles
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "profiles_update_all" ON profiles
    FOR UPDATE
    USING (true);

-- Step 5: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant permissions to anon role
GRANT SELECT, INSERT, UPDATE ON profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- Step 7: Make email NOT unique (multiple Memberstack profiles may share email)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'profiles_email_key'
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_email_key;
        RAISE NOTICE 'Dropped unique constraint on email';
    END IF;
END $$;

-- Step 8: Make email nullable
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- Step 9: Add index on email for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'PROFILES TABLE FIXED FOR MEMBERSTACK!';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Memberstack users can now create/read profiles!';
END $$;
