'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentUser, getProfile, type Profile } from './client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, captainName: string, boatName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: false,
  signIn: async () => ({ error: 'Use simple login at /auth/login' }),
  signUp: async () => ({ error: 'Use simple login at /auth/login' }),
  signOut: async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/auth/login';
  },
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    getCurrentUser().then(async (user) => {
      if (user) {
        setUser(user);
        const profile = await getProfile(user.id);
        setProfile(profile);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        const profile = await getProfile(currentUser.id);
        setProfile(profile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    loading,
    signIn: async () => ({ error: 'Use simple login at /auth/login' }),
    signUp: async () => ({ error: 'Use simple login at /auth/login' }),
    signOut: async () => {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = '/auth/login';
    },
    updateProfile: async (updates: Partial<Profile>) => {
      if (!user) return;
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (!error && profile) {
        setProfile({ ...profile, ...updates });
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}