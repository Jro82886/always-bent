'use client';

import { MemberstackProvider } from '@/lib/memberstack/MemberstackProvider';
import { AuthProvider } from '@/lib/supabase/AuthProvider.memberstack';

export function Providers({ children }: { children: React.ReactNode }) {
  // MemberstackProvider now handles initialization internally with public key
  return (
    <MemberstackProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </MemberstackProvider>
  );
}