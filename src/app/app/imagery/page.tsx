"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LeftRail } from "@/components/LeftRail";
import { TopBar } from "@/components/TopBar";
import { useAppState } from "@/store/appState";
import * as Tooltip from "@radix-ui/react-tooltip";
import toast from "react-hot-toast";
import mapboxgl from "mapbox-gl";
import { exportMapAsPng } from "@/lib/services/export";

export default function ImageryPage() {
  const { inletId, imageryDate, imageryActiveLayer, setImageryActiveLayer, setImageryDate } = useAppState() as any;
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;
    try {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [-80.067, 26.936],
        zoom: 7,
      });
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
      mapRef.current = map;
    } catch (e) {
      console.error(e);
      toast.error("Failed to initialize map");
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    // Placeholder overlay loader
    const map = mapRef.current;
    const layer = imageryActiveLayer;
    const date = imageryDate;
    if (!layer) {
      // remove placeholder layer if any
      if (map.getLayer("imagery-demo")) map.removeLayer("imagery-demo");
      if (map.getSource("imagery-demo")) map.removeSource("imagery-demo");
      return;
    }
    setLoading(true);
    console.log(`loading ${layer} for ${date}`);
    // Simulate load delay
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [imageryActiveLayer, imageryDate]);

  const reset = () => {
    setImageryActiveLayer?.(null);
    setImageryDate?.(new Date().toISOString().slice(0, 10));
  };

  const onExport = () => {
    const map = mapRef.current;
    if (!map) {
      toast.error("Failed to export map");
      return;
    }
    exportMapAsPng(map);
  };

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <TopBar />
      <div className="grid grid-cols-[56px_1fr]">
        <LeftRail />
        <div className="ml-14 relative flex flex-col min-h-0">
          <div className="h-12 border-b flex items-center gap-3 px-3">
            <Tooltip.Provider delayDuration={0}>
              <div className="flex items-center gap-2">
                <label className="text-sm opacity-80">Date</label>
                <input type="date" value={imageryDate} onChange={(e) => setImageryDate?.(e.target.value)} className="bg-transparent border rounded px-2 py-1 text-sm" />
              </div>
              <div className="ml-6 flex items-center gap-2">
                <button className={`px-2 py-1 rounded text-sm border ${imageryActiveLayer === "sst" ? "bg-cyan-600 text-white border-cyan-600" : "border-cyan-600/40 text-cyan-700 dark:text-cyan-300"}`} onClick={() => setImageryActiveLayer?.(imageryActiveLayer === "sst" ? null : "sst")}>SST</button>
                <button className={`px-2 py-1 rounded text-sm border ${imageryActiveLayer === "chlorophyll" ? "bg-cyan-600 text-white border-cyan-600" : "border-cyan-600/40 text-cyan-700 dark:text-cyan-300"}`} onClick={() => setImageryActiveLayer?.(imageryActiveLayer === "chlorophyll" ? null : "chlorophyll")}>Chlorophyll</button>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button disabled className="px-2 py-1 rounded text-sm border opacity-50 cursor-not-allowed">Wind</button>
                  </Tooltip.Trigger>
                  <Tooltip.Content side="top" className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-100 shadow">Coming soon</Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button disabled className="px-2 py-1 rounded text-sm border opacity-50 cursor-not-allowed">Currents</button>
                  </Tooltip.Trigger>
                  <Tooltip.Content side="top" className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-100 shadow">Coming soon</Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button disabled className="px-2 py-1 rounded text-sm border opacity-50 cursor-not-allowed">Salinity</button>
                  </Tooltip.Trigger>
                  <Tooltip.Content side="top" className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-100 shadow">Coming soon</Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button disabled className="px-2 py-1 rounded text-sm border opacity-50 cursor-not-allowed">Waves</button>
                  </Tooltip.Trigger>
                  <Tooltip.Content side="top" className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-100 shadow">Coming soon</Tooltip.Content>
                </Tooltip.Root>
                <span className="ml-4 text-xs opacity-70">Source: Copernicus</span>
                <button className="ml-2 text-xs px-2 py-1 rounded border" onClick={reset}>Reset</button>
              </div>
            </Tooltip.Provider>
          </div>
          <div ref={mapContainerRef} className="flex-1 relative">
            {!imageryActiveLayer ? (
              <div className="absolute inset-0 grid place-items-center text-sm opacity-70">Pick a layer to view imagery.</div>
            ) : null}
            {loading ? (
              <div className="absolute right-3 top-14 text-xs bg-black/60 text-white rounded px-2 py-1">Loading imagery…</div>
            ) : null}
          </div>
          {imageryActiveLayer ? (
            <button onClick={onExport} className="absolute bottom-4 right-4 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg shadow font-medium">
              Export PNG
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}



