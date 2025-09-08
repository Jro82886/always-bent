"use client";

import { useEffect, useRef } from "react";
import { useMapbox } from "@/lib/MapCtx";
import { useAppState } from "@/store/appState";
import { showOnly, refreshOnDate, wireMoveRefresh, needsBbox, RASTER_LAYERS, setRasterVisible } from "@/lib/layers";
import { cleanReload } from "@/utils/cleanReload";
import OverviewPanel from "@/components/OverviewPanel";
import { usePathname } from "next/navigation";

export default function LayersRuntime() {
  const map = useMapbox();
  const active = useAppState(s => s.activeRaster);
  const isoDate = useAppState(s => s.isoDate);
  const selectedInletId = useAppState(s => s.selectedInletId);
  const unwireRef = useRef<null | (() => void)>(null);
  const pathname = usePathname();

  // --- Overview: BIG INTEREST AREAS (placeholder polygons) ---
  function ensureOverviewAreas(show: boolean) {
    const m: any = map as any;
    if (!m) return;
    // Deprecated placeholder ids (removed): overview-areas, overview-areas-fill, overview-areas-line, overview-areas-label

    if (show) {
      // Load external sample edges if available
      const demoId = 'overview-edges-demo';
      if (!m.getSource(demoId)) {
        const v = new Date().toISOString().slice(0,10); // cache-bust daily
        m.addSource(demoId, { type: 'geojson', data: `/abfi_sst_edges_latest.geojson?v=${v}` });
      }

      const beforeId = m.getStyle()?.layers?.find((l: any) => l.type === 'symbol')?.id;
      if (!m.getLayer('overview-edges-demo-fill')) {
        m.addLayer({ id: 'overview-edges-demo-fill', type: 'fill', source: 'overview-edges-demo', paint: { 'fill-color': ['match',['get','class'],'filament','#00DDEB','eddy','#E879F9','#F59E0B'], 'fill-opacity': 0.12 } } as any, beforeId);
      }
      if (!m.getLayer('overview-edges-demo-line')) {
        m.addLayer({ id: 'overview-edges-demo-line', type: 'line', source: 'overview-edges-demo', paint: { 'line-color': ['match',['get','class'],'filament','#06B6D4','eddy','#D946EF','#F59E0B'], 'line-width': 1.4, 'line-opacity': 0.65 } } as any, beforeId);
      }
    } else {
      if (m.getLayer('overview-edges-demo-line')) m.removeLayer('overview-edges-demo-line');
      if (m.getLayer('overview-edges-demo-fill')) m.removeLayer('overview-edges-demo-fill');
      if (m.getSource('overview-edges-demo')) m.removeSource('overview-edges-demo');
    }
  }

  // When active layer changes: show that one and manage bbox listener
  useEffect(() => {
    if (!map) return;
    // Polygons only on analysis page per request
    const onAnalysis = Boolean(pathname && (pathname.startsWith('/analysis') || pathname.startsWith('/v2/analysis')));
    ensureOverviewAreas(onAnalysis && selectedInletId === 'overview');
    // If nothing is active, hide all rasters
    if (!active) {
      if (unwireRef.current) { unwireRef.current(); unwireRef.current = null; }
      for (const cfg of RASTER_LAYERS) {
        setRasterVisible(map, cfg.id, false);
      }
      return;
    }

    // No route-based flips; lock to the active raster id as selected in Header
    const effective = active;

    const needs = needsBbox(effective as any);
    showOnly(map, effective as any, { isoDate });

    if (unwireRef.current) { unwireRef.current(); unwireRef.current = null; }
    if (needs.needsBbox) {
      wireMoveRefresh(map, effective as any, isoDate, fn => (unwireRef.current = fn));
    } else {
      // For XYZ layers (e.g., SST), refresh once after the current flyTo completes
      const once = () => refreshOnDate(map, effective as any, isoDate, null);
      map.once("moveend", once);
      unwireRef.current = () => { /* one-shot */ };
    }
    return () => {
      if (unwireRef.current) { unwireRef.current(); unwireRef.current = null; }
    };
  }, [map, active, selectedInletId, isoDate, pathname]);

  // After a style reload, Mapbox drops custom layers; re-add overview polygons when applicable
  useEffect(() => {
    if (!map) return;
    const onStyle = () => ensureOverviewAreas(selectedInletId === 'overview');
    map.on('style.load', onStyle);
    return () => { map.off('style.load', onStyle); };
  }, [map, selectedInletId]);

  // Legacy UI detector removed; HeaderBar is the single source of truth

  // When the date changes: refresh currently active layer
  useEffect(() => {
    if (!map || !active || !isoDate) return;
    const needs = needsBbox(active);
    refreshOnDate(map, active, isoDate, needs.needsBbox ? undefined : null);
  }, [map, active, isoDate]);

  // When the inlet changes: after flyTo completes, refresh active XYZ layer
  useEffect(() => {
    if (!map || !active) return;
    const needs = needsBbox(active);
    const onEnd = () => refreshOnDate(map, active, isoDate || "", needs.needsBbox ? undefined : null);
    map.once("moveend", onEnd);
    return () => { /* one-shot */ };
  }, [map, active, selectedInletId]);

  // After a style switch (basemap change) Mapbox clears custom layers/sources.
  // Reapply the currently active raster layer when the new style finishes loading.
  useEffect(() => {
    if (!map) return;
    const onStyleLoad = () => {
      if (!active) return;
      const needs = needsBbox(active);
      showOnly(map, active, { isoDate });
      if (unwireRef.current) { unwireRef.current(); unwireRef.current = null; }
      if (needs.needsBbox) {
        wireMoveRefresh(map, active, isoDate, fn => (unwireRef.current = fn));
      }
    };
    map.on('style.load', onStyleLoad);
    return () => { map.off('style.load', onStyleLoad); };
  }, [map, active, isoDate]);

  const showLegend = selectedInletId === 'overview';
  const legendItems = [
    { key: 'edge',     label: 'Edge',     fill: '#F59E0B', stroke: '#F59E0B' },
    { key: 'filament', label: 'Filament', fill: '#00DDEB', stroke: '#06B6D4' },
    { key: 'eddy',     label: 'Eddy',     fill: '#E879F9', stroke: '#D946EF' }
  ];

  return (
    <>
      {showLegend && pathname && (pathname.startsWith('/analysis') || pathname.startsWith('/v2/analysis')) && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            top: 16,
            zIndex: 1000,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(10,12,18,0.72)',
            border: '1px solid rgba(148,163,184,0.22)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
            color: '#E5E7EB',
            backdropFilter: 'saturate(150%) blur(6px)'
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: 0.3, color: '#94A3B8', marginBottom: 6 }}>SST Features</div>
          {legendItems.map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span
                aria-hidden
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: item.fill,
                  border: `1px solid ${item.stroke}`,
                }}
              />
              <span style={{ fontSize: 12 }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
      {selectedInletId === 'overview' && pathname && (pathname.startsWith('/analysis') || pathname.startsWith('/v2/analysis')) && <OverviewPanel />}
    </>
  );
}


