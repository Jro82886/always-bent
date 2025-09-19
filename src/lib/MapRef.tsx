"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MapCtx } from "@/lib/MapCtx";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAppState } from "@/store/appState";
import { DEFAULT_INLET, getInletById } from "@/lib/inlets";
import { PersistentLayerManager } from "@/lib/persistLayers";
import { overviewBundle } from "@/lib/persistentBundles";
import { usePathname } from "next/navigation";

// Mapbox token will be set in useEffect to avoid SSR issues

const BASE_STYLES = [
  { id: "satellite", url: "mapbox://styles/mapbox/satellite-v9", label: "Satellite" },
  { id: "dark", url: "mapbox://styles/mapbox/dark-v11", label: "Dark" },
  { id: "streets", url: "mapbox://styles/mapbox/streets-v12", label: "Streets" },
] as const;

function getInitialStyleUrl(): string {
  const satelliteUrl = "mapbox://styles/mapbox/satellite-v9";
  if (typeof window === "undefined") return satelliteUrl;
  try {
    return localStorage.getItem("abfi:basemap") ?? satelliteUrl;
  } catch {
    return satelliteUrl;
  }
}

// Basemap is now controlled via BasemapControl HUD component

export function MapShell({ children }: { children: React.ReactNode }) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedInletId = useAppState((s) => s.selectedInletId);
  const isoDate = useAppState((s) => s.isoDate);
  const plmRef = useRef<PersistentLayerManager | null>(null);
  const pathname = usePathname();


  useEffect(() => {
    if (mapRef.current || !divRef.current) return;

    // Set Mapbox token here to avoid SSR issues
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

    // Start at the default overview inlet
    const map = new mapboxgl.Map({
      container: divRef.current,
      style: getInitialStyleUrl(),
      center: DEFAULT_INLET.center,
      zoom: DEFAULT_INLET.zoom,
      cooperativeGestures: true,
    });

    map.on("load", () => {
      
      // Basemap control moved to HUD
      // Add a global scale control (bottom-left) for context
      try {
        map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");
      } catch {}
      try { map.setPadding({ top: 0, right: 0, left: 0, bottom: 80 }); } catch {}
    });

    mapRef.current = map;
    (window as any).map = map;
    (globalThis as any).abfiMap = map;

    // Attach persistence for overview + SST
    try {
      const plm = new PersistentLayerManager(map);
      plm.register(overviewBundle);
      plm.attach();
      (globalThis as any).abfiPLM = plm;
      plmRef.current = plm;
    } catch {}

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly map when inlet changes (honor inlet on Tracking and Legendary pages)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const isTracking = Boolean(pathname && pathname.startsWith('/legendary/tracking'));
    const isLegendary = Boolean(pathname && pathname.startsWith('/legendary'));
    const shouldUseInlet = isTracking || isLegendary;
    const inlet = shouldUseInlet ? (getInletById(selectedInletId) || DEFAULT_INLET) : DEFAULT_INLET;
    
    // Inlet Contract vFinal: never move camera on inlet changes (data scope only)
  }, [selectedInletId, pathname]);

  // Update SST tiles when the selected date changes
  // Copernicus SST is now managed by layer runtime; no persistent SST bundle here

  return (
    <MapCtx.Provider value={mapRef.current}>
      {/* Empty container for Mapbox */}
      <div ref={divRef} className="map-canvas w-full h-screen" />

      {/* Overlays (UI on top of the map) */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {children}
      </div>
    </MapCtx.Provider>
  );
}