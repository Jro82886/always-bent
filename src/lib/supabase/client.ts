/**
 * Mock Supabase client to prevent crashes
 * Real auth is handled by simple localStorage session
 */

// Mock types
export interface Profile {
  id: string;
  captain_name: string;
  boat_name: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

// Mock Supabase client that returns empty data
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: null, error: new Error('Use simple login at /auth/login') }),
    signUp: async () => ({ data: null, error: new Error('Use simple login at /auth/login') }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } }
    })
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: () => ({
          limit: () => ({
            data: [],
            error: null
          })
        })
      }),
      order: () => ({
        limit: async () => ({ data: [], error: null })
      }),
      data: [],
      error: null
    }),
    insert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null }),
    upsert: async () => ({ data: null, error: null })
  }),
  channel: () => ({
    on: () => ({
      subscribe: () => {}
    })
  }),
  removeChannel: () => {}
};

// Mock functions
export const getCurrentUser = async () => null;
export const getProfile = async (userId: string) => null;

// Mock create client function
export function createClient() {
  return supabase;
}

// Export mock types
export type { Database } from './database.types';