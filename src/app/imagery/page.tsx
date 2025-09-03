'use client';

import { MapShell } from '@/lib/MapRef';
import NavTabs from '@/components/NavTabs';
import TopHUD from '@/components/TopHUD';
import StatusPill from '@/components/StatusPill';
import RequireUsername from '@/components/RequireUsername';
import LayersRuntime from '@/components/LayersRuntime';

export default function ImageryPage() {
  return (
    <RequireUsername>
    <MapShell>
      {/* Glass overlay */}
      <div className="pointer-events-none absolute inset-0">
        <NavTabs />
        <TopHUD includeAbfi={false} />
        <div className="absolute right-3 bottom-3 pointer-events-none">
          <StatusPill />
        </div>
      </div>

      <LayersRuntime />
    </MapShell>
    </RequireUsername>
  );
}


