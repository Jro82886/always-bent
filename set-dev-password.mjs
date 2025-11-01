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

console.log('Setting password for dev@always-bent.com...\n');

const devUserId = '05a3cd96-01b5-4280-97cb-46400fab45b9';
const newPassword = 'DevPassword123!'; // You can change this

const { data, error } = await supabase.auth.admin.updateUserById(
  devUserId,
  { password: newPassword }
);

if (error) {
  console.error('❌ Failed to set password:', error.message);
} else {
  console.log('✅ Password set successfully!');
  console.log('\nLogin credentials:');
  console.log('Email: dev@always-bent.com');
  console.log('Password:', newPassword);
  console.log('\nYou can now log in with these credentials.');
}
