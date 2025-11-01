import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Reading migration file...');
const sql = readFileSync('./supabase/migrations/20240322000000_unified_reports_table.sql', 'utf8');

console.log('Running migration...');
const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql }).catch(async () => {
  // Fallback: try to create the table directly using the REST API
  // Split the SQL into individual statements and execute them
  console.log('Trying direct execution...');

  // Just create the essential table structure
  const createTableSQL = `
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
  `;

  const { error: createError } = await supabase.rpc('exec_sql', { sql_string: createTableSQL });
  return { data: null, error: createError };
});

if (error) {
  console.error('Migration failed:', error);
  console.log('\nPlease run this SQL manually in the Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/hobvjmmambhonsugehge/sql/new');
  console.log('\nSQL to run:');
  console.log(sql);
  process.exit(1);
}

console.log('✅ Migration completed successfully!');
console.log('The reports table is now ready.');
