/**
 * REAL Supabase client with anonymous auth
 * No email verification needed!
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hobvjmmambhonsugehge.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYnZqbW1hbWJob25zdWdlaGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjcxMzEsImV4cCI6MjA3MzIwMzEzMX0.20xMzE0nYoDFzfLc4vIMnvprk48226exALM38FhXQqM';

// Create the real client
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Profile type
export interface Profile {
  id: string;
  captain_name: string;
  boat_name: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  is_guest?: boolean;
}

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper to get profile
export const getProfile = async (userId: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data as Profile | null;
};

// Export for backward compatibility
export function createClient() {
  return supabase;
}

export type { Database } from './database.types';