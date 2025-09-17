#!/usr/bin/env node

/**
 * Quick fix for Supabase auth issues
 * This script will help manually confirm users or check their status
 */

const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://hobvjmmambhonsugehge.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYnZqbW1hbWJob25zdWdlaGdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYyNzEzMSwiZXhwIjoyMDczMjAzMTMxfQ.5BMjXQ0kev81tbU6CVVX7cjvZeA49tbqKKZZ2F2wgbg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error);
    return;
  }
  
  console.log('\n📋 Current Users in Database:\n');
  users.forEach((user, index) => {
    console.log(`${index + 1}. Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Confirmed: ${user.email_confirmed_at ? '✅ YES' : '❌ NO'}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log('   ---');
  });
  
  return users;
}

async function confirmUser(email) {
  // First find the user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error finding user:', listError);
    return;
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error(`❌ User with email ${email} not found`);
    return;
  }
  
  // Update user to confirm email
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { email_confirmed_at: new Date().toISOString() }
  );
  
  if (error) {
    console.error('Error confirming user:', error);
    return;
  }
  
  console.log(`✅ Successfully confirmed email for ${email}`);
  console.log('You can now log in with this account!');
}

async function deleteUser(email) {
  // First find the user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error finding user:', listError);
    return;
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error(`❌ User with email ${email} not found`);
    return;
  }
  
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  
  if (error) {
    console.error('Error deleting user:', error);
    return;
  }
  
  console.log(`✅ Successfully deleted user ${email}`);
}

// Parse command line arguments
const command = process.argv[2];
const email = process.argv[3];

console.log('🔧 ABFI Auth Fix Tool\n');

switch(command) {
  case 'list':
    listUsers();
    break;
    
  case 'confirm':
    if (!email) {
      console.error('❌ Please provide an email: node fix-auth.js confirm your@email.com');
      process.exit(1);
    }
    confirmUser(email);
    break;
    
  case 'delete':
    if (!email) {
      console.error('❌ Please provide an email: node fix-auth.js delete your@email.com');
      process.exit(1);
    }
    deleteUser(email);
    break;
    
  default:
    console.log('Usage:');
    console.log('  node scripts/fix-auth.js list              - List all users');
    console.log('  node scripts/fix-auth.js confirm <email>   - Manually confirm a user');
    console.log('  node scripts/fix-auth.js delete <email>    - Delete a user');
    console.log('\nExample:');
    console.log('  node scripts/fix-auth.js confirm hiamandak@gmail.com');
}
