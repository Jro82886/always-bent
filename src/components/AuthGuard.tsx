'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallbackPath?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  fallbackPath = '/legendary/welcome'
}: AuthGuardProps) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simple check: do they have captain & boat names?
    const captainName = localStorage.getItem('abfi_captain_name');
    const boatName = localStorage.getItem('abfi_boat_name');
    
    if (!captainName || !boatName) {
      if (requireAuth) {
        // No names stored, redirect to welcome
        router.push(fallbackPath);
      } else {
        setIsReady(true);
      }
    } else {
      // Has names, allow access
      setIsReady(true);
    }
  }, [requireAuth, fallbackPath, router]);

  // Show content once ready
  if (!isReady && requireAuth) {
    return null; // Quick load, no spinner needed
  }

  return <>{children}</>;
}