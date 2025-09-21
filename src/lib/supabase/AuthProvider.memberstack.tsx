'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useMemberstack } from '@/lib/memberstack/MemberstackProvider';
import { supabase } from './client';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { member, loading: memberstackLoading, logout } = useMemberstack();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUserData = async () => {
      if (memberstackLoading) return;

      if (member) {
        // Create user object from Memberstack member
        const userData = {
          id: member.id,
          email: member.email,
          captain_name: member.customFields?.captainName || '',
          boat_name: member.customFields?.boatName || '',
          home_port: member.customFields?.homePort || '',
          // Add any other fields as needed
        };

        setUser(userData);

        // Sync with Supabase if needed
        try {
          // Check if profile exists in Supabase
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', member.email)
            .single();

          if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create it
            await supabase.from('profiles').insert({
              id: member.id,
              email: member.email,
              captain_name: member.customFields?.captainName || 'Captain',
              boat_name: member.customFields?.boatName || 'Vessel',
              signup_source: 'memberstack',
            });
          } else if (profile) {
            // Update local user with Supabase data
            setUser({
              ...userData,
              ...profile,
            });
          }
        } catch (error) {
          console.error('Error syncing with Supabase:', error);
        }
      } else {
        // Check for legacy localStorage auth (for migration)
        const captainName = localStorage.getItem('abfi_captain_name');
        const boatName = localStorage.getItem('abfi_boat_name');
        const userId = localStorage.getItem('abfi_user_id');

        if (captainName && boatName && userId && !localStorage.getItem('abfi_migrated')) {
          // Legacy user - prompt to create Memberstack account
          setUser({
            id: userId,
            email: `${userId}@local.abfi`,
            captain_name: captainName,
            boat_name: boatName,
            isLegacy: true,
          });
        } else {
          setUser(null);
        }
      }

      setLoading(false);
    };

    syncUserData();
  }, [member, memberstackLoading]);

  const signOut = async () => {
    setLoading(true);
    await logout();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || memberstackLoading,
        signOut,
        isAuthenticated: !!user && !user.isLegacy,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
