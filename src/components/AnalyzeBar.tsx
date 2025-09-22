'use client';
import { useCallback, useState, useEffect } from 'react';
// BBox type for bounding box coordinates [west, south, east, north]
type BBox = [number, number, number, number];
import { useAppState } from '@/lib/store';
import { DEFAULT_INLET, getInletById } from '@/lib/inlets';
import { ensureHotspotLayers } from '@/lib/overlay';
import AnalysisFooterBar from '@/components/AnalysisFooterBar';
import type { AnalysisReport } from '@/types/analysis';
import { ensureAnalysisHotspotLayers, setAnalysisHotspots, pickTop3HotspotsForSnip } from '@/lib/hotspots';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { usePathname } from 'next/navigation';

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

function bboxSizeNm(b: [number, number, number, number]) {
  const [minLng, minLat, maxLng, maxLat] = b;
  const centerLat = (minLat + maxLat) / 2;
  const nmPerDegLat = 60.0; // ~1° lat ≈ 60 nm
  const nmPerDegLon = Math.cos((centerLat * Math.PI) / 180) * 60.0;
  const w = Math.max(0, (maxLng - minLng) * nmPerDegLon);
  const h = Math.max(0, (maxLat - minLat) * nmPerDegLat);
  return { w, h };
}

export default function AnalyzeBar() {
  const { selectedInletId, isoDate } = useAppState();
  const pathname = usePathname();
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [snipping, setSnipping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const onSnipDone = useCallback((b: BBox) => {
    setBbox(b);
    setSnipping(false);
    const map: any = (globalThis as any).abfiMap;
    if (map) fitToBBox(map, b);
  }, []);

  async function analyze() {
    if (!bbox) return;
    setBusy(true);
    setReportOpen(false);
    try {
      // Guardrails: apply on all inlets except the East Coast overview
      if (selectedInletId !== 'overview') {
        const dims = bboxSizeNm(bbox as any);
        const tooSmall = dims.w < 15 || dims.h < 15;
        const tooLarge = dims.w > 100 || dims.h > 100;
        if (tooSmall) {
          alert('Snip is too small. Please aim for at least 15×15 nm (ideal 30–60 nm).');
          return;
        }
        if (tooLarge) {
          alert('Snip is too large. Please keep within 100×100 nm to ensure meaningful detection.');
          return;
        }
      }
      const mapRef: any = (globalThis as any).abfiMap;
      if (mapRef) fitToBBox(mapRef, bbox);
      // Use real data analysis if map is available
      let data;
      if (mapRef && typeof window !== 'undefined') {
        // Client-side analysis with REAL pixel data
        const { analyzeAreaWithRealData } = await import('@/lib/analysis/client-analyzer');
        data = await analyzeAreaWithRealData(mapRef, bbox);
      } else {
        // Fallback to API (will be updated to real data soon)
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bbox, time: isoDate || 'latest' }),
        });
        const apiData = await res.json();
        if (!res.ok) throw new Error(apiData?.error || 'Analyze failed');
        data = apiData;
      }
      
      if (mapRef && data.hotspots) {
        ensureHotspotLayers(mapRef);
        drawHotspots(mapRef, data.hotspots);
        fitToBBox(mapRef, bbox);
        // Ensure analysis hotspots single layer exists
        ensureAnalysisHotspotLayers(mapRef);
        try {
          const resp = await fetch('/abfi_sst_edges_latest.geojson');
          const all: FeatureCollection = await resp.json();
          const snipGeom: Polygon | MultiPolygon = { type: 'Polygon', coordinates: [[[bbox[0],bbox[1]],[bbox[2],bbox[1]],[bbox[2],bbox[3]],[bbox[0],bbox[3]],[bbox[0],bbox[1]]]] } as any;
          const top3 = pickTop3HotspotsForSnip(snipGeom, all as any, { minScore: 1.2, maxReturn: 3 });
          setAnalysisHotspots(mapRef, top3 as any);
        } catch {}
      }
      const r = normalizeReport(data?.report, [bbox[0], bbox[1], bbox[2], bbox[3]] as any, (isoDate || '').slice(0,10));
      setReport(r);
      setReportOpen(true);
    } catch (e) {
      console.error(e);
      alert('Analyze failed. See console.');
    } finally {
      setBusy(false);
    }
  }

  function normalizeReport(input: any, b: [number, number, number, number], d: string): AnalysisReport {
    return {
      bbox: b,
      isoDate: d || new Date().toISOString().slice(0,10),
      summary: input?.summary ?? input?.text ?? undefined,
      metrics: input?.metrics ?? [
        input?.sstRange ? { label: 'SST Range', value: input.sstRange } : undefined,
        input?.gradient ? { label: 'Gradient (24h)', value: input.gradient } : undefined,
        input?.fronts ? { label: 'Fronts', value: input.fronts } : undefined,
        input?.confidence ? { label: 'Confidence', value: input.confidence } : undefined,
      ].filter(Boolean),
      bullets: input?.bullets ?? input?.highlights ?? undefined,
      recommendations: input?.recommendations ?? input?.recs ?? undefined,
      rawMarkdown: input?.markdown ?? undefined,
    };
  }

  // Auto-clear hotspots when inlet changes to avoid stale markers
  useEffect(() => {
    const map: any = (globalThis as any).abfiMap;
    if (!map) return;
    try {
      const src: any = map.getSource('hotspots');
      src?.setData?.({ type: 'FeatureCollection', features: [] });
    } catch {}
  }, [selectedInletId]);

  function reset() {
    const map: any = (globalThis as any).abfiMap;
    setBbox(null);
    if (map) {
      try {
        const src: any = map.getSource('hotspots');
        src?.setData?.({ type: 'FeatureCollection', features: [] });
        // User-initiated Reset View: always go to East Coast overview
        map.fitBounds([[-83,24],[-65,45]], { padding: 64, duration: 0 });
      } catch {}
    }
  }

  return (
    <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-6 z-50 flex flex-col items-center gap-3">
      {/* Snipping handled by SnipController in legendary page */}
      <AnalysisFooterBar
        report={report}
        reportOpen={reportOpen}
        snipActive={snipping}
        onStartSnip={() => setSnipping(true)}
        onAnalyze={analyze}
        onBackToInlet={reset}
        onOpenReport={() => setReportOpen(true)}
        onCloseReport={() => setReportOpen(false)}
      />
    </div>
  );
}


