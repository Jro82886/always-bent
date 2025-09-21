'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberstack } from '@/lib/memberstack/MemberstackProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireProfile?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/',
  requireProfile = true 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { member, loading, isAuthenticated } = useMemberstack();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      // Not authenticated - redirect to landing page
      router.replace(redirectTo);
      return;
    }

    if (requireProfile && member) {
      // Check if profile is complete
      const { captainName, boatName } = member.customFields || {};
      
      if (!captainName || !boatName) {
        // Profile incomplete - redirect to welcome
        router.replace('/legendary/welcome');
      }
    }
  }, [isAuthenticated, loading, member, requireProfile, redirectTo, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated - render children
  return <>{children}</>;
}
