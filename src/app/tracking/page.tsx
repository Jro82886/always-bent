'use client';

import { MapShell } from '@/lib/MapRef';
import NavTabs from '@/components/NavTabs';
import TopHUD from '@/components/TopHUD';

export default function TrackingPage() {
  return (
    <MapShell>
      <NavTabs />
      <TopHUD includeAbfi={false} />
      
      {/* Simple tracking placeholder - no fancy UI */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-cyan-400 text-lg">Vessel Tracking</div>
        <div className="text-slate-500 text-sm mt-2">Select an inlet to begin</div>
      </div>
    </MapShell>
  );
}