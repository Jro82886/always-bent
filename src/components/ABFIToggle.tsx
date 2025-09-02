"use client";

import { useEffect, useState } from "react";
import { useMapbox } from "@/lib/MapCtx";
import { useAppState } from "@/store/appState";
import { addOrUpdateRaster, setRasterVisible, getRasterLayer } from "@/lib/layers";

export default function ABFIToggle() {
  const map = useMapbox();
  const { isoDate } = useAppState();
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!map) return;
    if (on) {
      const cfg = getRasterLayer("abfi");
      if (cfg) addOrUpdateRaster(map, cfg, { isoDate });
    }
    setRasterVisible(map, "abfi", on);
  }, [map, on, isoDate]);

  return (
    <button
      className={`px-3 py-1 rounded text-sm font-medium border ${on ? "bg-cyan-600 text-white border-cyan-700" : "bg-white/90 text-cyan-700 border-cyan-400"}`}
      onClick={() => setOn(v => !v)}
      title="Toggle ABFI layer"
    >
      ABFI {on ? "On" : "Off"}
    </button>
  );
}


