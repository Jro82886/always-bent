/**
 * Supabase client for database and realtime features
 * Auth disabled - using localStorage for user identification
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hobvjmmambhonsugehge.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYnZqbW1hbWJob25zdWdlaGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjcxMzEsImV4cCI6MjA3MzIwMzEzMX0.20xMzE0nYoDFzfLc4vIMnvprk48226exALM38FhXQqM';

// Create client without auth
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
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

// Helper to get current user from localStorage
export const getCurrentUser = async () => {
  if (typeof window === 'undefined') return null;
  
  const userId = localStorage.getItem('abfi_user_id');
  const captainName = localStorage.getItem('abfi_captain_name');
  const boatName = localStorage.getItem('abfi_boat_name');
  
  if (!userId || !captainName || !boatName) return null;
  
  return {
    id: userId,
    email: `${userId}@local.abfi`,
    user_metadata: {
      captain_name: captainName,
      boat_name: boatName
    }
  };
};

// Helper to get profile from localStorage
export const getProfile = async (userId: string) => {
  if (typeof window === 'undefined') return null;
  
  const captainName = localStorage.getItem('abfi_captain_name');
  const boatName = localStorage.getItem('abfi_boat_name');
  
  if (!captainName || !boatName) return null;
  
  return {
    id: userId,
    captain_name: captainName,
    boat_name: boatName,
    email: `${userId}@local.abfi`,
    is_guest: true
  } as Profile;
};

// Export for backward compatibility
export function getSupabase() {
  return supabase;
}

export type { Database } from './database.types';