/**
 * Script to create test users for Always Bent Fishing Intelligence
 * Run with: node scripts/create-test-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Test users to create
const testUsers = [
  {
    email: 'captain.jack@test.com',
    password: 'FishOn2024!',
    captain_name: 'Captain Jack',
    boat_name: 'Sea Hunter',
    home_port: 'Ocean City'
  },
  {
    email: 'captain.sarah@test.com',
    password: 'ReelTime2024!',
    captain_name: 'Captain Sarah',
    boat_name: 'Blue Marlin',
    home_port: 'Montauk'
  },
  {
    email: 'captain.mike@test.com',
    password: 'TightLines2024!',
    captain_name: 'Captain Mike',
    boat_name: 'Offshore Dream',
    home_port: 'Cape May'
  }
];

async function createTestUsers() {
  console.log('🎣 Creating test users for Always Bent...\n');
  
  for (const user of testUsers) {
    try {
      // Create user account
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email for testing
        user_metadata: {
          captain_name: user.captain_name,
          boat_name: user.boat_name,
          home_port: user.home_port
        }
      });
      
      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`⚠️  User ${user.email} already exists - skipping`);
          continue;
        }
        throw authError;
      }
      
      // Create profile entry
      if (authData?.user) {
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: user.email,
            captain_name: user.captain_name,
            boat_name: user.boat_name,
            home_port: user.home_port,
            created_at: new Date().toISOString()
          });
        
        console.log(`✅ Created test user:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${user.password}`);
        console.log(`   Captain: ${user.captain_name}`);
        console.log(`   Boat: ${user.boat_name}`);
        console.log(`   Port: ${user.home_port}\n`);
      }
      
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
    }
  }
  
  console.log('\n🎉 Test user creation complete!');
  console.log('\n📝 Test User Credentials Summary:');
  console.log('================================');
  testUsers.forEach(user => {
    console.log(`\n${user.captain_name}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
  });
  console.log('\n================================');
  console.log('\n🔐 These users can now login at /auth/login');
  console.log('⚠️  Remember to delete these test users before going to production!');
}

// Run the script
createTestUsers().catch(console.error);
