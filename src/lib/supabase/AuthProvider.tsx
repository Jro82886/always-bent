'use client';

import { createContext, useContext } from 'react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Simplified auth context that uses localStorage
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Create a mock user from localStorage
  const captainName = typeof window !== 'undefined' ? localStorage.getItem('abfi_captain_name') : null;
  const boatName = typeof window !== 'undefined' ? localStorage.getItem('abfi_boat_name') : null;
  const userId = typeof window !== 'undefined' ? 
    (localStorage.getItem('abfi_user_id') || `local-${Date.now()}`) : 'local-user';
  
  // Store the user ID if it doesn't exist
  if (typeof window !== 'undefined' && !localStorage.getItem('abfi_user_id')) {
    localStorage.setItem('abfi_user_id', userId);
  }
  
  const mockUser = captainName && boatName ? {
    id: userId,
    email: `${userId}@local.abfi`,
    captain_name: captainName,
    boat_name: boatName
  } : null;

  const signOut = async () => {
    // Clear localStorage
    localStorage.removeItem('abfi_captain_name');
    localStorage.removeItem('abfi_boat_name');
    localStorage.removeItem('abfi_user_id');
    localStorage.removeItem('abfi_session_start');
    
    // Redirect to welcome
    window.location.href = '/legendary?mode=analysis';
  };

  return (
    <AuthContext.Provider value={{ 
      user: mockUser, 
      loading: false, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}