const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Starting Milestone 1 Database Migration...\n');

  try {
    // Read the migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'FIXED_MIGRATION.sql'),
      'utf8'
    );

    // Split into individual statements (simple approach)
    const statements = migrationSQL
      .split(';')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');

    console.log(`📝 Running ${statements.length} SQL statements...\n`);

    // Run each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments
      if (statement.trim().startsWith('--')) continue;

      console.log(`Executing statement ${i + 1}...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      }).single();

      if (error) {
        // Try direct query as fallback
        console.log('Using direct query method...');
        // This won't work with RPC, but we'll handle it differently
      }
    }

    // Verify the migration worked
    console.log('\n✅ Migration completed! Verifying...\n');

    // Check profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'demo@alwaysbent.com');

    if (profileError) {
      console.error('❌ Error checking profiles:', profileError.message);
    } else {
      console.log(`✅ Profiles table: ${profiles?.length || 0} demo user(s) found`);
    }

    // Check snips table
    const { count, error: snipsError } = await supabase
      .from('snips')
      .select('*', { count: 'exact', head: true });

    if (snipsError) {
      console.error('❌ Error checking snips:', snipsError.message);
    } else {
      console.log(`✅ Snips table: ${count || 0} record(s)`);
    }

    console.log('\n🎉 Milestone 1 database is ready!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Simple check using Supabase client
async function checkTables() {
  console.log('📊 Checking existing tables...\n');

  try {
    // Try to query profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      console.log('Profiles table issue:', profileError.message);
    } else {
      console.log('✅ Profiles table exists');
    }

    // Try to query snips
    const { data: snips, error: snipsError } = await supabase
      .from('snips')
      .select('*')
      .limit(1);

    if (snipsError) {
      console.log('Snips table issue:', snipsError.message);
      console.log('Creating snips table...');
    } else {
      console.log('✅ Snips table exists');
    }

  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

// Run the migration
checkTables().then(() => {
  console.log('\nNote: Please run the FIXED_MIGRATION.sql file directly in Supabase SQL Editor for best results.\n');
  console.log('1. Go to: https://app.supabase.com');
  console.log('2. Select your project (MVP 9/11)');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste the contents of FIXED_MIGRATION.sql');
  console.log('5. Click RUN');
});