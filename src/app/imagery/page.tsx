'use client';

import { MapShell } from '@/lib/MapRef';
import NavTabsWrapper from '@/components/NavTabsWrapper';
import TopHUD from '@/components/TopHUD';
import StatusPill from '@/components/StatusPill';
import RequireUsername from '@/components/RequireUsername';
import LayersRuntime from '@/components/LayersRuntime';
import AnalyzeBar from '@/components/AnalyzeBar';

export default function ImageryPage() {
  return (
    <RequireUsername>
    <div className="w-full h-screen bg-gray-950">
    <MapShell>
      {/* Glass overlay */}
      <div className="pointer-events-none absolute inset-0">
        <NavTabsWrapper />
        <TopHUD includeAbfi={false} />
        <div className="absolute right-3 bottom-3 pointer-events-none">
          <StatusPill />
        </div>
      </div>

      <LayersRuntime />
      <AnalyzeBar />
    </MapShell>
    </div>
    </RequireUsername>
  );
}


