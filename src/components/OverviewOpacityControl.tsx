'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
// Raster targets (SST/CHL) — we dim these as features are revealed
const RASTER_TARGETS: Target[] = [
  { id: 'lyr:sst', prop: 'raster-opacity' },
  { id: 'lyr:chl', prop: 'raster-opacity' },
];

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export default function OverviewOpacityControl() {
  const map = useMapbox() as any;
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Master reveal slider (0 = hidden overlays; 1 = full overlays)
  const [reveal, setReveal] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem('abfi_overview_reveal') || '0');
    return isNaN(v) ? 0 : clamp01(v);
  });
  // Optional advanced per-channel factors (default 1.0 each)
  const [fill, setFill] = useState<number>(() => clamp01(parseFloat(localStorage.getItem('abfi_overview_opacity_fill') || '1') || 1));
  const [line, setLine] = useState<number>(() => clamp01(parseFloat(localStorage.getItem('abfi_overview_opacity_line') || '1') || 1));
  const [label, setLabel] = useState<number>(() => clamp01(parseFloat(localStorage.getItem('abfi_overview_opacity_label') || '1') || 1));

  // Store original paint values so we can multiply rather than overwrite
  const originalsRef = useRef<Record<string, any>>({});

  function keyFor(t: Target) { return `${t.id}:${t.prop}`; }

  function mulExpr(orig: any, factor: number) {
    if (typeof orig === 'number') return clamp01(orig * factor);
    if (Array.isArray(orig)) return ['*', orig, factor];
    // Fallback to factor itself if unknown
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

  // Dim raster as reveal increases. At full reveal we keep a target fraction of base.
  // Example: target = 0.55 → at reveal=1 raster is 55% of original opacity.
  const RASTER_TARGET_AT_FULL = 0.55;
  function applyRasterDim(revealFactor: number) {
    const mult = 1 - (1 - RASTER_TARGET_AT_FULL) * clamp01(revealFactor);
    applyOpacity(RASTER_TARGETS, mult);
  }

  // Apply on mount and when values change (master multiplies advanced factors)
  useEffect(() => { applyOpacity(FILL_TARGETS, reveal * fill); }, [map, reveal, fill]);
  useEffect(() => { applyOpacity(LINE_TARGETS, reveal * line); }, [map, reveal, line]);
  useEffect(() => { applyOpacity(LABEL_TARGETS, reveal * label); }, [map, reveal, label]);
  useEffect(() => { applyRasterDim(reveal); }, [map, reveal]);

  // Re-apply after a style reload (layers are rebuilt)
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

  // Persist
  useEffect(() => { localStorage.setItem('abfi_overview_reveal', String(reveal)); }, [reveal]);
  useEffect(() => { localStorage.setItem('abfi_overview_opacity_fill', String(fill)); }, [fill]);
  useEffect(() => { localStorage.setItem('abfi_overview_opacity_line', String(line)); }, [line]);
  useEffect(() => { localStorage.setItem('abfi_overview_opacity_label', String(label)); }, [label]);

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
        top: 110,
        zIndex: 1000,
        padding: '12px 14px',
        borderRadius: 12,
        background: 'rgba(10,12,18,0.72)',
        border: '1px solid rgba(148,163,184,0.22)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
        color: '#E5E7EB',
        backdropFilter: 'saturate(150%) blur(6px)',
        width: 260,
        pointerEvents: 'auto' as const,
        touchAction: 'none' as const,
      }}
      onMouseEnter={disableMapInteractions}
      onMouseLeave={enableMapInteractions}
      onPointerDownCapture={(e) => { e.stopPropagation(); }}
      onPointerMoveCapture={(e) => { e.stopPropagation(); }}
      onWheelCapture={(e) => { e.stopPropagation(); }}
    >
      <div style={{ fontSize: 12, letterSpacing: 0.3, color: '#94A3B8', marginBottom: 8 }}>Reveal Features</div>
      <SliderRow label="Reveal" value={reveal} onChange={setReveal} />
      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: 'pointer', fontSize: 12, color: '#94A3B8' }}>Advanced</summary>
        <div style={{ marginTop: 6 }}>
          <SliderRow label="Fill" value={fill} onChange={setFill} />
          <SliderRow label="Outline" value={line} onChange={setLine} />
          <SliderRow label="Labels" value={label} onChange={setLabel} />
        </div>
      </details>
    </div>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 40px', alignItems: 'center', gap: 8, marginTop: 8 }}>
      <div style={{ fontSize: 12, color: '#E5E7EB' }}>{label}</div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
        onMouseDown={(e) => { e.stopPropagation(); }}
        onTouchStart={(e) => { e.stopPropagation(); }}
      />
      <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'right' }}>{pct}%</div>
    </div>
  );
}


