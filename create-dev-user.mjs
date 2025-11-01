import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

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

console.log('Creating dev user...\n');

const devUserId = '00000000-0000-0000-0000-000000000001';
const devEmail = 'dev@always-bent.com';

// Check if user already exists
const { data: existingUser } = await supabase.auth.admin.getUserById(devUserId);

if (existingUser?.user) {
  console.log('✅ Dev user already exists!');
  console.log('User:', existingUser.user.email);
} else {
  // Create the user
  const { data, error } = await supabase.auth.admin.createUser({
    email: devEmail,
    email_confirm: true,
    user_metadata: {
      name: 'Dev User'
    },
    // Use the specific UUID we want
    // Note: This might not work with all Supabase versions
  });

  if (error) {
    console.error('❌ Failed to create dev user:', error.message);
    console.log('\n📝 Please create the dev user manually in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/hobvjmmambhonsugehge/auth/users');
    console.log('\nOr run this SQL in the SQL Editor:');
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
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dev@always-bent.com',
  '',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
    `);
  } else {
    console.log('✅ Dev user created successfully!');
    console.log('User:', data.user?.email);
  }
}

console.log('\n✅ Setup complete! You can now save snip reports.');
