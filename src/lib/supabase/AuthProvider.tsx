'use client';

import { createContext, useContext } from 'react';

// Simple mock types to prevent crashes
interface Profile {
  captain_name: string;
  boat_name: string;
}

interface AuthContextType {
  user: any;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, captainName: string, boatName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

// Mock context that does nothing - prevents crashes
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: false,
  signIn: async () => ({ error: 'Auth disabled - use simple login at /auth/login' }),
  signUp: async () => ({ error: 'Auth disabled - use simple login at /auth/login' }),
  signOut: async () => {
    // Clear localStorage
    localStorage.removeItem('abfi_captain_name');
    localStorage.removeItem('abfi_boat_name');
    localStorage.removeItem('abfi_user_id');
    localStorage.removeItem('abfi_session_start');
    localStorage.removeItem('abfi_setup_complete');
    window.location.href = '/auth/login';
  },
  updateProfile: async () => {},
});

// Mock provider that just passes through children
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Mock hook that returns empty state
export function useAuth() {
  return {
    user: null,
    profile: null,
    loading: false,
    signIn: async () => ({ error: 'Auth disabled - use simple login at /auth/login' }),
    signUp: async () => ({ error: 'Auth disabled - use simple login at /auth/login' }),
    signOut: async () => {
      localStorage.removeItem('abfi_captain_name');
      localStorage.removeItem('abfi_boat_name');
      localStorage.removeItem('abfi_user_id');
      localStorage.removeItem('abfi_session_start');
      localStorage.removeItem('abfi_setup_complete');
      window.location.href = '/auth/login';
    },
    updateProfile: async () => {},
  };
}