"use client";

import { useEffect, useRef } from "react";
import { useMapbox } from "@/lib/MapCtx";
import { useAppState } from "@/store/appState";
import { showOnly, refreshOnDate, wireMoveRefresh, needsBbox, RASTER_LAYERS, setRasterVisible } from "@/lib/layers";

export default function LayersRuntime() {
  const map = useMapbox();
  const active = useAppState(s => s.activeRaster);
  const isoDate = useAppState(s => s.isoDate);
  const unwireRef = useRef<null | (() => void)>(null);

  // When active layer changes: show that one and manage bbox listener
  useEffect(() => {
    if (!map) return;
    
    // If nothing is active, hide all rasters
    if (!active) {
      if (unwireRef.current) { unwireRef.current(); unwireRef.current = null; }
      // Hide all layers by setting visibility to none
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
    }
    return () => {
      if (unwireRef.current) { unwireRef.current(); unwireRef.current = null; }
    };
  }, [map, active]);

  // When the date changes: refresh currently active layer
  useEffect(() => {
    if (!map || !active || !isoDate) return;
    const needs = needsBbox(active);
    refreshOnDate(map, active, isoDate, needs.needsBbox ? undefined : null);
  }, [map, active, isoDate]);

  return null;
}


