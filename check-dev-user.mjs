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

console.log('Checking for dev user...\n');

const devUserId = '00000000-0000-0000-0000-000000000001';

// Check if user exists
const { data: existingUser, error } = await supabase.auth.admin.getUserById(devUserId);

if (!error && existingUser?.user) {
  console.log('✅ Dev user EXISTS!');
  console.log('User ID:', existingUser.user.id);
  console.log('Email:', existingUser.user.email);
} else {
  console.log('❌ Dev user NOT FOUND');
  console.log('\nAttempting to create dev user...\n');

  // Try to create it
  const { data, error: createError } = await supabase.auth.admin.createUser({
    email: 'dev@always-bent.com',
    email_confirm: true,
    user_metadata: {
      name: 'Dev User'
    }
  });

  if (createError) {
    console.error('❌ Failed to create:', createError.message);
    console.log('\n📝 Please run this SQL in Supabase SQL Editor:');
    console.log(`
-- Insert dev user directly into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dev@always-bent.com',
  '',
  NOW(),
  NOW(),
  NOW(),
  ''
) ON CONFLICT (id) DO NOTHING;

-- Also insert into auth.identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '{"sub": "00000000-0000-0000-0000-000000000001", "email": "dev@always-bent.com"}'::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider, id) DO NOTHING;
    `);
  } else {
    console.log('✅ Dev user created!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
  }
}
