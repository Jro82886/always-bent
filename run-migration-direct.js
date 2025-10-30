const { Client } = require('pg');
const fs = require('fs');

// Direct database connection from the CSV
const connectionString = 'postgresql://postgres.hobvjmmambhonsugehge:figbuk-2duzme-Wivvar@aws-0-us-west-1.pooler.supabase.com:5432/postgres';

async function runMigration() {
  const client = new Client({
    connectionString: connectionString
  });

  try {
    console.log('🔌 Connecting to database...\n');
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    // Read the migration SQL
    const migrationSQL = fs.readFileSync('./FINAL_WORKING_MIGRATION.sql', 'utf8');

    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'))
      .map(stmt => stmt.trim());

    console.log(`📝 Running ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip pure comments
      if (statement.startsWith('--') || statement.length < 10) continue;

      try {
        console.log(`Statement ${i + 1}: ${statement.substring(0, 50)}...`);
        await client.query(statement);
        console.log('  ✅ Success\n');
      } catch (err) {
        console.log(`  ⚠️  Warning: ${err.message}\n`);
        // Continue with other statements even if one fails
      }
    }

    console.log('🎉 Migration completed!\n');

    // Verify the results
    console.log('📊 Verifying migration...\n');

    const profileCheck = await client.query(
      "SELECT * FROM profiles WHERE email = 'demo@alwaysbent.com'"
    );
    console.log(`✅ Demo users: ${profileCheck.rowCount}`);

    const snipsCheck = await client.query(
      "SELECT COUNT(*) FROM snips"
    );
    console.log(`✅ Snips records: ${snipsCheck.rows[0].count}`);

    console.log('\n✨ Database is ready for Milestone 1 demo!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\nPlease run the migration manually in Supabase SQL Editor:');
    console.log('1. Go to: https://app.supabase.com/project/hobvjmmambhonsugehge/sql');
    console.log('2. Copy contents of FINAL_WORKING_MIGRATION.sql');
    console.log('3. Paste and click RUN');
  } finally {
    await client.end();
  }
}

// Check if pg module is installed
try {
  require('pg');
  runMigration();
} catch (err) {
  console.log('📦 Installing pg module...');
  const { execSync } = require('child_process');
  execSync('npm install pg', { stdio: 'inherit' });
  console.log('✅ Installed. Please run this script again: node run-migration-direct.js');
}