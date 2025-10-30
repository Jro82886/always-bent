const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('\n🔍 MILESTONE 1 DATABASE VERIFICATION\n');
  console.log('=====================================\n');

  let allGood = true;

  // 1. Check profiles table and demo user
  console.log('1️⃣  Checking profiles table...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'demo@alwaysbent.com');

  if (profileError) {
    console.log('   ❌ ERROR:', profileError.message);
    allGood = false;
  } else if (profiles && profiles.length > 0) {
    console.log('   ✅ Demo user exists!');
    console.log('   - Email:', profiles[0].email);
    console.log('   - Captain:', profiles[0].captain_name);
    console.log('   - Boat:', profiles[0].boat_name);
  } else {
    console.log('   ⚠️  Demo user not found');
    allGood = false;
  }

  // 2. Check snips table
  console.log('\n2️⃣  Checking snips table...');
  const { data: snips, count, error: snipsError } = await supabase
    .from('snips')
    .select('*', { count: 'exact' });

  if (snipsError) {
    console.log('   ❌ ERROR:', snipsError.message);
    allGood = false;
  } else {
    console.log('   ✅ Snips table exists!');
    console.log('   - Total saved analyses:', count || 0);
    if (snips && snips.length > 0) {
      console.log('   - Latest analysis date:', snips[0].date);
      console.log('   - SST Mean:', snips[0].sst_mean_f + '°F');
    }
  }

  // 3. Test insert capability
  console.log('\n3️⃣  Testing save capability...');
  const testSnip = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    inlet_slug: 'test-inlet',
    date: '2025-01-22',
    sst_mean_f: 50.0,
    narrative: { test: true }
  };

  const { error: insertError } = await supabase
    .from('snips')
    .insert(testSnip);

  if (insertError) {
    console.log('   ❌ Cannot save:', insertError.message);
    allGood = false;
  } else {
    console.log('   ✅ Save capability working!');

    // Clean up test
    await supabase
      .from('snips')
      .delete()
      .eq('inlet_slug', 'test-inlet');
  }

  // Final verdict
  console.log('\n=====================================\n');
  if (allGood) {
    console.log('🎉 DATABASE READY FOR MILESTONE 1 DEMO!\n');
    console.log('✅ All systems operational');
    console.log('✅ Demo user configured');
    console.log('✅ Save functionality working');
  } else {
    console.log('⚠️  Some issues detected - please run the migration:\n');
    console.log('1. Go to: https://app.supabase.com/project/hobvjmmambhonsugehge/sql');
    console.log('2. Run: FINAL_WORKING_MIGRATION.sql');
  }

  console.log('\n');
}

verifyDatabase().catch(console.error);