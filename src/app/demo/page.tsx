'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    // Set demo user data
    localStorage.setItem('abfi_authenticated', 'true');
    localStorage.setItem('abfi_captain_name', 'Demo Captain');
    localStorage.setItem('abfi_boat_name', 'Demo Vessel');
    localStorage.setItem('abfi_home_port', 'Ocean City, MD');
    
    // Set onboarded cookie
    document.cookie = 'abfi_onboarded=1; path=/; max-age=2592000';
    
    // Redirect to app
    router.push('/legendary');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
      <div className="text-cyan-400 animate-pulse">Setting up demo access...</div>
    </div>
  );
}
