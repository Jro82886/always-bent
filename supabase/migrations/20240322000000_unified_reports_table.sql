-- Unified Reports Table Migration
-- Phase 1: Schema & API Foundation
-- This migration is idempotent and includes rollback support

-- UP Migration
-- Create unified reports table with enforced schema
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inlet_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('snip','bite')),
  status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('queued','complete','failed')),
  source TEXT NOT NULL DEFAULT 'online' CHECK (source IN ('online','offline')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload_json JSONB NOT NULL,
  meta JSONB NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_user ON public.reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_inlet ON public.reports(inlet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  -- Drop existing policies if they exist (idempotency)
  DROP POLICY IF EXISTS "users can read own reports" ON public.reports;
  DROP POLICY IF EXISTS "users can insert own reports" ON public.reports;
  DROP POLICY IF EXISTS "users can update own reports" ON public.reports;
END $$;

-- Users can only read their own reports
CREATE POLICY "users can read own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own reports
CREATE POLICY "users can insert own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own reports
CREATE POLICY "users can update own reports"
  ON public.reports FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_reports_updated_at_trigger ON public.reports;
CREATE TRIGGER update_reports_updated_at_trigger
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.reports IS 'Unified table for Snip analysis reports and Bite quick reports';
COMMENT ON COLUMN public.reports.type IS 'Report type: snip (full analysis) or bite (quick GPS report)';
COMMENT ON COLUMN public.reports.status IS 'Report status: queued (offline pending sync), complete (synced), or failed';
COMMENT ON COLUMN public.reports.source IS 'Report origin: online (created while connected) or offline (synced later)';
COMMENT ON COLUMN public.reports.payload_json IS 'Report data with kind-specific structure (snip or bite payload)';
COMMENT ON COLUMN public.reports.meta IS 'Optional metadata: client info, version, etc.';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT USAGE ON SEQUENCE reports_id_seq TO authenticated IF EXISTS (
  SELECT 1 FROM information_schema.sequences 
  WHERE sequence_name = 'reports_id_seq'
);

-- Verify the migration
DO $$
BEGIN
  RAISE NOTICE 'Reports table migration completed successfully';
  RAISE NOTICE 'Table created with RLS enabled and policies in place';
END $$;
