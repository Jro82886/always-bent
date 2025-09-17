'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Anchor } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallbackPath?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  fallbackPath = '/auth/login'
}: AuthGuardProps) {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Simple check: do they have captain & boat names?
    const captainName = localStorage.getItem('abfi_captain_name');
    const boatName = localStorage.getItem('abfi_boat_name');
    
    if (captainName && boatName) {
      setHasSession(true);
      setChecking(false);
    } else if (requireAuth) {
      // No names stored, redirect to login
      setHasSession(false);
      setChecking(false);
      router.push(fallbackPath);
    } else {
      setHasSession(false);
      setChecking(false);
    }
  }, [requireAuth, fallbackPath, router]);

  // Show loading state while checking
  if (hasSession === null && requireAuth) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-cyan-400 animate-pulse">Loading platform...</p>
        </div>
      </div>
    );
  }

  // If auth is required but no session, show message (fallback)
  if (requireAuth && hasSession === false) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <Anchor className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Welcome to ABFI</h2>
          </div>
          <p className="text-gray-400 mb-6">
            Please enter your captain and boat names to access the platform.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Enter Platform
          </button>
        </div>
      </div>
    );
  }

  // Has session or auth not required, show content
  return <>{children}</>;
}
