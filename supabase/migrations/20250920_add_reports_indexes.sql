-- Add indexes for fast report queries by month
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_type_created_at ON reports (type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_created_at ON reports (user_id, created_at DESC);

-- Add composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_reports_user_type_created ON reports (user_id, type, created_at DESC);
