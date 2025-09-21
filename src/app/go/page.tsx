'use client';

import { useEffect } from 'react';

export default function GoPage() {
  useEffect(() => {
    // Set the onboarded cookie
    document.cookie = 'abfi_onboarded=1; path=/; max-age=2592000';
    
    // Set demo data
    if (typeof window !== 'undefined') {
      localStorage.setItem('abfi_authenticated', 'true');
      localStorage.setItem('abfi_captain_name', 'Captain Demo');
      localStorage.setItem('abfi_boat_name', 'Demo Vessel');
      localStorage.setItem('abfi_username', 'DemoUser');
      
      // Force redirect to welcome page first
      window.location.href = '/legendary/welcome';
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-cyan-400 text-xl animate-pulse">Loading Always Bent...</div>
    </div>
  );
}
