#!/usr/bin/env node

/**
 * Create multiple test accounts for the ABFI fleet
 * Each represents a different captain/vessel for testing multiplayer features
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hobvjmmambhonsugehge.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYnZqbW1hbWJob25zdWdlaGdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYyNzEzMSwiZXhwIjoyMDczMjAzMTMxfQ.5BMjXQ0kev81tbU6CVVX7cjvZeA49tbqKKZZ2F2wgbg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test fleet - different boats for testing
const TEST_FLEET = [
  {
    email: 'captain1@test.com',
    password: 'test123',
    captain_name: 'Captain Mike',
    boat_name: 'Reel Deal',
    home_inlet: 'Ocean City'
  },
  {
    email: 'captain2@test.com',
    password: 'test123',
    captain_name: 'Captain Sarah',
    boat_name: 'Blue Horizon',
    home_inlet: 'Montauk'
  },
  {
    email: 'captain3@test.com',
    password: 'test123',
    captain_name: 'Captain Tom',
    boat_name: 'Marlin Hunter',
    home_inlet: 'Hatteras'
  },
  {
    email: 'captain4@test.com',
    password: 'test123',
    captain_name: 'Captain Lisa',
    boat_name: 'Tuna Time',
    home_inlet: 'Point Judith'
  },
  {
    email: 'captain5@test.com',
    password: 'test123',
    captain_name: 'Captain Alex',
    boat_name: 'Offshore Dream',
    home_inlet: 'Barnegat'
  }
];

async function createTestFleet() {
  console.log('🚢 Creating ABFI Test Fleet...\n');
  console.log('This will create multiple test accounts so you can test:');
  console.log('  • Fleet tracking (see multiple vessels)');
  console.log('  • Live chat between captains');
  console.log('  • Community features');
  console.log('  • Real-time presence\n');
  
  const created = [];
  
  for (const captain of TEST_FLEET) {
    // Check if already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const exists = existingUsers?.users?.find(u => u.email === captain.email);
    
    if (exists) {
      console.log(`✅ ${captain.captain_name} already exists (${captain.boat_name})`);
      
      // Make sure it's confirmed
      if (!exists.email_confirmed_at) {
        await supabase.auth.admin.updateUserById(
          exists.id,
          { email_confirmed_at: new Date().toISOString() }
        );
        console.log(`   📧 Confirmed email for ${captain.captain_name}`);
      }
      
      created.push(captain);
      continue;
    }
    
    // Create the account
    const { data, error } = await supabase.auth.admin.createUser({
      email: captain.email,
      password: captain.password,
      email_confirm: true,  // Auto-confirm
      user_metadata: {
        captain_name: captain.captain_name,
        boat_name: captain.boat_name,
        home_inlet: captain.home_inlet
      }
    });
    
    if (error) {
      console.error(`❌ Error creating ${captain.captain_name}:`, error.message);
      continue;
    }
    
    console.log(`✅ Created ${captain.captain_name} - ${captain.boat_name}`);
    created.push(captain);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 TEST FLEET READY!\n');
  console.log('All accounts use password: test123\n');
  
  console.log('QUICK LOGIN CREDENTIALS:');
  console.log('-'.repeat(40));
  created.forEach((captain, i) => {
    console.log(`${i + 1}. ${captain.captain_name} (${captain.boat_name})`);
    console.log(`   Email: ${captain.email}`);
    console.log(`   Pass: ${captain.password}`);
    console.log(`   Inlet: ${captain.home_inlet}`);
    if (i < created.length - 1) console.log();
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 HOW TO TEST MULTIPLAYER:');
  console.log('1. Open multiple browser windows (or use incognito)');
  console.log('2. Login as different captains');
  console.log('3. Go to Tracking mode');
  console.log('4. Enable "Show Fleet" to see each other');
  console.log('5. Test chat, vessel positions, etc.\n');
}

createTestFleet();
