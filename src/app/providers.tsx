'use client';

import { AuthProvider } from '@/lib/supabase/AuthProvider';
import ClientOnlyMemberstack from '@/components/providers/ClientOnlyMemberstack';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnlyMemberstack>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ClientOnlyMemberstack>
  );
}
