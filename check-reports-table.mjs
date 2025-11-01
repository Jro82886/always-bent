import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Checking if reports table exists...\n');

// Try to query the table
const { data, error } = await supabase
  .from('reports')
  .select('*')
  .limit(1);

if (error) {
  console.error('❌ Table does NOT exist or is not accessible');
  console.error('Error:', error.message);
  console.log('\n📝 You need to create the table in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/hobvjmmambhonsugehge/sql/new');
} else {
  console.log('✅ Table EXISTS and is accessible!');
  console.log('Data:', data);
  console.log('\n🔄 The schema cache might need to be refreshed.');
  console.log('Try restarting your dev server or wait a few seconds.');
}
