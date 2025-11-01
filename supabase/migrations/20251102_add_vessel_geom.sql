-- Migration: Add geom column to vessel_positions
-- Date: 2025-11-02
-- Description: Adds PostGIS geometry column for spatial queries

-- Ensure PostGIS extension is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geom column to vessel_positions
ALTER TABLE vessel_positions
ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

-- Create trigger function to auto-populate geom from lat/lng
CREATE OR REPLACE FUNCTION vp_set_geom()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run on INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_vp_set_geom ON vessel_positions;
CREATE TRIGGER trg_vp_set_geom
  BEFORE INSERT OR UPDATE ON vessel_positions
  FOR EACH ROW
  EXECUTE FUNCTION vp_set_geom();

-- Update existing records to populate geom
UPDATE vessel_positions
SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
WHERE geom IS NULL
  AND lat IS NOT NULL
  AND lng IS NOT NULL;

-- Create spatial index for fast queries
CREATE INDEX IF NOT EXISTS idx_vp_geom
  ON vessel_positions
  USING gist (geom);

-- Verify the update
SELECT
  COUNT(*) FILTER (WHERE geom IS NOT NULL) as with_geom,
  COUNT(*) FILTER (WHERE geom IS NULL) as without_geom,
  COUNT(*) as total
FROM vessel_positions;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'vessel_positions geom column added successfully!';
  RAISE NOTICE 'All existing records have been updated with geometry data.';
END;
$$;
