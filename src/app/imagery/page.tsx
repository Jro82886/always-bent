'use client';

import { MapShell } from '@/lib/MapRef';
import HeaderBar from '@/components/HeaderBar';
import Layers from '@/components/Layers';
import LayersRuntime from '@/components/LayersRuntime';
import LayerToggles from '@/components/LayerToggles';
import StatusPill from '@/components/StatusPill';

export default function ImageryPage() {
  return (
    <MapShell>
      <div className="pointer-events-auto absolute left-3 top-3 z-40 flex gap-2 flex-wrap bg-black/40 text-white px-2 py-1 rounded">
        <HeaderBar />
        <LayerToggles />
      </div>

      <StatusPill />

      <LayersRuntime />
      <Layers />
    </MapShell>
  );
}


