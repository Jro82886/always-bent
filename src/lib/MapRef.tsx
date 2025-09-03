"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MapCtx } from "@/lib/MapCtx";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAppState } from "@/store/appState";
import { DEFAULT_INLET, getInletById } from "@/lib/inlets";

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

const BASE_STYLES = [
  { id: "dark", url: "mapbox://styles/mapbox/dark-v11", label: "Dark" },
  { id: "satellite", url: "mapbox://styles/mapbox/satellite-v9", label: "Satellite" },
  { id: "streets", url: "mapbox://styles/mapbox/streets-v12", label: "Streets" },
] as const;

function getInitialStyleUrl(): string {
  if (typeof window === "undefined") return BASE_STYLES[0].url;
  try {
    return localStorage.getItem("abfi:basemap") ?? BASE_STYLES[0].url;
  } catch {
    return BASE_STYLES[0].url;
  }
}

// Basemap is now controlled via BasemapControl HUD component

export function MapShell({ children }: { children: React.ReactNode }) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedInletId = useAppState((s) => s.selectedInletId);

  useEffect(() => {
    if (mapRef.current || !divRef.current || !mapboxgl.accessToken) return;

    // Start at the default overview inlet
    const map = new mapboxgl.Map({
      container: divRef.current,
      style: getInitialStyleUrl(),
      center: DEFAULT_INLET.center,
      zoom: DEFAULT_INLET.zoom,
      cooperativeGestures: true,
    });

    map.on("load", () => {
      console.log("[MapShell] map ready");
      // Basemap control moved to HUD
      // Add a global scale control (bottom-left) for context
      try {
        map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");
      } catch {}
    });

    mapRef.current = map;
    (window as any).map = map;
    (globalThis as any).abfiMap = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly map when inlet changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const inlet = getInletById(selectedInletId) || DEFAULT_INLET;
    map.flyTo({ center: inlet.center, zoom: inlet.zoom, essential: true });
  }, [selectedInletId]);

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