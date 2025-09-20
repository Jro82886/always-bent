'use client';

import { AuthProvider } from '@/lib/supabase/AuthProvider';
import MemberstackProvider from '@/components/providers/MemberstackProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MemberstackProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </MemberstackProvider>
  );
}
