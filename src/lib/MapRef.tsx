"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MapCtx } from "@/lib/MapCtx";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAppState } from "@/store/appState";
import { DEFAULT_INLET, getInletById } from "@/lib/inlets";

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export function MapShell({ children }: { children: React.ReactNode }) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedInletId = useAppState((s) => s.selectedInletId);

  useEffect(() => {
    if (mapRef.current || !divRef.current || !mapboxgl.accessToken) return;

    // Start at the default overview inlet
    const map = new mapboxgl.Map({
      container: divRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_INLET.center,
      zoom: DEFAULT_INLET.zoom,
      cooperativeGestures: true,
    });

    map.on("load", () => {
      console.log("[MapShell] map ready");
    });

    mapRef.current = map;
    (window as any).map = map;

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
      <div ref={divRef} id="map" className="w-full h-full" />

      {/* Overlays (UI on top of the map) */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {children}
      </div>
    </MapCtx.Provider>
  );
}