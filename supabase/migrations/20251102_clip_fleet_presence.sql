-- Migration: Clip Fleet Presence RPC Function
-- Date: 2025-11-02
-- Description: Returns fleet vessel counts and presence stats within a polygon

-- ================================================================================================
-- clip_fleet_presence() - Query vessel positions within a polygon
-- ================================================================================================
-- This function:
-- 1. Converts GeoJSON polygon to PostGIS geometry
-- 2. Finds all vessel_positions within polygon and time range
-- 3. Counts unique vessels from the specified inlet
-- 4. Calculates consecutive days with vessel presence
-- ================================================================================================

CREATE OR REPLACE FUNCTION clip_fleet_presence(
  polygon_geojson JSONB,
  inlet_id TEXT,
  hours_back INTEGER DEFAULT 96
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  polygon_geom GEOMETRY;
  unique_vessel_count INTEGER;
  consecutive_days INTEGER;
  result JSONB;
  time_threshold TIMESTAMPTZ;
BEGIN
  -- Calculate time threshold
  time_threshold := NOW() - (hours_back || ' hours')::INTERVAL;

  -- Convert GeoJSON polygon to PostGIS geometry
  -- GeoJSON format: {"type": "Polygon", "coordinates": [[[lng,lat], [lng,lat], ...]]}
  BEGIN
    polygon_geom := ST_GeomFromGeoJSON(polygon_geojson::TEXT);

    -- Ensure it's a valid polygon in SRID 4326
    IF NOT ST_IsValid(polygon_geom) THEN
      RAISE EXCEPTION 'Invalid polygon geometry';
    END IF;

    -- Set SRID to 4326 (WGS84) to match vessel_positions.geom
    polygon_geom := ST_SetSRID(polygon_geom, 4326);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to parse GeoJSON polygon: %', SQLERRM;
  END;

  -- Count unique vessels within polygon and time range for this inlet
  SELECT COUNT(DISTINCT vessel_id)
  INTO unique_vessel_count
  FROM vessel_positions
  WHERE inlet_id = clip_fleet_presence.inlet_id
    AND recorded_at >= time_threshold
    AND geom IS NOT NULL
    AND ST_Within(geom, polygon_geom);

  -- Calculate consecutive days with presence (up to 7 days)
  -- Group positions by day, count how many consecutive days (from today backwards) have activity
  WITH daily_presence AS (
    SELECT DISTINCT DATE(recorded_at) as presence_date
    FROM vessel_positions
    WHERE inlet_id = clip_fleet_presence.inlet_id
      AND recorded_at >= NOW() - INTERVAL '7 days'
      AND geom IS NOT NULL
      AND ST_Within(geom, polygon_geom)
    ORDER BY presence_date DESC
  ),
  consecutive_calc AS (
    SELECT
      presence_date,
      ROW_NUMBER() OVER (ORDER BY presence_date DESC) as rn,
      DATE(NOW()) - presence_date as days_ago
    FROM daily_presence
  )
  SELECT COUNT(*)
  INTO consecutive_days
  FROM consecutive_calc
  WHERE days_ago = rn - 1;  -- consecutive days from today

  -- Handle case where no data exists
  IF consecutive_days IS NULL THEN
    consecutive_days := 0;
  END IF;

  -- Build result as JSONB
  result := jsonb_build_object(
    'myVesselInArea', FALSE,  -- TODO: Implement user vessel check when auth is ready
    'fleetVessels', COALESCE(unique_vessel_count, 0),
    'fleetVisitsDays', LEAST(consecutive_days, 7),  -- Cap at 7 days
    'gfw', NULL  -- GFW data handled separately
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- Return safe defaults on any error
  RAISE WARNING 'clip_fleet_presence error: %', SQLERRM;
  RETURN jsonb_build_object(
    'myVesselInArea', FALSE,
    'fleetVessels', 0,
    'fleetVisitsDays', 0,
    'gfw', NULL
  );
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION clip_fleet_presence IS
'Returns fleet vessel counts and presence stats within a polygon.
Parameters:
  - polygon_geojson: GeoJSON Polygon object
  - inlet_id: Inlet identifier (e.g. "md-ocean-city")
  - hours_back: How many hours to look back (default 96 = 4 days)
Returns JSONB with: myVesselInArea, fleetVessels, fleetVisitsDays, gfw';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION clip_fleet_presence TO authenticated;
GRANT EXECUTE ON FUNCTION clip_fleet_presence TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'clip_fleet_presence RPC function created successfully!';
  RAISE NOTICE 'Test with: SELECT clip_fleet_presence(''{"type":"Polygon","coordinates":[[[-75.1,38.3],[-75.0,38.3],[-75.0,38.4],[-75.1,38.4],[-75.1,38.3]]]}''::jsonb, ''md-ocean-city'', 96);';
END;
$$;
