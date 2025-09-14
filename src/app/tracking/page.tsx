'use client';

import { useEffect, useState } from 'react';
import { MapShell } from '@/lib/MapRef';
import NavTabs from '@/components/NavTabs';

export default function TrackingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('[TRACKING] Page mounted successfully');
  }, []);

  // Show loading state while mounting
  if (!mounted) {
    return (
      <div className="w-full h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading tracking...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-950 relative">
      {/* The Map */}
      <MapShell>
        {/* Navigation Tabs */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <NavTabs />
        </div>
        
        {/* Test Box - Very visible for debugging */}
        <div className="fixed top-20 left-4 bg-red-600 text-white rounded-lg p-6 z-[9999] pointer-events-auto shadow-2xl">
          <h1 className="text-2xl font-bold">TRACKING PAGE IS VISIBLE!</h1>
          <p>If you can see this red box, the page is working.</p>
          <p className="mt-2 text-sm">The dark satellite map should be behind this.</p>
        </div>
      </MapShell>
    </div>
  );
}