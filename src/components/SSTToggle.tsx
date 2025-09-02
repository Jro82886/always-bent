"use client";

import { useEffect, useState } from "react";
import { useMapbox } from "@/lib/MapCtx";
import { useAppState } from "@/store/appState";
import { addOrUpdateRaster, setRasterVisible, getRasterLayer } from "@/lib/layers";

export default function SSTToggle() {
  const map = useMapbox();
  const { isoDate } = useAppState() as any;
  const [enabled, setEnabled] = useState<boolean>(false);

  // When enabled or date changes, (add|update) the layer
  useEffect(() => {
    if (!map) return;
    if (!enabled) return;
    if (!isoDate) return;
    const cfg = getRasterLayer("sst");
    if (cfg) addOrUpdateRaster(map, cfg, { isoDate });
  }, [map, enabled, isoDate]);

  // When disabling, hide
  useEffect(() => {
    if (!map) return;
    if (!enabled) setRasterVisible(map, "sst", false);
  }, [map, enabled]);

  return (
    <div className="pointer-events-auto" style={{ position: "absolute", top: 8, right: 8, zIndex: 20 }}>
      <button
        onClick={() => setEnabled((v) => !v)}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.25)",
          background: enabled ? "rgba(0,150,255,0.85)" : "rgba(0,0,0,0.6)",
          color: "white",
          fontSize: 13,
          cursor: "pointer",
          backdropFilter: "blur(4px)",
        }}
        title="Toggle SST layer"
      >
        {enabled ? "SST: ON" : "SST: OFF"}
      </button>
    </div>
  );
}


