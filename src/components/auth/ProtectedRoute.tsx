'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMemberstack } from '@/lib/memberstack/MemberstackProvider';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { member, loading } = useMemberstack();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // If not authenticated, redirect to login with return URL
    if (!member) {
      // Store the current path so we can redirect back after login
      const returnUrl = encodeURIComponent(pathname || '/legendary');
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [member, loading, router, pathname]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-cyan-400 text-lg">Loading...</div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!member) {
    return null;
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
}
