-- CHECK WHAT TABLES AND COLUMNS ACTUALLY EXIST

-- List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Show columns for each table mentioned in the performance advisor
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN (
        'catch_reports',
        'profiles', 
        'snip_analyses',
        'vessel_tracks',
        'hotspot_intelligence'
    )
ORDER BY table_name, ordinal_position;
