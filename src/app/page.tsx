"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Root() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user has already set up their boat
    const boatName = localStorage.getItem('abfi_boat_name');
    
    if (boatName) {
      // Existing user - go to main app
      router.push('/legendary');
    } else {
      // New user - show welcome screen
      router.push('/legendary?mode=welcome');
    }
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-cyan-400 text-xl animate-pulse">Loading ABFI...</div>
    </div>
  );
}
