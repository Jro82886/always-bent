-- Migration: Hot Bite Alert System
-- Date: 2025-10-27
-- Description: Adds hot bite detection infrastructure

-- Add is_highlighted field to bite_reports table
ALTER TABLE bite_reports
ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT false;

-- Create index for quick hot bite queries
CREATE INDEX IF NOT EXISTS idx_bite_reports_highlighted
ON bite_reports(is_highlighted, created_at DESC)
WHERE is_highlighted = true;

-- Create inlets table for tracking hot bite status
CREATE TABLE IF NOT EXISTS inlets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,

  -- Hot bite status
  hot_bite_active BOOLEAN DEFAULT false,
  hot_bite_timestamp TIMESTAMPTZ,
  hot_bite_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for real-time queries
CREATE INDEX IF NOT EXISTS idx_inlets_hot_bite_active
ON inlets(hot_bite_active, hot_bite_timestamp DESC)
WHERE hot_bite_active = true;

-- Enable RLS on inlets table
ALTER TABLE inlets ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to read inlet status
CREATE POLICY "Anyone can view inlet status"
  ON inlets FOR SELECT
  USING (true);

-- Policy: Only service role can update inlet status
CREATE POLICY "Only service role can update inlets"
  ON inlets FOR UPDATE
  USING (auth.role() = 'service_role');

-- Function to detect hot bites and update inlet status
CREATE OR REPLACE FUNCTION check_hot_bite_trigger()
RETURNS TRIGGER AS $$
DECLARE
  bite_count INTEGER;
  inlet_record RECORD;
BEGIN
  -- Only process bite reports
  IF NEW.inlet_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count bites in the same inlet within the last hour
  SELECT COUNT(*) INTO bite_count
  FROM bite_reports
  WHERE inlet_id = NEW.inlet_id
    AND created_at >= NOW() - INTERVAL '1 hour';

  -- If 4 or more bites detected, activate hot bite alert
  IF bite_count >= 4 THEN
    -- Upsert inlet record with hot bite status
    INSERT INTO inlets (id, name, hot_bite_active, hot_bite_timestamp, hot_bite_count, updated_at)
    VALUES (
      NEW.inlet_id,
      NEW.inlet_id, -- Will be updated with proper name in application
      true,
      NOW(),
      bite_count,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      hot_bite_active = true,
      hot_bite_timestamp = NOW(),
      hot_bite_count = bite_count,
      updated_at = NOW();

    -- Mark all recent bites in this inlet as highlighted
    UPDATE bite_reports
    SET is_highlighted = true
    WHERE inlet_id = NEW.inlet_id
      AND created_at >= NOW() - INTERVAL '1 hour'
      AND is_highlighted = false;

    -- Log detection
    RAISE NOTICE 'Hot Bite Alert activated for inlet %: % bites in last hour', NEW.inlet_id, bite_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run after each bite report insert
DROP TRIGGER IF EXISTS trigger_check_hot_bite ON bite_reports;
CREATE TRIGGER trigger_check_hot_bite
  AFTER INSERT ON bite_reports
  FOR EACH ROW
  EXECUTE FUNCTION check_hot_bite_trigger();

-- Function to deactivate hot bites after 2 hours
CREATE OR REPLACE FUNCTION cleanup_hot_bites()
RETURNS void AS $$
BEGIN
  UPDATE inlets
  SET
    hot_bite_active = false,
    updated_at = NOW()
  WHERE hot_bite_active = true
    AND hot_bite_timestamp < NOW() - INTERVAL '2 hours';

  -- Log cleanup
  RAISE NOTICE 'Hot Bite cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Seed initial inlet data (all 32 East Coast inlets)
INSERT INTO inlets (id, name) VALUES
  -- Maine
  ('me-portland', 'Portland Harbor / Casco Bay, ME'),

  -- Massachusetts
  ('ma-cape-cod', 'Cape Cod Canal East, MA'),

  -- Rhode Island
  ('ri-point-judith', 'Point Judith Harbor, RI'),

  -- New York
  ('ny-montauk', 'Montauk Harbor, NY'),
  ('ny-shinnecock', 'Shinnecock Inlet, NY'),

  -- New Jersey
  ('nj-barnegat', 'Barnegat Inlet, NJ'),
  ('nj-manasquan', 'Manasquan Inlet, NJ'),
  ('nj-atlantic-city', 'Absecon Inlet, NJ'),

  -- Delaware
  ('de-indian-river', 'Indian River Inlet, DE'),

  -- Maryland
  ('md-ocean-city', 'Ocean City Inlet, MD'),

  -- Virginia
  ('va-chincoteague', 'Chincoteague Inlet, VA'),

  -- North Carolina
  ('nc-oregon', 'Oregon Inlet, NC'),
  ('nc-hatteras', 'Hatteras Inlet, NC'),
  ('nc-ocracoke', 'Ocracoke Inlet, NC'),
  ('nc-beaufort', 'Beaufort Inlet, NC'),
  ('nc-cape-fear', 'Cape Fear River, NC'),

  -- South Carolina
  ('sc-charleston', 'Charleston Harbor, SC'),
  ('sc-st-helena', 'St. Helena Sound, SC'),

  -- Georgia
  ('ga-savannah', 'Savannah River, GA'),
  ('ga-st-marys', 'St. Marys Entrance, GA/FL'),

  -- Florida
  ('fl-jacksonville', 'St. Johns River, FL'),
  ('fl-ponce', 'Ponce de Leon Inlet, FL'),
  ('fl-canaveral', 'Port Canaveral, FL'),
  ('fl-sebastian', 'Sebastian Inlet, FL'),
  ('fl-st-lucie', 'St. Lucie Inlet, FL'),
  ('fl-jupiter', 'Jupiter Inlet, FL'),
  ('fl-lake-worth', 'Lake Worth Inlet, FL'),
  ('fl-port-everglades', 'Port Everglades, FL'),
  ('fl-miami', 'Government Cut, FL'),
  ('fl-key-west', 'Key West Harbor, FL')
ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Hot Bite Alert system installed successfully!';
  RAISE NOTICE 'Run cleanup_hot_bites() periodically to deactivate old alerts';
END;
$$;
