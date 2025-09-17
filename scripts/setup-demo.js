#!/usr/bin/env node

/**
 * Set up demo account for instant access
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

async function createDemoAccount() {
  console.log('🚀 Setting up demo account for instant access...\n');
  
  // First check if it exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const demoExists = existingUsers?.users?.find(u => u.email === 'demo@alwaysbent.com');
  
  if (demoExists) {
    console.log('✅ Demo account already exists!');
    
    // Make sure it's confirmed
    if (!demoExists.email_confirmed_at) {
      console.log('📧 Confirming demo account...');
      await supabase.auth.admin.updateUserById(
        demoExists.id,
        { email_confirmed_at: new Date().toISOString() }
      );
      console.log('✅ Demo account confirmed!');
    }
    
    console.log('\n🎯 Demo Login Credentials:');
    console.log('   Email: demo@alwaysbent.com');
    console.log('   Password: demo123456');
    return;
  }
  
  // Create the demo account
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'demo@alwaysbent.com',
    password: 'demo123456',
    email_confirm: true,  // Auto-confirm
    user_metadata: {
      captain_name: 'Demo Captain',
      boat_name: 'Demo Vessel'
    }
  });
  
  if (error) {
    console.error('❌ Error creating demo account:', error);
    return;
  }
  
  console.log('✅ Demo account created successfully!');
  
  // Also create profile record
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      email: 'demo@alwaysbent.com',
      captain_name: 'Demo Captain',
      boat_name: 'Demo Vessel',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  
  if (profileError) {
    console.log('⚠️  Profile creation failed (table might not exist yet):', profileError.message);
  } else {
    console.log('✅ Demo profile created!');
  }
  
  console.log('\n🎯 Demo Login Credentials:');
  console.log('   Email: demo@alwaysbent.com');
  console.log('   Password: demo123456');
  console.log('\n📱 Users can now click "Try It Now" for instant access!');
}

createDemoAccount();
