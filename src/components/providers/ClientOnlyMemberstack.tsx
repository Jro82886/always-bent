'use client';

import { useEffect, useState } from 'react';
import { MemberstackProvider as MSProvider } from '@memberstack/nextjs/client';

const MEMBERSTACK_APP_ID = process.env.NEXT_PUBLIC_MEMBERSTACK_APP_ID || 'app_cmfpavrtq00zb0wws6asv8xf3';

export default function ClientOnlyMemberstack({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR and initial hydration, just render children
  if (!isMounted) {
    return <>{children}</>;
  }

  // Only render Memberstack after client-side mount
  return (
    <MSProvider config={{ publicKey: MEMBERSTACK_APP_ID }}>
      {children}
    </MSProvider>
  );
}
