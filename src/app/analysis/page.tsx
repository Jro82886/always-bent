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
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [useChl, setUseChl] = useState(false);
  const [useAltimetry, setUseAltimetry] = useState(false);
  const [useAis, setUseAis] = useState(false);
  const [useReports, setUseReports] = useState(false);
  const [showTomorrow, setShowTomorrow] = useState(false);
  const startPt = useRef<{ x: number; y: number } | null>(null);
  const boxEl = useRef<HTMLDivElement | null>(null);
  const metricsEl = useRef<HTMLDivElement | null>(null);

  function kmBetween(a: { lng: number; lat: number }, b: { lng: number; lat: number }) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s1 = Math.sin(dLat / 2) ** 2;
    const s2 = Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - (s1 + s2)));
    return R * c;
  }

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

  // Keyboard shortcuts: Enter = Analyze (when bbox set), Esc = cancel/close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && bbox && !isAnalyzing) {
        e.preventDefault();
        runAnalyze();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSnipping(false);
        setAnalysisOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bbox, isAnalyzing]);

  // Ensure hotspots source/layers exist (points with sleek glow + ranking color)
  useEffect(() => {
    if (!map) return;
    const addLayers = () => {
      if (!map.getSource('hotspots')) {
        map.addSource('hotspots', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as any } as any);
      }
      // Primary circle layer
      if (!map.getLayer('hotspots-points')) {
        map.addLayer(
          {
            id: 'hotspots-points',
            type: 'circle',
            source: 'hotspots',
            paint: {
              // size by confidence
              'circle-radius': [
                'interpolate', ['linear'], ['get', 'confidence'],
                0.4, 5,
                0.6, 7,
                0.8, 9,
                0.95, 11
              ],
              // color by ranking: high = hot (red), medium = warm (amber), low = cool (cyan)
              'circle-color': [
                'case',
                ['>=', ['get', 'confidence'], 0.78], '#ff3b3b',
                ['>=', ['get', 'confidence'], 0.62], '#f59e0b',
                '#22d3ee'
              ],
              'circle-opacity': 0.95,
              'circle-stroke-color': 'rgba(255,255,255,0.9)',
              'circle-stroke-width': 2,
            },
          } as any
        );
      }
      // Soft glow halo
      if (!map.getLayer('hotspots-glow')) {
        map.addLayer(
          {
            id: 'hotspots-glow',
            type: 'circle',
            source: 'hotspots',
            paint: {
              'circle-radius': [
                'interpolate', ['linear'], ['get', 'confidence'],
                0.4, 10,
                0.6, 12,
                0.8, 14,
                0.95, 18
              ],
              'circle-color': [
                'case',
                ['>=', ['get', 'confidence'], 0.78], 'rgba(255,59,59,0.25)',
                ['>=', ['get', 'confidence'], 0.62], 'rgba(245,158,11,0.22)',
                'rgba(34,211,238,0.22)'
              ],
              'circle-blur': 0.6,
              'circle-opacity': 0.8,
            },
          } as any,
          'hotspots-points'
        );
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
        time: isoDate || 'latest',
        layers: ['sst','chl'].filter(Boolean),
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
      const featureCollection = data.hotspots || { type: 'FeatureCollection', features: [] };
      const src = map.getSource('hotspots') as any;
      if (src?.setData) src.setData(featureCollection);
      const next = (featureCollection.features || []).map((f: any) => ({
        id: f?.properties?.id || 'spot',
        title: f?.properties?.title || 'Candidate',
        confidence: typeof f?.properties?.confidence === 'number' ? f.properties.confidence : 0,
        lng: f?.geometry?.coordinates?.[0],
        lat: f?.geometry?.coordinates?.[1],
      }));
      setHotspots(next);
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
      boxEl.current.style.zIndex = '1001';
      const mount = document.querySelector('.mapboxgl-canvas-container') || document.body;
      mount.appendChild(boxEl.current);
    }
    if (!metricsEl.current) {
      metricsEl.current = document.createElement('div');
      Object.assign(metricsEl.current.style, { position: 'absolute' } as any);
      metricsEl.current.style.inset = '0';
      metricsEl.current.style.pointerEvents = 'none';
      metricsEl.current.style.zIndex = '1002';
      const mount2 = document.querySelector('.mapboxgl-canvas-container') || document.body;
      mount2.appendChild(metricsEl.current);
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
          pointer-events:none;
        "></div>`;
      if (metricsEl.current) {
        const sw = map.unproject([left, top + height]);
        const ne = map.unproject([left + width, top]);
        const nw = map.unproject([left, top]);
        const se = map.unproject([left + width, top + height]);
        const kmW = kmBetween({ lng: sw.lng, lat: sw.lat }, { lng: se.lng, lat: se.lat });
        const kmH = kmBetween({ lng: sw.lng, lat: sw.lat }, { lng: nw.lng, lat: nw.lat });
        const area = kmW * kmH;
        const label = `${kmW < 1 ? (kmW * 1000).toFixed(0) + ' m' : kmW.toFixed(1) + ' km'} × ${kmH < 1 ? (kmH * 1000).toFixed(0) + ' m' : kmH.toFixed(1) + ' km'} · ${area >= 100 ? area.toFixed(0) : area.toFixed(1)} km²`;
        const cx = left + width / 2;
        const cy = top + height + 8;
        metricsEl.current.innerHTML = `
          <div style="position:absolute;transform:translate(${cx}px,${cy}px);left:-50%;white-space:nowrap;background:rgba(0,0,0,0.75);color:#fff;border-radius:6px;padding:2px 6px;font:12px system-ui;border:1px solid rgba(255,255,255,0.15);backdrop-filter:blur(4px)">${label}</div>
        `;
      }
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
      metricsEl.current?.remove();
      metricsEl.current = null;
      // Restore interactions and cursor
      controls.forEach((c) => c?.enable?.());
      map.getCanvas().style.cursor = prevCursor;
    };
  }, [map, snipping]);

  // Remove legacy HTML overlay dots — using Mapbox circle layers now

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
              bbox && !isAnalyzing
                ? 'bg-emerald-400 text-black shadow-[0_0_24px_rgba(16,185,129,0.45)] animate-pulse'
                : 'bg-white/20 text-white/80',
              'ring-1 ring-white/15'
            ].join(' ')}
            disabled={!bbox || isAnalyzing}
            onClick={runAnalyze}
            title={bbox ? (isAnalyzing ? 'Analyzing…' : 'Analyze selected area') : 'Snip an area first'}
          >
            {isAnalyzing ? 'Analyzing…' : 'Analyze'}
          </button>

          
        </div>
      </div>

      {/* Snip overlay removed; we attach native mouse handlers to the map canvas in the snipping effect */}

      <LayersRuntime />

      {analysisOpen && (
        <div className="pointer-events-auto absolute right-3 top-3 z-40 w-[min(92vw,420px)] max-h-[82vh] overflow-auto rounded-xl bg-black/70 p-4 text-white ring-1 ring-white/10 backdrop-blur">
          <div className="mb-2 text-sm opacity-80">Analysis Results · {inlet.name}</div>
          <div className="text-sm leading-6 space-y-3">
            <div className="opacity-85">{analyzeSummary?.notes || 'Three candidate areas ranked by confidence.'}</div>
            <div className="grid gap-2">
              {hotspots.map((h, idx) => (
                <button
                  key={h.id || idx}
                  className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:border-cyan-300/40 hover:bg-white/10"
                  onClick={() => {
                    if (!map || h.lng == null || h.lat == null) return;
                    try { map.flyTo({ center: [h.lng, h.lat], zoom: Math.max(map.getZoom(), 9), essential: true }); } catch {}
                  }}
                  title="Fly to hotspot"
                >
                  <div>
                    <div className="font-medium">{idx === 0 ? 'Hot' : idx === 1 ? 'Warm' : 'Interesting'} · {h.title}</div>
                    <div className="text-xs opacity-70">{h.lat?.toFixed(3)}, {h.lng?.toFixed(3)}</div>
                    {/* factor breakdown */}
                    {h.factors && (
                      <div className="mt-1 grid grid-cols-2 gap-1 text-[11px] opacity-85">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background:'#60a5fa' }} />
                          <span>SST</span>
                          <span className="ml-auto">{Math.round((h.factors.sst?.score ?? 0)*100)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background:'#34d399' }} />
                          <span>CHL</span>
                          <span className="ml-auto">{Math.round((h.factors.chl?.score ?? 0)*100)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{
                      background: idx === 0 ? 'rgba(255,59,59,0.18)' : idx === 1 ? 'rgba(245,158,11,0.18)' : 'rgba(34,211,238,0.18)',
                      color: idx === 0 ? '#ff6b6b' : idx === 1 ? '#fbbf24' : '#67e8f9',
                      border: '1px solid rgba(255,255,255,0.12)'
                    }}
                  >{Math.round((h.confidence ?? 0) * 100)}%</div>
                </button>
              ))}
            </div>
            <div className="opacity-90 text-xs">Use local knowledge and check weather/tides before making decisions on the water.</div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              className="rounded bg-white/90 px-3 py-1.5 text-sm text-black"
              onClick={() => {
                setAnalysisOpen(false);
                setSnipping(false);
                setHotspots([]);
                try {
                  const src = map?.getSource('hotspots') as any;
                  src?.setData?.({ type: 'FeatureCollection', features: [] });
                  const inlet = getInletById(selectedInletId) ?? DEFAULT_INLET;
                  map?.flyTo?.({ center: inlet.center, zoom: inlet.zoom, essential: true });
                } catch {}
              }}
            >
              Exit
            </button>
            <div className="text-xs opacity-70">Shortcuts: Enter = Analyze · Esc = Cancel</div>
          </div>
        </div>
      )}
    </MapShell>
    </RequireUsername>
  );
}
