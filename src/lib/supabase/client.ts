/**
 * Supabase client for database and realtime features
 * Uses cookie-based storage for SSR compatibility
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables. Please check your .env.local file.');
}

// Create browser client with cookie-based storage for SSR
// This allows server-side routes to read the session from cookies
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

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