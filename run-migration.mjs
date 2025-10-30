#!/usr/bin/env node

/**
 * Hot Bite Alert Migration Runner
 * Executes the migration SQL directly via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runMigration() {
  try {
    console.log('\n🚀 Running Hot Bite Alert Migration\n');

    // Read migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251027_hot_bite_alerts.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Loaded migration file');
    console.log('📝 Executing SQL...\n');

    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We need to use the Postgres REST API or execute via psql

    console.log('⚠️  Direct SQL execution via JS client is not supported.\n');
    console.log('📋 Please run the migration using ONE of these methods:\n');
    console.log('Option 1: Via Supabase Dashboard');
    console.log('  1. Go to https://supabase.com/dashboard');
    console.log('  2. Select your project');
    console.log('  3. Go to SQL Editor');
    console.log('  4. Paste the contents of: supabase/migrations/20251027_hot_bite_alerts.sql');
    console.log('  5. Click "Run"\n');

    console.log('Option 2: Via psql command line');
    console.log('  psql "$DATABASE_URL" < supabase/migrations/20251027_hot_bite_alerts.sql\n');

    console.log('Option 3: Via Supabase CLI');
    console.log('  supabase db push\n');

    console.log('💡 After running the migration, verify with:');
    console.log('   - Check that "inlets" table exists');
    console.log('   - Check that bite_reports.is_highlighted column exists');
    console.log('   - Test creating 4+ bite reports in same inlet\n');

    // Print the SQL for easy copy-paste
    console.log('📋 SQL Migration Content (for copy-paste):');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();
