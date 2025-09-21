'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Script from 'next/script';

interface MemberstackMember {
  id: string;
  email: string;
  customFields?: {
    captainName?: string;
    boatName?: string;
    homePort?: string;
  };
  planId?: string;
  status?: string;
}

interface MemberstackContextType {
  member: MemberstackMember | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, customFields?: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (fields: any) => Promise<void>;
  openModal: (type: 'login' | 'signup') => void;
}

const MemberstackContext = createContext<MemberstackContextType>({
  member: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  openModal: () => {},
});

export const useMemberstack = () => useContext(MemberstackContext);

interface MemberstackProviderProps {
  children: React.ReactNode;
  appId: string;
}

export function MemberstackProvider({ children, appId }: MemberstackProviderProps) {
  const [member, setMember] = useState<MemberstackMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Initialize Memberstack when script loads
  useEffect(() => {
    if (!scriptLoaded) return;

    const initializeMemberstack = async () => {
      try {
        // Wait for Memberstack to be available
        const memberstack = (window as any).$memberstackDom;
        
        if (!memberstack) {
          console.error('Memberstack not found on window');
          setLoading(false);
          return;
        }

        // Get current member
        const { data: currentMember } = await memberstack.getCurrentMember();
        
        if (currentMember) {
          // Transform Memberstack member to our format
          const transformedMember: MemberstackMember = {
            id: currentMember.id,
            email: currentMember.email,
            customFields: currentMember.customFields || {},
            planId: currentMember.planId,
            status: currentMember.status,
          };
          
          setMember(transformedMember);
          
          // Sync with localStorage for app compatibility
          if (transformedMember.customFields?.captainName) {
            localStorage.setItem('abfi_captain_name', transformedMember.customFields.captainName);
          }
          if (transformedMember.customFields?.boatName) {
            localStorage.setItem('abfi_boat_name', transformedMember.customFields.boatName);
          }
          localStorage.setItem('abfi_member_id', transformedMember.id);
          localStorage.setItem('abfi_member_email', transformedMember.email);
          localStorage.setItem('abfi_authenticated', 'true');
        } else {
          // Clear auth data
          localStorage.removeItem('abfi_authenticated');
          localStorage.removeItem('abfi_member_id');
          localStorage.removeItem('abfi_member_email');
        }
      } catch (error) {
        console.error('Error initializing Memberstack:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeMemberstack();
  }, [scriptLoaded]);

  const login = async (email: string, password: string) => {
    const memberstack = (window as any).$memberstackDom;
    if (!memberstack) throw new Error('Memberstack not initialized');

    try {
      const { data } = await memberstack.loginMember({ email, password });
      if (data) {
        setMember({
          id: data.id,
          email: data.email,
          customFields: data.customFields || {},
          planId: data.planId,
          status: data.status,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, customFields?: any) => {
    const memberstack = (window as any).$memberstackDom;
    if (!memberstack) throw new Error('Memberstack not initialized');

    try {
      const { data } = await memberstack.signupMember({ 
        email, 
        password,
        customFields: {
          ...customFields,
          signupSource: 'app',
        }
      });
      
      if (data) {
        setMember({
          id: data.id,
          email: data.email,
          customFields: data.customFields || {},
          planId: data.planId,
          status: data.status,
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    const memberstack = (window as any).$memberstackDom;
    if (!memberstack) return;

    try {
      await memberstack.logout();
      setMember(null);
      
      // Clear all localStorage
      localStorage.removeItem('abfi_authenticated');
      localStorage.removeItem('abfi_member_id');
      localStorage.removeItem('abfi_member_email');
      localStorage.removeItem('abfi_captain_name');
      localStorage.removeItem('abfi_boat_name');
      
      // Redirect to landing page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (fields: any) => {
    const memberstack = (window as any).$memberstackDom;
    if (!memberstack || !member) return;

    try {
      const { data } = await memberstack.updateMember({
        customFields: fields
      });
      
      if (data) {
        setMember(prev => ({
          ...prev!,
          customFields: { ...prev?.customFields, ...fields }
        }));
        
        // Update localStorage
        if (fields.captainName) {
          localStorage.setItem('abfi_captain_name', fields.captainName);
        }
        if (fields.boatName) {
          localStorage.setItem('abfi_boat_name', fields.boatName);
        }
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const openModal = (type: 'login' | 'signup') => {
    const memberstack = (window as any).$memberstackDom;
    if (!memberstack) return;

    memberstack.openModal(type);
  };

  return (
    <>
      <Script
        src={`https://api.memberstack.io/static/memberstack.js`}
        data-memberstack-app={appId}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      
      <MemberstackContext.Provider
        value={{
          member,
          loading,
          isAuthenticated: !!member,
          login,
          signup,
          logout,
          updateProfile,
          openModal,
        }}
      >
        {children}
      </MemberstackContext.Provider>
    </>
  );
}
