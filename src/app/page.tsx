"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Root() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user has completed welcome flow
    const setupComplete = localStorage.getItem('abfi_setup_complete');
    const hasMode = localStorage.getItem('abfi_app_mode');
    const hasInlet = localStorage.getItem('abfi_selected_inlet');
    
    if (setupComplete && hasMode && hasInlet) {
      // Existing user - go to their saved mode
      const mode = hasMode === 'community' ? 'tracking' : 'analysis';
      router.push(`/legendary?mode=${mode}&inlet=${hasInlet}`);
    } else {
      // New user - show legendary which will redirect to welcome
      router.push('/legendary');
    }
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-cyan-400 text-xl animate-pulse">Loading ABFI...</div>
    </div>
  );
}
