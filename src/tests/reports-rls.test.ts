/**
 * RLS (Row Level Security) Tests for Reports Table
 * Ensures users can only access their own reports
 */

import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Test users (these should exist in your test environment)
const USER_A_EMAIL = 'test-user-a@example.com';
const USER_A_PASSWORD = 'test-password-a';
const USER_B_EMAIL = 'test-user-b@example.com';
const USER_B_PASSWORD = 'test-password-b';

describe('Reports RLS Tests', () => {
  let supabaseA: any;
  let supabaseB: any;
  let userA: any;
  let userB: any;
  let reportA: any;

  beforeAll(async () => {
    // Create clients for each user
    supabaseA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabaseB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Sign in as User A
    const { data: authA, error: authErrorA } = await supabaseA.auth.signInWithPassword({
      email: USER_A_EMAIL,
      password: USER_A_PASSWORD,
    });
    if (authErrorA) throw authErrorA;
    userA = authA.user;

    // Sign in as User B
    const { data: authB, error: authErrorB } = await supabaseB.auth.signInWithPassword({
      email: USER_B_EMAIL,
      password: USER_B_PASSWORD,
    });
    if (authErrorB) throw authErrorB;
    userB = authB.user;
  });

  afterAll(async () => {
    // Clean up test data
    if (reportA) {
      await supabaseA.from('reports').delete().eq('id', reportA.id);
    }
    
    // Sign out
    await supabaseA.auth.signOut();
    await supabaseB.auth.signOut();
  });

  test('User can create their own report', async () => {
    const reportData = {
      inlet_id: 'test-inlet',
      type: 'snip',
      status: 'complete',
      source: 'online',
      payload_json: {
        kind: 'snip',
        layers_on: ['sst'],
        stats: { sst_mean: 24.5 },
        narrative: 'Test report',
        effective_date: '2024-03-22',
      },
      meta: { test: true },
    };

    const { data, error } = await supabaseA
      .from('reports')
      .insert(reportData)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.user_id).toBe(userA.id);
    expect(data.type).toBe('snip');
    
    reportA = data;
  });

  test('User can read their own reports', async () => {
    const { data, error } = await supabaseA
      .from('reports')
      .select('*')
      .eq('id', reportA.id)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.id).toBe(reportA.id);
  });

  test('User cannot read other users reports', async () => {
    const { data, error } = await supabaseB
      .from('reports')
      .select('*')
      .eq('id', reportA.id)
      .single();

    // Should return no data due to RLS
    expect(data).toBeNull();
    expect(error?.code).toBe('PGRST116'); // No rows found
  });

  test('User can update their own reports', async () => {
    const { data, error } = await supabaseA
      .from('reports')
      .update({ status: 'failed' })
      .eq('id', reportA.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.status).toBe('failed');
  });

  test('User cannot update other users reports', async () => {
    const { error } = await supabaseB
      .from('reports')
      .update({ status: 'failed' })
      .eq('id', reportA.id);

    // Update should fail silently (no rows affected)
    expect(error).toBeNull();

    // Verify the report wasn't actually updated
    const { data } = await supabaseA
      .from('reports')
      .select('status')
      .eq('id', reportA.id)
      .single();
    
    expect(data.status).toBe('failed'); // Should still be 'failed' from previous test
  });

  test('User cannot insert report for another user', async () => {
    const reportData = {
      user_id: userA.id, // Trying to create report for User A
      inlet_id: 'test-inlet',
      type: 'bite',
      payload_json: { kind: 'bite' },
    };

    const { error } = await supabaseB
      .from('reports')
      .insert(reportData);

    // Should fail due to RLS policy
    expect(error).toBeDefined();
    expect(error.message).toContain('new row violates row-level security policy');
  });
});

// Run test with: npm test src/tests/reports-rls.test.ts
