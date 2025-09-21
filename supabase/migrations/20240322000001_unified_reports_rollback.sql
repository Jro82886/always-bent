-- DOWN Migration - Rollback script for unified reports table
-- Run this to safely remove the reports table and all associated objects

-- Drop triggers first
DROP TRIGGER IF EXISTS update_reports_updated_at_trigger ON public.reports;

-- Drop functions
DROP FUNCTION IF EXISTS update_reports_updated_at();

-- Drop policies
DROP POLICY IF EXISTS "users can read own reports" ON public.reports;
DROP POLICY IF EXISTS "users can insert own reports" ON public.reports;
DROP POLICY IF EXISTS "users can update own reports" ON public.reports;

-- Drop indexes
DROP INDEX IF EXISTS idx_reports_user;
DROP INDEX IF EXISTS idx_reports_inlet;
DROP INDEX IF EXISTS idx_reports_type;
DROP INDEX IF EXISTS idx_reports_status;

-- Drop the table
DROP TABLE IF EXISTS public.reports;

-- Verify rollback
DO $$
BEGIN
  RAISE NOTICE 'Reports table rollback completed successfully';
  RAISE NOTICE 'All associated objects have been removed';
END $$;
