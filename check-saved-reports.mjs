import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load both .env and .env.local
dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Checking saved reports...\n');

const devUserId = '05a3cd96-01b5-4280-97cb-46400fab45b9';

// Check all reports for dev user
const { data: reports, error } = await supabase
  .from('reports')
  .select('*')
  .eq('user_id', devUserId)
  .order('created_at', { ascending: false });

if (error) {
  console.error('❌ Error fetching reports:', error.message);
  process.exit(1);
}

console.log(`Found ${reports.length} report(s) for dev user:\n`);

reports.forEach((report, index) => {
  console.log(`Report #${index + 1}:`);
  console.log('  ID:', report.id);
  console.log('  Type:', report.type);
  console.log('  Status:', report.status);
  console.log('  Source:', report.source);
  console.log('  Inlet:', report.inlet_id);
  console.log('  Created:', report.created_at);
  console.log('  Payload keys:', Object.keys(report.payload_json));
  console.log('  Has narrative:', !!report.payload_json.narrative);
  console.log('  Has analysis:', !!report.payload_json.analysis);
  console.log('');
});
