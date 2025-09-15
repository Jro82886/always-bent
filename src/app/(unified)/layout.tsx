'use client';

import { MapShell } from '@/lib/MapRef';
import NavTabs from '@/components/NavTabs';
import RequireUsername from '@/components/RequireUsername';

export default function UnifiedLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <RequireUsername>
      <div className="w-full h-screen bg-gray-950">
        <MapShell>
          {/* Navigation tabs - shared across all modes */}
          <div className="pointer-events-none absolute inset-0 z-50">
            <NavTabs />
          </div>
          
          {/* Page-specific content (Analysis, Tracking, etc) */}
          {children}
        </MapShell>
      </div>
    </RequireUsername>
  );
}
