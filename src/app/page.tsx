"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Root() {
  const router = useRouter();
  
  useEffect(() => {
    // Always redirect to analysis mode - no more onboarding
    router.push('/legendary?mode=analysis');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-cyan-400 text-xl animate-pulse">Loading ABFI...</div>
    </div>
  );
}
