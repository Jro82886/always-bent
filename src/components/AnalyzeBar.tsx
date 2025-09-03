'use client';
import { useCallback, useState } from 'react';
import SnipController, { BBox } from '@/components/SnipController';
import { useAppState } from '@/store/appState';
import { DEFAULT_INLET, getInletById } from '@/lib/inlets';

function fitToBBox(map: any, bbox: BBox) {
  try {
    const [[minLng, minLat, maxLng, maxLat]]: any = [];
    // @ts-ignore
    map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 60, duration: 900, essential: true });
  } catch {}
}

function ensureHotspotSource(map: any) {
  try {
    if (!map.getSource('hotspots')) {
      map.addSource('hotspots', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    }
  } catch {}
}

function drawHotspots(map: any, featureCollection: any) {
  ensureHotspotSource(map);
  const src: any = map.getSource('hotspots');
  if (src?.setData) src.setData(featureCollection || { type: 'FeatureCollection', features: [] });
}

export default function AnalyzeBar() {
  const { selectedInletId } = useAppState();
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [snipping, setSnipping] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSnipDone = useCallback((b: BBox) => {
    setBbox(b);
    setSnipping(false);
    const map: any = (globalThis as any).abfiMap;
    if (map) fitToBBox(map, b);
  }, []);

  async function analyze() {
    if (!bbox) return;
    setBusy(true);
    try {
      const map: any = (globalThis as any).abfiMap;
      if (map) fitToBBox(map, bbox);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bbox }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Analyze failed');
      const map: any = (globalThis as any).abfiMap;
      if (map) {
        drawHotspots(map, data.hotspots);
      }
    } catch (e) {
      console.error(e);
      alert('Analyze failed. See console.');
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    const map: any = (globalThis as any).abfiMap;
    const inlet = getInletById(selectedInletId) ?? DEFAULT_INLET;
    setBbox(null);
    if (map) {
      try {
        const src: any = map.getSource('hotspots');
        src?.setData?.({ type: 'FeatureCollection', features: [] });
        map.flyTo({ center: inlet.center, zoom: inlet.zoom, essential: true });
      } catch {}
    }
  }

  return (
    <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-6 z-50 flex flex-col items-center gap-3">
      {snipping && <SnipController onDone={onSnipDone} />}
      <div className="flex items-center gap-2">
        <button
          className="rounded-full bg-black/55 px-4 py-2 text-sm text-cyan-200 ring-1 ring-cyan-400/40 hover:ring-cyan-300"
          onClick={() => { setSnipping(true); }}
          title="Snip an area"
        >
          Snip Area
        </button>
        <button
          className={[
            'rounded-full px-5 py-2 text-sm font-medium',
            bbox && !busy ? 'bg-emerald-400 text-black shadow-[0_0_24px_rgba(16,185,129,0.45)] animate-pulse' : 'bg-white/20 text-white/80',
            'ring-1 ring-white/15'
          ].join(' ')}
          disabled={!bbox || busy}
          onClick={analyze}
          title={bbox ? (busy ? 'Analyzing…' : 'Analyze selected area') : 'Snip an area first'}
        >
          {busy ? 'Analyzing…' : 'Analyze'}
        </button>
        <button
          className="rounded-full bg-white/90 px-3 py-2 text-sm text-black ring-1 ring-white/15"
          onClick={reset}
          title="Back to inlet"
        >
          Back to Inlet
        </button>
      </div>
    </div>
  );
}


