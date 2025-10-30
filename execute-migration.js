const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  console.log('🚀 Running Milestone 1 Migration...\n');

  // Since we can't run raw SQL directly, let's work with the Supabase API
  try {
    // 1. First, let's try to add the demo user to profiles
    console.log('1️⃣ Setting up demo user...');

    const demoUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      // We'll skip email for now since the column might not exist
      // email: 'demo@alwaysbent.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert(demoUser)
      .select();

    if (profileError) {
      console.log('Profile error (expected if email column missing):', profileError.message);
    } else {
      console.log('✅ Demo user created/updated');
    }

    // 2. Create the snips table by attempting to insert
    console.log('\n2️⃣ Testing snips table...');

    // First, try to select from snips to see if it exists
    const { data: snipsCheck, error: snipsCheckError } = await supabase
      .from('snips')
      .select('*')
      .limit(1);

    if (snipsCheckError) {
      console.log('❌ Snips table does not exist');
      console.log('\n⚠️  MANUAL ACTION REQUIRED:');
      console.log('Please copy and run this SQL in Supabase SQL Editor:\n');

      const createSnipsSQL = `
-- Create SNIPS table
CREATE TABLE IF NOT EXISTS public.snips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  inlet_slug TEXT NOT NULL,
  date DATE NOT NULL,
  area_nm2 NUMERIC,
  species TEXT[],
  sst_mean_f NUMERIC,
  sst_p10_f NUMERIC,
  sst_p90_f NUMERIC,
  sst_grad_f NUMERIC,
  chl_mean NUMERIC,
  chl_p10 NUMERIC,
  chl_p90 NUMERIC,
  chl_grad NUMERIC,
  narrative JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS snips_user_date_idx ON public.snips (user_id, date DESC);

-- Disable RLS for testing
ALTER TABLE public.snips DISABLE ROW LEVEL SECURITY;

-- Add email column to profiles if missing
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS captain_name TEXT,
ADD COLUMN IF NOT EXISTS boat_name TEXT,
ADD COLUMN IF NOT EXISTS home_port TEXT,
ADD COLUMN IF NOT EXISTS membership_plan TEXT,
ADD COLUMN IF NOT EXISTS membership_status TEXT;

-- Update demo user
UPDATE public.profiles
SET email = 'demo@alwaysbent.com',
    captain_name = 'Captain Demo',
    boat_name = 'Sea Explorer',
    home_port = 'Ocean City, MD',
    membership_plan = 'premium',
    membership_status = 'active'
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
`;

      console.log(createSnipsSQL);
      console.log('\n📋 COPY THE SQL ABOVE AND RUN IT IN SUPABASE SQL EDITOR');
    } else {
      console.log('✅ Snips table exists!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

executeMigration();