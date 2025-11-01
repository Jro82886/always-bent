import pg from 'pg';
const { Client } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.hobvjmmambhonsugehge:figbuk-2duzme-Wivvar@aws-0-us-west-1.pooler.supabase.com:5432/postgres';

const client = new Client({ connectionString });

try {
  await client.connect();
  console.log('Connected to database...');
  
  // Send NOTIFY to reload schema
  await client.query('NOTIFY pgrst, \'reload schema\'');
  console.log('✅ Schema reload notification sent!');
  console.log('Wait 5-10 seconds, then try saving your snip again.');
  
  await client.end();
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
