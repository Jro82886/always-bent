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
    // Check if user has completed welcome flow
    const setupComplete = localStorage.getItem('abfi_setup_complete');
    const hasInlet = localStorage.getItem('abfi_selected_inlet');
    const hasMode = localStorage.getItem('abfi_app_mode');
    
    // User needs to complete welcome if any of these are missing
    const needsWelcome = !setupComplete || !hasInlet || !hasMode;
    
    if (needsWelcome && requireAuth) {
      // Redirect to welcome flow
      router.push(fallbackPath);
    } else {
      // User has completed welcome or auth not required
      setIsReady(true);
    }
  }, [requireAuth, fallbackPath, router]);

  // Show content once ready
  if (!isReady && requireAuth) {
    return null; // Quick load, no spinner needed
  }

  return <>{children}</>;
}