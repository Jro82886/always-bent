'use client';

import { MapShell } from '@/lib/MapRef';
import NavTabs from '@/components/NavTabs';

export default function TrackingPage() {
  return (
    <div className="w-full h-screen bg-gray-950 relative">
      {/* The Map */}
      <MapShell>
        {/* Navigation Tabs */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <NavTabs />
        </div>
        
        {/* Placeholder for UI Planning */}
        <div className="absolute top-20 left-4 bg-black/80 backdrop-blur-md rounded-lg p-4 text-white max-w-md pointer-events-auto z-20">
          <h2 className="text-xl font-bold mb-2">Tracking Page - Ready for Planning</h2>
          <p className="text-sm text-gray-300">
            Map is loaded. Let&apos;s plan the UI layout before adding features.
          </p>
        </div>
      </MapShell>
    </div>
  );
}