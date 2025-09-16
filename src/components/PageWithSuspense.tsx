'use client';

import { Suspense, ReactNode } from 'react';

/**
 * Wrapper component that ensures any page using useSearchParams 
 * (directly or via child components like UnifiedCommandBar) 
 * is properly wrapped in Suspense for Next.js 15 compatibility.
 * 
 * This follows the tree trunk architecture where all mode pages
 * are equal branches and need consistent protection.
 */
interface PageWithSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PageWithSuspense({ 
  children, 
  fallback 
}: PageWithSuspenseProps) {
  return (
    <Suspense 
      fallback={
        fallback || (
          <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
            <div className="text-cyan-400 animate-pulse">Loading mode...</div>
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}
