-- ROLLBACK Migration: Hot Bite Alert System
-- Date: 2025-10-27
-- Description: Safely removes hot bite detection infrastructure
-- IMPORTANT: This will delete the inlets table and remove the is_highlighted column

-- WARNING: This rollback will:
-- 1. Delete ALL data in the inlets table (hot bite status will be lost)
-- 2. Remove is_highlighted column from bite_reports (historical highlights will be lost)
-- 3. Remove the triggers and functions
-- Use with caution!

BEGIN;

-- Step 1: Drop triggers (safest to start with)
DROP TRIGGER IF EXISTS check_hot_bite ON bite_reports;
COMMENT ON SCHEMA public IS 'Dropped hot bite trigger';

-- Step 2: Drop functions
DROP FUNCTION IF EXISTS check_hot_bite_trigger() CASCADE;
DROP FUNCTION IF EXISTS cleanup_hot_bites() CASCADE;
COMMENT ON SCHEMA public IS 'Dropped hot bite functions';

-- Step 3: Drop policies (before dropping table)
DROP POLICY IF EXISTS "Anyone can view inlet status" ON inlets;
DROP POLICY IF EXISTS "Only service role can update inlets" ON inlets;
COMMENT ON SCHEMA public IS 'Dropped hot bite RLS policies';

-- Step 4: Drop indexes
DROP INDEX IF EXISTS idx_inlets_hot_bite_active;
DROP INDEX IF EXISTS idx_bite_reports_highlighted;
COMMENT ON SCHEMA public IS 'Dropped hot bite indexes';

-- Step 5: Drop inlets table
-- CAUTION: This will delete all hot bite status data
DROP TABLE IF EXISTS inlets CASCADE;
COMMENT ON SCHEMA public IS 'Dropped inlets table';

-- Step 6: Remove is_highlighted column from bite_reports
-- CAUTION: This will delete historical highlight data
ALTER TABLE bite_reports DROP COLUMN IF EXISTS is_highlighted;
COMMENT ON TABLE bite_reports IS 'Removed is_highlighted column';

COMMIT;

-- Verification queries (run these after rollback to confirm)
-- These should all return errors or empty results:
-- SELECT * FROM inlets; -- Should error: relation does not exist
-- SELECT is_highlighted FROM bite_reports LIMIT 1; -- Should error: column does not exist
-- SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%hot_bite%'; -- Should be empty

COMMENT ON SCHEMA public IS 'Hot Bite Alert rollback completed successfully';
