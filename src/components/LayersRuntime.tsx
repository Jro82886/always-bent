"use client";

import { useEffect, useRef } from "react";
import { useMapbox } from "@/lib/MapCtx";
import { useAppState } from "@/store/appState";
import { showOnly, refreshOnDate, wireMoveRefresh, needsBbox, RASTER_LAYERS, setRasterVisible } from "@/lib/layers";
import { cleanReload } from "@/utils/cleanReload";

export default function LayersRuntime() {
  const map = useMapbox();
  const active = useAppState(s => s.activeRaster);
  const isoDate = useAppState(s => s.isoDate);
  const selectedInletId = useAppState(s => s.selectedInletId);
  const unwireRef = useRef<null | (() => void)>(null);

  // When active layer changes: show that one and manage bbox listener
  useEffect(() => {
    if (!map) return;
    // If nothing is active, hide all rasters
    if (!active) {
      if (unwireRef.current) { unwireRef.current(); unwireRef.current = null; }
      for (const cfg of RASTER_LAYERS) {
        setRasterVisible(map, cfg.id, false);
      }
      return;
    }

    const needs = needsBbox(active);
    showOnly(map, active, { isoDate });

    if (unwireRef.current) { unwireRef.current(); unwireRef.current = null; }
    if (needs.needsBbox) {
      wireMoveRefresh(map, active, isoDate, fn => (unwireRef.current = fn));
    } else {
      // For XYZ layers (e.g., SST), refresh once after the current flyTo completes
      const once = () => refreshOnDate(map, active, isoDate, null);
      map.once("moveend", once);
      unwireRef.current = () => { /* one-shot */ };
    }
    return () => {
      if (unwireRef.current) { unwireRef.current(); unwireRef.current = null; }
    };
  }, [map, active]);

  // Defensive: detect unexpected duplicate legacy UI state and hard refresh
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const legacy = document.querySelector('[title="Toggle SST layer"]');
    if (legacy) {
      // Clean caches + reload to remove any stale injected UI
      cleanReload();
    }
  }, []);

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

  return null;
}


