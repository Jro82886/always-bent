import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Supabase client for authentication and real-time features
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured - auth features disabled');
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'abfi-auth-token',     // Custom storage key
    flowType: 'pkce',                   // Most secure flow
    debug: false,
  },
  global: {
    headers: {
      'x-abfi-version': '1.0.0'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database types
export interface Profile {
  id: string;
  email: string;
  captain_name: string;
  boat_name: string;
  vessel_type?: string;
  home_inlet?: string;
  created_at: string;
  updated_at: string;
}

export interface VesselPosition {
  id: string;
  user_id: string;
  captain_name: string;
  boat_name: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  selected_inlet?: string;
  is_on_water: boolean;
  timestamp: string;
}

export interface OnlinePresence {
  user_id: string;
  captain_name: string;
  boat_name: string;
  status: 'online' | 'away' | 'offline';
  current_inlet?: string;
  last_seen: string;
}

// Helper functions
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  
  return data;
}

// Auth state listener
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}

// Export a helper to create client (for backward compatibility)
export function createClient() {
  return supabase;
}