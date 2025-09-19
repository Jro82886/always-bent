-- Tracking 4-day persistence and optimization migration

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_vessel_positions_user_inlet_time 
ON vessel_positions (user_id, inlet_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_vessel_positions_time_desc 
ON vessel_positions (timestamp DESC);

-- Add session_id column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vessel_positions' 
                   AND column_name = 'session_id') THEN
        ALTER TABLE vessel_positions ADD COLUMN session_id TEXT;
    END IF;
END $$;

-- Create function to clean up old positions (> 4 days)
CREATE OR REPLACE FUNCTION cleanup_old_vessel_positions()
RETURNS void AS $$
BEGIN
    -- Delete positions older than 4 days
    DELETE FROM vessel_positions 
    WHERE timestamp < NOW() - INTERVAL '4 days';
    
    -- Enforce per-vessel cap of 5000 points
    WITH numbered_positions AS (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY timestamp DESC) as rn
        FROM vessel_positions
    )
    DELETE FROM vessel_positions
    WHERE id IN (
        SELECT id FROM numbered_positions WHERE rn > 5000
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily
SELECT cron.schedule(
    'cleanup-vessel-positions',
    '0 3 * * *', -- 3 AM daily
    'SELECT cleanup_old_vessel_positions();'
);

-- Create function to get simplified tracks based on zoom level
CREATE OR REPLACE FUNCTION get_vessel_tracks(
    p_inlet_id TEXT,
    p_hours INTEGER DEFAULT 96, -- 4 days
    p_zoom_level INTEGER DEFAULT 12
)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    points JSONB
) AS $$
DECLARE
    v_tolerance FLOAT;
BEGIN
    -- Determine simplification tolerance based on zoom
    v_tolerance := CASE 
        WHEN p_zoom_level < 9 THEN 0.001   -- ~100m
        WHEN p_zoom_level < 12 THEN 0.0005 -- ~50m
        ELSE 0                              -- No simplification
    END;
    
    RETURN QUERY
    WITH recent_positions AS (
        SELECT 
            vp.user_id,
            vp.username,
            vp.lat,
            vp.lng,
            vp.timestamp,
            vp.heading,
            vp.speed
        FROM vessel_positions vp
        WHERE vp.inlet_id = p_inlet_id
          AND vp.timestamp > NOW() - (p_hours || ' hours')::INTERVAL
        ORDER BY vp.user_id, vp.timestamp
    ),
    simplified AS (
        SELECT 
            user_id,
            username,
            CASE 
                WHEN v_tolerance > 0 THEN
                    ST_AsGeoJSON(
                        ST_Simplify(
                            ST_MakeLine(
                                ST_MakePoint(lng, lat) ORDER BY timestamp
                            ),
                            v_tolerance
                        )
                    )::JSONB
                ELSE
                    JSONB_AGG(
                        JSONB_BUILD_OBJECT(
                            'lat', lat,
                            'lng', lng,
                            'ts', timestamp,
                            'hdg', heading,
                            'spd', speed
                        ) ORDER BY timestamp
                    )
            END as points
        FROM recent_positions
        GROUP BY user_id, username
    )
    SELECT 
        s.user_id,
        s.username,
        s.points
    FROM simplified s;
END;
$$ LANGUAGE plpgsql;

-- Create view for active fleet members (last 5 minutes)
CREATE OR REPLACE VIEW active_fleet AS
SELECT DISTINCT ON (user_id)
    user_id,
    username,
    inlet_id,
    lat,
    lng,
    speed,
    heading,
    timestamp,
    EXTRACT(EPOCH FROM (NOW() - timestamp)) / 60 as minutes_ago
FROM vessel_positions
WHERE timestamp > NOW() - INTERVAL '5 minutes'
ORDER BY user_id, timestamp DESC;

-- Grant permissions
GRANT SELECT ON active_fleet TO authenticated;
GRANT EXECUTE ON FUNCTION get_vessel_tracks TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_vessel_positions TO service_role;
