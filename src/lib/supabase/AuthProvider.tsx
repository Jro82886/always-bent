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
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
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
        
        // Sync with localStorage for backward compatibility
        if (profile) {
          localStorage.setItem('abfi_captain_name', profile.captain_name);
          localStorage.setItem('abfi_boat_name', profile.boat_name);
          localStorage.setItem('abfi_user_id', profile.id);
        }
      } else {
        setProfile(null);
        // Clear localStorage on signout
        localStorage.removeItem('abfi_captain_name');
        localStorage.removeItem('abfi_boat_name');
        localStorage.removeItem('abfi_user_id');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      const profile = await getProfile(data.user.id);
      setProfile(profile);
    }

    return { error };
  };

  const signUp = async (email: string, password: string, captainName: string, boatName: string) => {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          captain_name: captainName,
          boat_name: boatName,
        }
      }
    });

    if (authError || !authData.user) {
      return { error: authError };
    }

    // Then create the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        captain_name: captainName,
        boat_name: boatName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    return { error: authError };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
      // Update localStorage
      if (data.captain_name) localStorage.setItem('abfi_captain_name', data.captain_name);
      if (data.boat_name) localStorage.setItem('abfi_boat_name', data.boat_name);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
