'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from './client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const PUBLIC_ROUTES = ['/auth/login', '/start', '/'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check active sessions and sets the user
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        // If user exists but no profile, they need to complete setup
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('captain_name, boat_name')
            .eq('id', session.user.id)
            .single();
          
          if (!profile?.captain_name || !profile?.boat_name) {
            // Redirect to login to complete profile
            if (!pathname.includes('/auth/login')) {
              router.push('/auth/login');
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      // Handle navigation based on auth state
      if (!session && !PUBLIC_ROUTES.includes(pathname)) {
        router.push('/auth/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('abfi_captain_name');
      localStorage.removeItem('abfi_boat_name');
      localStorage.removeItem('abfi_user_id');
      localStorage.removeItem('abfi_session_start');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}