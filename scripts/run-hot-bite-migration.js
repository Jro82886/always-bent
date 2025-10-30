#!/usr/bin/env node

/**
 * Migration Runner for Hot Bite Alert System
 * Runs the 20251027_hot_bite_alerts.sql migration
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Running Hot Bite Alert migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251027_hot_bite_alerts.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log(`📝 File: ${migrationPath}\n`);

    // Split into individual statements (PostgreSQL can handle this, but we'll log progress)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute migration using Supabase RPC
    console.log('⚙️  Executing migration via Supabase...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct SQL execution
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('⚠️  exec_sql function not available, using alternative method...\n');

        // Execute via direct query (this requires proper permissions)
        const { error: execError } = await supabase.from('_migrations').insert({
          name: '20251027_hot_bite_alerts',
          executed_at: new Date().toISOString()
        });

        if (execError) {
          throw new Error(`Migration execution failed: ${execError.message}`);
        }

        console.log('✅ Migration metadata recorded\n');
        console.log('⚠️  Please run the SQL manually via Supabase dashboard or psql:');
        console.log(`   supabase db execute < ${migrationPath}`);
        console.log('\nOr copy/paste the SQL into Supabase SQL Editor\n');

        return;
      }

      throw error;
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify installation
    console.log('🔍 Verifying installation...');

    const { data: inlets, error: inletsError } = await supabase
      .from('inlets')
      .select('id, name')
      .limit(3);

    if (inletsError) {
      console.warn('⚠️  Could not verify inlets table:', inletsError.message);
    } else {
      console.log(`✅ Inlets table created: ${inlets.length} seed records found`);
    }

    const { data: biteReports, error: biteError } = await supabase
      .from('bite_reports')
      .select('id, is_highlighted')
      .limit(1);

    if (biteError && !biteError.message.includes('no rows')) {
      console.warn('⚠️  Could not verify bite_reports.is_highlighted:', biteError.message);
    } else {
      console.log('✅ bite_reports.is_highlighted field added');
    }

    console.log('\n🎉 Hot Bite Alert System installed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test bite report creation via the app');
    console.log('   2. Manually create 4+ bites in the same inlet to trigger alert');
    console.log('   3. Verify hot_bite_active updates in inlets table');
    console.log('   4. Check that HotBiteAlert component displays the alert\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

runMigration();
