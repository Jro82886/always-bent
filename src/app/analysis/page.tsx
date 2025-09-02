'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type mapboxgl from 'mapbox-gl';
import { MapShell } from '@/lib/MapRef';
import { useMapbox } from '@/lib/MapCtx';
import { useAppState } from '@/store/appState';
import LayersRuntime from '@/components/LayersRuntime';
import TopHUD from '@/components/TopHUD';
import RequireUsername from '@/components/RequireUsername';
import NavTabs from '@/components/NavTabs';
import { DEFAULT_INLET, getInletById } from '@/lib/inlets';
import { flags } from '@/lib/flags';
import SoonToggle from '@/components/SoonToggle';

type Bbox = { minLng: number; minLat: number; maxLng: number; maxLat: number } | null;

function deterministicHotspots(b: NonNullable<Bbox>) {
  const dx = (b.maxLng - b.minLng) / 4;
  const dy = (b.maxLat - b.minLat) / 4;
  return [
    { lng: b.minLng + dx,     lat: b.minLat + dy },
    { lng: b.minLng + 2 * dx, lat: b.minLat + 2 * dy },
    { lng: b.minLng + 3 * dx, lat: b.minLat + 3 * dy },
  ];
}

export default function AnalysisPage() {
  const map = useMapbox();
  const { selectedInletId } = useAppState();
  const activeRaster = useAppState(s => s.activeRaster);
  const isoDate = useAppState(s => s.isoDate);
  const inlet = useMemo(() => getInletById(selectedInletId) ?? DEFAULT_INLET, [selectedInletId]);

  const [snipping, setSnipping] = useState(false);
  const [bbox, setBbox] = useState<Bbox>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeSummary, setAnalyzeSummary] = useState<any>(null);
  const [useChl, setUseChl] = useState(false);
  const [useAltimetry, setUseAltimetry] = useState(false);
  const [useAis, setUseAis] = useState(false);
  const [useReports, setUseReports] = useState(false);
  const [showTomorrow, setShowTomorrow] = useState(false);
  const startPt = useRef<{ x: number; y: number } | null>(null);
  const boxEl = useRef<HTMLDivElement | null>(null);

  // Wire simple drag-to-snip overlay
  useEffect(() => {
    // diagnostics: confirm map readiness
    // @ts-ignore
    console.log('[Map ready?]', typeof window !== 'undefined' && (window as any).map);
  }, []);

  useEffect(() => {
    // diagnostics: bbox changes
    console.log('[bbox]', bbox);
  }, [bbox]);

  // diagnostics: log map mouse events to ensure they reach the canvas
  useEffect(() => {
    if (!map) return;
    const onDown = (e: any) => console.log('DOWN', e.lngLat);
    const onMove = (e: any) => console.log('MOVE', e.lngLat);
    const onUp   = (e: any) => console.log('UP',   e.lngLat);
    map.on('mousedown', onDown);
    map.on('mousemove', onMove);
    map.on('mouseup', onUp);
    return () => {
      map.off('mousedown', onDown);
      map.off('mousemove', onMove);
      map.off('mouseup', onUp);
    };
  }, [map]);

  // Ensure hotspots source/layers exist
  useEffect(() => {
    if (!map) return;
    const addLayers = () => {
      if (!map.getSource('hotspots')) {
        map.addSource('hotspots', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as any } as any);
      }
      if (!map.getLayer('hotspots-fill')) {
        map.addLayer({ id: 'hotspots-fill', type: 'fill', source: 'hotspots', paint: { 'fill-opacity': 0.25, 'fill-color': '#22c55e' } } as any);
      }
      if (!map.getLayer('hotspots-line')) {
        map.addLayer({ id: 'hotspots-line', type: 'line', source: 'hotspots', paint: { 'line-width': 2, 'line-color': '#10b981' } } as any);
      }
    };
    if ((map as any).isStyleLoaded?.()) addLayers();
    else map.once('style.load', addLayers);
  }, [map]);

  // SST temporarily disabled to avoid network calls while endpoints are being sorted

  async function runAnalyze() {
    if (!map || !bbox) return;
    setIsAnalyzing(true);
    try {
      const payload = {
        bbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat],
        time: 'latest',
        layers: ['sst'],
        options: {
          chl: useChl && flags.chl,
          altimetry: useAltimetry && flags.altimetry,
          ais: useAis && flags.ais,
          reports: useReports && flags.reports,
          tomorrow: showTomorrow && flags.tomorrow,
        },
      } as any;
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Analyze failed');
      const src = map.getSource('hotspots') as any;
      if (src?.setData) src.setData(data.hotspots || { type: 'FeatureCollection', features: [] });
      setAnalyzeSummary(data.summary || null);
      setAnalysisOpen(true);
    } catch (err) {
      console.error('Analyze error', err);
      alert('Analyze failed — see console.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  useEffect(() => {
    if (!map) return;
    if (!snipping) return;

    // Temporarily suspend default map interactions while snipping
    const controls: Array<{ enable?: () => void; disable?: () => void } | undefined> = [
      (map as any).dragPan,
      (map as any).scrollZoom,
      (map as any).boxZoom,
      (map as any).dragRotate,
      (map as any).keyboard,
      (map as any).doubleClickZoom,
      (map as any).touchZoomRotate,
    ];
    controls.forEach((c) => c?.disable?.());

    const prevCursor = (map.getCanvas().style.cursor || '');
    map.getCanvas().style.cursor = 'crosshair';

    if (!boxEl.current) {
      boxEl.current = document.createElement('div');
      Object.assign(boxEl.current.style, { position: 'absolute' } as any);
      boxEl.current.style.inset = '0';
      boxEl.current.style.pointerEvents = 'none';
      boxEl.current.style.zIndex = '25';
      document.body.appendChild(boxEl.current);
    }

    const onDown = (e: MouseEvent) => {
      startPt.current = { x: e.clientX, y: e.clientY };
      drawBox(e.clientX, e.clientY, e.clientX, e.clientY);
    };
    const onMove = (e: MouseEvent) => {
      if (!startPt.current) return;
      drawBox(startPt.current.x, startPt.current.y, e.clientX, e.clientY);
    };
    const onUp = (e: MouseEvent) => {
      if (!startPt.current) return;
      const x1 = startPt.current.x, y1 = startPt.current.y;
      const x2 = e.clientX, y2 = e.clientY;
      startPt.current = null;
      drawBox(x1, y1, x2, y2);
      const sw = map.unproject([Math.min(x1, x2), Math.max(y1, y2)]);
      const ne = map.unproject([Math.max(x1, x2), Math.min(y1, y2)]);
      setBbox({ minLng: sw.lng, minLat: sw.lat, maxLng: ne.lng, maxLat: ne.lat });
      setSnipping(false);
    };

    const drawBox = (x1: number, y1: number, x2: number, y2: number) => {
      if (!boxEl.current) return;
      const left = Math.min(x1, x2);
      const top = Math.min(y1, y2);
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);
      boxEl.current.innerHTML = `
        <div style="
          position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;
          border:2px solid rgba(0,221,235,0.95);
          box-shadow: 0 0 18px rgba(0,221,235,0.55), inset 0 0 12px rgba(0,221,235,0.20);
          background: rgba(0,221,235,0.07);
          border-radius: 6px;
        "></div>`;
    };

    map.getCanvas().addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      map.getCanvas().removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      boxEl.current?.remove();
      boxEl.current = null;
      // Restore interactions and cursor
      controls.forEach((c) => c?.enable?.());
      map.getCanvas().style.cursor = prevCursor;
    };
  }, [map, snipping]);

  // Draw hotspots when analysis is open
  useEffect(() => {
    if (!map || !analysisOpen || !bbox) return;
    const points = deterministicHotspots(bbox);
    let el: HTMLDivElement | null = document.createElement('div');
    Object.assign(el.style, { position: 'absolute' } as any);
    el.style.inset = '0';
    (el.style as any).pointerEvents = 'none';
    el.style.zIndex = '24';
    const draw = () => {
      if (!el) return;
      const html = points.map((p) => {
        const { x, y } = map.project([p.lng, p.lat]);
        return `<div style="position:absolute;transform:translate(${x - 5}px,${y - 5}px);width:10px;height:10px;border-radius:9999px;background:#ff3b3b;box-shadow:0 0 12px rgba(0,221,235,.45);"></div>`;
      }).join('');
      el!.innerHTML = html;
      requestAnimationFrame(draw);
    };
    document.body.appendChild(el);
    const id = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(id); el?.remove(); el = null; };
  }, [map, analysisOpen, bbox]);

  return (
    <RequireUsername>
    <MapShell>
      <div className="pointer-events-none absolute inset-0">
        <NavTabs />
        <TopHUD includeAbfi showSoon />
        {/* Bottom-center action bar */}
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-6 z-50 flex flex-col items-center gap-3">
          <button
            className="rounded-full bg-black/55 px-4 py-2 text-sm text-cyan-200 ring-1 ring-cyan-400/40 hover:ring-cyan-300"
            onClick={() => { setSnipping(true); setAnalysisOpen(false); setBbox(null); }}
            title="Snip an area"
          >
            Snip Area
          </button>
          <button
            className={[
              'rounded-full px-5 py-2 text-sm font-medium',
              bbox && !isAnalyzing ? 'bg-emerald-400 text-black shadow-[0_0_24px_rgba(16,185,129,0.45)]' : 'bg-white/20 text-white/80',
              'ring-1 ring-white/15'
            ].join(' ')}
            disabled={!bbox || isAnalyzing}
            onClick={runAnalyze}
            title={bbox ? (isAnalyzing ? 'Analyzing…' : 'Analyze selected area') : 'Snip an area first'}
          >
            {isAnalyzing ? 'Analyzing…' : 'Analyze'}
          </button>

          {/* Coming soon toggles */}
          <div className="grid gap-2 bg-black/60 text-white rounded-md p-3 backdrop-blur w-[min(92vw,420px)]">
            <div>
              <div className="text-xs uppercase opacity-70 mb-1">Environmental</div>
              <div className="flex flex-wrap gap-4 items-center">
                <SoonToggle
                  label="Chlorophyll"
                  enabled={flags.chl}
                  checked={useChl}
                  onChange={(v) => { setUseChl(v); console.log('[toggle] chl ->', v); }}
                  tooltip="Color / edges coming in v2"
                />
                <SoonToggle
                  label="Altimetry / Eddies"
                  enabled={flags.altimetry}
                  checked={useAltimetry}
                  onChange={(v) => { setUseAltimetry(v); console.log('[toggle] altimetry ->', v); }}
                  tooltip="SLA + eddy edges in v2"
                />
              </div>
            </div>

            <div>
              <div className="text-xs uppercase opacity-70 mb-1">Behavioral</div>
              <div className="flex flex-wrap gap-4 items-center">
                <SoonToggle
                  label="AIS Fleet"
                  enabled={flags.ais}
                  checked={useAis}
                  onChange={(v) => { setUseAis(v); console.log('[toggle] ais ->', v); }}
                  tooltip="Fleet density / congregation in v2"
                />
                <SoonToggle
                  label="User Reports"
                  enabled={flags.reports}
                  checked={useReports}
                  onChange={(v) => { setUseReports(v); console.log('[toggle] reports ->', v); }}
                  tooltip="Catches + temp breaks in v2"
                />
              </div>
            </div>

            <div>
              <div className="text-xs uppercase opacity-70 mb-1">Output</div>
              <div className="flex flex-wrap gap-4 items-center">
                <SoonToggle
                  label="Tomorrow (Advection)"
                  enabled={flags.tomorrow}
                  checked={showTomorrow}
                  onChange={(v) => { setShowTomorrow(v); console.log('[toggle] tomorrow ->', v); }}
                  tooltip="Advected fronts + forecast blend in v2"
                />
              </div>
              <div className="mt-2 text-xs opacity-80">
                <span className="inline-block w-2 h-2 align-middle mr-1 bg-white/80"></span> 3 Hot
                <span className="mx-2">|</span>
                <span className="inline-block w-2 h-2 align-middle mr-1 bg-white/60"></span> 2 Warm
                <span className="mx-2">|</span>
                <span className="inline-block w-2 h-2 align-middle mr-1 bg-white/40"></span> 1 Interesting
                <span className="mx-2">|</span>
                <span className="inline-block w-2 h-2 align-middle mr-1 bg-white/20"></span> 0 Cold
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snip overlay: captures drag to define bbox (z-40, above map, below buttons) */}
      {snipping && map && (
        <div
          className="absolute inset-0 z-40 cursor-crosshair pointer-events-auto"
          onMouseDown={(e) => {
            startPt.current = { x: e.clientX, y: e.clientY };
            // initialize the rectangle at 0 size
            const x = e.clientX, y = e.clientY;
            if (!boxEl.current) return;
            const left = x, top = y;
            boxEl.current.innerHTML = `<div style="position:absolute;left:${left}px;top:${top}px;width:0;height:0;border:2px solid rgba(0,221,235,0.95);box-shadow: 0 0 18px rgba(0,221,235,0.55), inset 0 0 12px rgba(0,221,235,0.20);background: rgba(0,221,235,0.07);border-radius: 6px;"></div>`;
          }}
          onMouseMove={(e) => {
            if (!startPt.current) return;
            const x1 = startPt.current.x, y1 = startPt.current.y;
            const x2 = e.clientX, y2 = e.clientY;
            if (!boxEl.current) return;
            const left = Math.min(x1, x2);
            const top = Math.min(y1, y2);
            const width = Math.abs(x2 - x1);
            const height = Math.abs(y2 - y1);
            boxEl.current.innerHTML = `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;border:2px solid rgba(0,221,235,0.95);box-shadow: 0 0 18px rgba(0,221,235,0.55), inset 0 0 12px rgba(0,221,235,0.20);background: rgba(0,221,235,0.07);border-radius: 6px;"></div>`;
          }}
          onMouseUp={(e) => {
            if (!startPt.current || !map) return;
            const x1 = startPt.current.x, y1 = startPt.current.y;
            const x2 = e.clientX, y2 = e.clientY;
            startPt.current = null;
            const sw = map.unproject([Math.min(x1, x2), Math.max(y1, y2)]);
            const ne = map.unproject([Math.max(x1, x2), Math.min(y1, y2)]);
            setBbox({ minLng: sw.lng, minLat: sw.lat, maxLng: ne.lng, maxLat: ne.lat });
            setSnipping(false);
          }}
        />
      )}

      <LayersRuntime />

      {analysisOpen && bbox && (
        <div className="pointer-events-auto absolute right-3 top-3 z-40 w-[360px] max-h-[80vh] overflow-auto rounded-lg bg-black/70 p-3 text-white ring-1 ring-white/10">
          <div className="mb-2 text-sm opacity-80">Analysis Results for {inlet.name}</div>
          <div className="text-sm leading-6">
            {analyzeSummary ? (
              <div>
                <div>Score mean: {analyzeSummary.confidenceMean ?? '—'}</div>
                <div className="opacity-85">{analyzeSummary.notes || 'Results ready.'}</div>
              </div>
            ) : (
              <div className="opacity-80">Results ready.</div>
            )}
            <div className="mt-3 opacity-90">
              Overall: These conditions suggest active feeding zones. Use local knowledge and watch weather/tides to confirm before fishing.
            </div>
          </div>
          <div className="mt-3">
            <button
              className="rounded bg-white/90 px-3 py-1 text-sm text-black"
              onClick={() => { setAnalysisOpen(false); setSnipping(false); }}
            >
              Back to Analysis
            </button>
          </div>
        </div>
      )}
    </MapShell>
    </RequireUsername>
  );
}
