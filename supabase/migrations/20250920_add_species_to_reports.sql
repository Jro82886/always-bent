-- 1. Add species column to reports table
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS species text[] DEFAULT '{}';

-- 2. Create GIN index for fast species filtering
CREATE INDEX IF NOT EXISTS idx_reports_species
  ON reports USING gin (species);

-- 3. Function to normalize species (lowercase, spaces to dashes, no dupes)
CREATE OR REPLACE FUNCTION normalize_species(input text[])
RETURNS text[] AS $$
DECLARE
  cleaned text[];
BEGIN
  IF input IS NULL THEN
    RETURN '{}';
  END IF;

  cleaned := (
    SELECT array_agg(DISTINCT regexp_replace(lower(trim(s)), '\s+', '-', 'g'))
    FROM unnest(input) AS s
    WHERE s IS NOT NULL AND length(trim(s)) > 0
  );
  RETURN coalesce(cleaned, '{}');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Trigger function to auto-normalize species on insert/update
CREATE OR REPLACE FUNCTION trg_normalize_species()
RETURNS trigger AS $$
BEGIN
  new.species := normalize_species(new.species);
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger
DROP TRIGGER IF EXISTS normalize_species_trigger ON reports;
CREATE TRIGGER normalize_species_trigger
BEFORE INSERT OR UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION trg_normalize_species();

-- 6. Normalize any existing data
UPDATE reports 
SET species = normalize_species(species) 
WHERE species IS NOT NULL AND species != '{}';
