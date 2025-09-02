'use client';

import { useEffect } from "react";
import { useMapbox } from "@/lib/MapCtx";
import { useAppState } from "@/store/appState";

export default function LayerToggles({ includeAbfi = true }: { includeAbfi?: boolean }) {
  const map = useMapbox();
  const { activeRaster, setActiveRaster } = useAppState();

  useEffect(() => {
    if (!map) return;
    // runtime handled by LayersRuntime; this UI just sets state
  }, [map, activeRaster]);

  return (
    <div className="rounded bg-black/60 text-white px-2 py-1 shadow backdrop-blur">
      <div className="flex items-center gap-2">
        {([
          { id: 'sst', label: 'Sea Surface Temp' },
          { id: 'chl', label: 'Chlorophyll' },
          ...(includeAbfi ? ([{ id: 'abfi', label: 'ABFI' }] as const) : ([] as const)),
        ] as const).map(r => {
          const active = activeRaster === r.id;
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={active}
              onClick={() => setActiveRaster(active ? null : r.id)}
              className={[
                'rounded px-3 py-1 text-sm font-medium transition',
                'ring-1 ring-white/10 hover:ring-cyan-300/50',
                active
                  ? 'bg-cyan-400 text-black shadow-[0_0_24px_rgba(0,221,235,0.35)]'
                  : 'bg-black/60 text-white hover:bg-black/50',
              ].join(' ')}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}




