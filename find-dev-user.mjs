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

console.log('Searching for dev user by email...\n');

// List all users to find the one with our email
const { data: { users }, error } = await supabase.auth.admin.listUsers();

if (error) {
  console.error('❌ Error listing users:', error.message);
  process.exit(1);
}

const devUser = users.find(u => u.email === 'dev@always-bent.com');

if (devUser) {
  console.log('✅ Found user with email dev@always-bent.com:');
  console.log('Current User ID:', devUser.id);
  console.log('Email:', devUser.email);
  console.log('\nThe reports API is looking for user ID: 00000000-0000-0000-0000-000000000001');
  console.log('\nWe need to update the API to use the actual user ID:', devUser.id);
} else {
  console.log('❌ No user found with email dev@always-bent.com');
}
