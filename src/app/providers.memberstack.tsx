'use client';

import { MemberstackProvider } from '@/lib/memberstack/MemberstackProvider';
import { AuthProvider } from '@/lib/supabase/AuthProvider.memberstack';

// Get Memberstack app ID from environment variable
const MEMBERSTACK_APP_ID = process.env.NEXT_PUBLIC_MEMBERSTACK_APP_ID || '';

export function Providers({ children }: { children: React.ReactNode }) {
  if (!MEMBERSTACK_APP_ID) {
    console.error('NEXT_PUBLIC_MEMBERSTACK_APP_ID is not set');
    // Fallback to existing auth for development
    const { AuthProvider: LegacyAuthProvider } = require('@/lib/supabase/AuthProvider');
    return (
      <LegacyAuthProvider>
        {children}
      </LegacyAuthProvider>
    );
  }

  return (
    <MemberstackProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </MemberstackProvider>
  );
}
