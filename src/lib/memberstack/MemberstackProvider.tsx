'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';

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
  planConnections?: Array<{
    planId: string;
    status: string;
    payment?: {
      priceId: string;
    };
  }>;
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
  hasActivePlan: (priceId: string) => boolean;
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
  hasActivePlan: () => false,
});

export const useMemberstack = () => useContext(MemberstackContext);

export function MemberstackProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<MemberstackMember | null>(null);
  const [loading, setLoading] = useState(true);
  const msRef = useRef<any>(null);

  useEffect(() => {
    // Only initialize on the client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const initMemberstack = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const memberstack = (await import('@memberstack/dom')).default;

        // Initialize Memberstack with your production public key
        const ms = memberstack.init({
          publicKey: process.env.NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY || 'pk_4d0f62c2cdfa07ade449',
        });

        msRef.current = ms;

        // Get current member from Memberstack
        const { data: currentMember } = await ms.getCurrentMember();

        if (currentMember) {
          // Transform to our member format
          const transformedMember: MemberstackMember = {
            id: currentMember.id,
            email: currentMember.auth?.email || currentMember.email,
            customFields: currentMember.customFields || {},
            planId: currentMember.planConnections?.[0]?.planId,
            status: currentMember.planConnections?.[0]?.status,
            planConnections: currentMember.planConnections,
          };

          setMember(transformedMember);

          // Sync with localStorage for app compatibility
          if (transformedMember.customFields?.captainName) {
            localStorage.setItem('abfi_captain_name', transformedMember.customFields.captainName);
          }
          if (transformedMember.customFields?.boatName) {
            localStorage.setItem('abfi_boat_name', transformedMember.customFields.boatName);
          }
          if (transformedMember.customFields?.homePort) {
            localStorage.setItem('abfi_home_port', transformedMember.customFields.homePort);
          }
          localStorage.setItem('abfi_member_id', transformedMember.id);
          localStorage.setItem('abfi_member_email', transformedMember.email);
          localStorage.setItem('abfi_authenticated', 'true');
        } else {
          // Clear auth data
          setMember(null);
          localStorage.removeItem('abfi_authenticated');
          localStorage.removeItem('abfi_member_id');
          localStorage.removeItem('abfi_member_email');
          localStorage.removeItem('abfi_captain_name');
          localStorage.removeItem('abfi_boat_name');
          localStorage.removeItem('abfi_home_port');
        }

        // Listen for auth changes
        const unsubscribe = ms.onAuthChange((updatedMember: any) => {
          console.log('Memberstack auth changed:', updatedMember);

          if (updatedMember) {
            const transformedMember: MemberstackMember = {
              id: updatedMember.id,
              email: updatedMember.auth?.email || updatedMember.email,
              customFields: updatedMember.customFields || {},
              planId: updatedMember.planConnections?.[0]?.planId,
              status: updatedMember.planConnections?.[0]?.status,
              planConnections: updatedMember.planConnections,
            };
            setMember(transformedMember);

            // Sync with localStorage
            if (transformedMember.customFields?.captainName) {
              localStorage.setItem('abfi_captain_name', transformedMember.customFields.captainName);
            }
            if (transformedMember.customFields?.boatName) {
              localStorage.setItem('abfi_boat_name', transformedMember.customFields.boatName);
            }
            if (transformedMember.customFields?.homePort) {
              localStorage.setItem('abfi_home_port', transformedMember.customFields.homePort);
            }
            localStorage.setItem('abfi_member_id', transformedMember.id);
            localStorage.setItem('abfi_member_email', transformedMember.email);
            localStorage.setItem('abfi_authenticated', 'true');
          } else {
            setMember(null);
            // Clear localStorage
            localStorage.removeItem('abfi_authenticated');
            localStorage.removeItem('abfi_member_id');
            localStorage.removeItem('abfi_member_email');
            localStorage.removeItem('abfi_captain_name');
            localStorage.removeItem('abfi_boat_name');
            localStorage.removeItem('abfi_home_port');
          }
        });

        // Store unsubscribe for cleanup
        return () => {
          unsubscribe.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing Memberstack:', error);
        setMember(null);
      } finally {
        setLoading(false);
      }
    };

    initMemberstack();
  }, []);

  const login = async (email: string, password: string) => {
    if (!msRef.current) {
      throw new Error('Memberstack not initialized');
    }

    try {
      const { data } = await msRef.current.loginMemberEmailPassword({ email, password });
      if (data?.member) {
        const transformedMember: MemberstackMember = {
          id: data.member.id,
          email: data.member.auth?.email || data.member.email,
          customFields: data.member.customFields || {},
          planId: data.member.planConnections?.[0]?.planId,
          status: data.member.planConnections?.[0]?.status,
          planConnections: data.member.planConnections,
        };
        setMember(transformedMember);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  };

  const signup = async (email: string, password: string, customFields?: any) => {
    if (!msRef.current) {
      throw new Error('Memberstack not initialized');
    }

    try {
      const signupData: any = {
        email,
        password,
        customFields: {
          ...customFields,
          signupSource: 'app',
        }
      };

      const { data } = await msRef.current.signupMemberEmailPassword(signupData);

      if (data?.member) {
        const transformedMember: MemberstackMember = {
          id: data.member.id,
          email: data.member.auth?.email || data.member.email,
          customFields: data.member.customFields || {},
          planId: data.member.planConnections?.[0]?.planId,
          status: data.member.planConnections?.[0]?.status,
          planConnections: data.member.planConnections,
        };
        setMember(transformedMember);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed. Please try again.');
    }
  };

  const logout = async () => {
    if (!msRef.current) {
      throw new Error('Memberstack not initialized');
    }

    try {
      await msRef.current.logout();
      setMember(null);

      // Clear all localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('abfi_authenticated');
        localStorage.removeItem('abfi_member_id');
        localStorage.removeItem('abfi_member_email');
        localStorage.removeItem('abfi_captain_name');
        localStorage.removeItem('abfi_boat_name');
        localStorage.removeItem('abfi_home_port');

        // Redirect to landing page
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Logout failed.');
    }
  };

  const updateProfile = async (fields: any) => {
    if (!msRef.current || !member) {
      throw new Error('Memberstack not initialized or no member logged in');
    }

    try {
      await msRef.current.updateMember({
        customFields: fields
      });

      // Update local state
      setMember(prev => ({
        ...prev!,
        customFields: { ...prev?.customFields, ...fields }
      }));

      // Update localStorage
      if (typeof window !== 'undefined') {
        if (fields.captainName) {
          localStorage.setItem('abfi_captain_name', fields.captainName);
        }
        if (fields.boatName) {
          localStorage.setItem('abfi_boat_name', fields.boatName);
        }
        if (fields.homePort) {
          localStorage.setItem('abfi_home_port', fields.homePort);
        }
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile.');
    }
  };

  const openModal = (type: 'login' | 'signup') => {
    console.log('Opening Memberstack modal:', type);
    // Note: With @memberstack/dom package, modals are handled differently
    // You might need to implement custom modals or use Memberstack's UI components
    if (typeof window !== 'undefined') {
      if (type === 'login') {
        // Redirect to login page or open custom modal
        window.location.href = '/login';
      } else {
        // Redirect to signup page or open custom modal
        window.location.href = '/signup';
      }
    }
  };

  const hasActivePlan = (priceId: string): boolean => {
    if (!member?.planConnections) return false;
    return member.planConnections.some(
      (plan) => plan.payment?.priceId === priceId && plan.status === 'ACTIVE'
    );
  };

  return (
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
        hasActivePlan,
      }}
    >
      {children}
    </MemberstackContext.Provider>
  );
}