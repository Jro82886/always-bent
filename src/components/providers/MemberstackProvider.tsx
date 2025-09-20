'use client';

import { MemberstackProvider as MSProvider } from '@memberstack/nextjs/client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMemberstack } from '@memberstack/react';

// Your Memberstack app ID
const MEMBERSTACK_APP_ID = process.env.NEXT_PUBLIC_MEMBERSTACK_APP_ID || 'app_cmfpavrtq00zb0wws6asv8xf3';

function AuthSync() {
  // @ts-ignore - Memberstack types are incomplete
  const { member, isLoading } = useMemberstack() as any;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (member) {
        // User is logged in - sync member data
        localStorage.setItem('abfi_authenticated', 'true');
        localStorage.setItem('abfi_member_id', member.id);
        localStorage.setItem('abfi_member_email', member.auth.email || '');
        
        // Set captain/boat info if available
        if (member.customFields?.captainName) {
          localStorage.setItem('abfi_captain_name', member.customFields.captainName);
        }
        if (member.customFields?.boatName) {
          localStorage.setItem('abfi_boat_name', member.customFields.boatName);
        }
        if (member.customFields?.homePort) {
          localStorage.setItem('abfi_home_port', member.customFields.homePort);
        }
        
        // Set the onboarded cookie
        document.cookie = 'abfi_onboarded=1; path=/; max-age=2592000'; // 30 days
      } else {
        // User is not logged in
        localStorage.removeItem('abfi_authenticated');
        localStorage.removeItem('abfi_member_id');
        localStorage.removeItem('abfi_member_email');
        
        // Check if we're on a protected route
        if (pathname.startsWith('/legendary') && !pathname.includes('/welcome')) {
          // Redirect to login
          router.push('/auth/login');
        }
      }
    }
  }, [member, isLoading, router, pathname]);

  return null;
}

export default function MemberstackProvider({ children }: { children: React.ReactNode }) {
  return (
    <MSProvider config={{ publicKey: MEMBERSTACK_APP_ID }}>
      <AuthSync />
      {children}
    </MSProvider>
  );
}
