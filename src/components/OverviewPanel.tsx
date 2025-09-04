'use client';

import { useEffect, useRef, useState } from 'react';
import { useMapbox } from '@/lib/MapCtx';

type Target = { id: string; prop: 'fill-opacity' | 'line-opacity' | 'text-opacity' | 'raster-opacity' };

const FILL_TARGETS: Target[] = [
  { id: 'overview-edges-demo-fill', prop: 'fill-opacity' },
  { id: 'overview-areas-fill', prop: 'fill-opacity' },
];
const LINE_TARGETS: Target[] = [
  { id: 'overview-edges-demo-line', prop: 'line-opacity' },
  { id: 'overview-areas-line', prop: 'line-opacity' },
];
const LABEL_TARGETS: Target[] = [
  { id: 'overview-areas-label', prop: 'text-opacity' },
];
const RASTER_TARGETS: Target[] = [
  { id: 'lyr:sst', prop: 'raster-opacity' },
  { id: 'lyr:chl', prop: 'raster-opacity' },
];

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export default function OverviewPanel() {
  const map = useMapbox() as any;
  const [reveal, setReveal] = useState<number>(() => {
    try { return clamp01(parseFloat(localStorage.getItem('abfi_overview_reveal') || '0')); } catch { return 0; }
  });
  const [fill, setFill] = useState<number>(() => 1);
  const [line, setLine] = useState<number>(() => 1);
  const [label, setLabel] = useState<number>(() => 1);

  const originalsRef = useRef<Record<string, any>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  function keyFor(t: Target) { return `${t.id}:${t.prop}`; }
  function mulExpr(orig: any, factor: number) {
    if (typeof orig === 'number') return clamp01(orig * factor);
    if (Array.isArray(orig)) return ['*', orig, factor];
    return clamp01(factor);
  }
  function applyOpacity(targets: Target[], factor: number) {
    if (!map) return;
    for (const t of targets) {
      try {
        if (!map.getLayer(t.id)) continue;
        const k = keyFor(t);
        if (!(k in originalsRef.current)) {
          const orig = map.getPaintProperty(t.id, t.prop);
          originalsRef.current[k] = orig;
        }
        const orig = originalsRef.current[k];
        const next = mulExpr(orig, clamp01(factor));
        map.setPaintProperty(t.id, t.prop, next as any);
      } catch {}
    }
  }
  const RASTER_TARGET_AT_FULL = 0.55;
  function applyRasterDim(revealFactor: number) {
    const mult = 1 - (1 - RASTER_TARGET_AT_FULL) * clamp01(revealFactor);
    applyOpacity(RASTER_TARGETS, mult);
  }

  useEffect(() => { applyOpacity(FILL_TARGETS, reveal * fill); }, [map, reveal, fill]);
  useEffect(() => { applyOpacity(LINE_TARGETS, reveal * line); }, [map, reveal, line]);
  useEffect(() => { applyOpacity(LABEL_TARGETS, reveal * label); }, [map, reveal, label]);
  useEffect(() => { applyRasterDim(reveal); }, [map, reveal]);
  useEffect(() => {
    if (!map) return;
    const reapply = () => {
      originalsRef.current = {};
      applyOpacity(FILL_TARGETS, reveal * fill);
      applyOpacity(LINE_TARGETS, reveal * line);
      applyOpacity(LABEL_TARGETS, reveal * label);
      applyRasterDim(reveal);
    };
    map.on('style.load', reapply);
    return () => { map.off('style.load', reapply); };
  }, [map, reveal, fill, line, label]);
  useEffect(() => { try { localStorage.setItem('abfi_overview_reveal', String(reveal)); } catch {} }, [reveal]);

  function disableMapInteractions() {
    if (!map) return;
    try {
      map.boxZoom?.disable?.();
      map.dragPan?.disable?.();
      map.dragRotate?.disable?.();
      map.scrollZoom?.disable?.();
      map.keyboard?.disable?.();
      map.doubleClickZoom?.disable?.();
      map.touchZoomRotate?.disable?.();
    } catch {}
  }
  function enableMapInteractions() {
    if (!map) return;
    try {
      map.boxZoom?.enable?.();
      map.dragPan?.enable?.();
      map.dragRotate?.enable?.();
      map.scrollZoom?.enable?.();
      map.keyboard?.enable?.();
      map.doubleClickZoom?.enable?.();
      map.touchZoomRotate?.enable?.();
    } catch {}
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        right: 16,
        top: 16,
        zIndex: 1000,
        width: 260,
        borderRadius: 12,
        background: 'rgba(10,12,18,0.72)',
        border: '1px solid rgba(148,163,184,0.22)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
        color: '#E5E7EB',
        backdropFilter: 'saturate(150%) blur(6px)',
        padding: '10px 12px',
        pointerEvents: 'auto' as const,
        touchAction: 'none' as const,
      }}
      onMouseEnter={disableMapInteractions}
      onMouseLeave={enableMapInteractions}
      onPointerDownCapture={(e) => { e.stopPropagation(); }}
      onPointerMoveCapture={(e) => { e.stopPropagation(); }}
      onWheelCapture={(e) => { e.stopPropagation(); }}
    >
      <div style={{ fontSize: 12, letterSpacing: 0.3, color: '#94A3B8', marginBottom: 6 }}>SST Features</div>
      {[{k:'edge', l:'Edge', f:'#F59E0B', s:'#F59E0B'}, {k:'filament', l:'Filament', f:'#00DDEB', s:'#06B6D4'}, {k:'eddy', l:'Eddy', f:'#E879F9', s:'#D946EF'}].map(item => (
        <div key={item.k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span aria-hidden style={{ width: 14, height: 14, borderRadius: 3, background: item.f, border: `1px solid ${item.s}` }} />
          <span style={{ fontSize: 12 }}>{item.l}</span>
        </div>
      ))}
      <div style={{ height: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 40px', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 12, color: '#E5E7EB' }}>Reveal</div>
        <input type="range" min={0} max={1} step={0.01} value={reveal}
          onChange={(e) => setReveal(parseFloat(e.target.value))}
          onMouseDown={(e) => { e.stopPropagation(); }}
          onTouchStart={(e) => { e.stopPropagation(); }}
        />
        <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'right' }}>{Math.round(reveal * 100)}%</div>
      </div>
    </div>
  );
}


