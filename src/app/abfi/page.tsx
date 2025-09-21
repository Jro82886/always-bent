'use client';

import { useEffect } from 'react';

export default function ABFIPage() {
  useEffect(() => {
    // Set everything needed for full access
    document.cookie = 'abfi_onboarded=1; path=/; max-age=2592000';
    localStorage.setItem('abfi_authenticated', 'true');
    localStorage.setItem('abfi_captain_name', 'Captain');
    localStorage.setItem('abfi_boat_name', 'Vessel');
    localStorage.setItem('abfi_selected_inlet', 'md-ocean-city');
    localStorage.setItem('abfi_app_mode', 'solo');
    
    // Go straight to analysis
    window.location.href = '/legendary/analysis';
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-cyan-400 animate-pulse text-xl">Loading ABFI...</div>
    </div>
  );
}
