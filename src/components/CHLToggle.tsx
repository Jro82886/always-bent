"use client";

import { useEffect, useState } from "react";
import { useMapbox } from "@/lib/MapCtx";
import { useAppState } from "@/store/appState";
import { addOrUpdateCHL, setCHLVisibility } from "@/layers";

export default function CHLToggle() {
  const map = useMapbox();
  const { isoDate } = useAppState();
  const [on, setOn] = useState(false);

  // keep layer in sync with date & toggle
  useEffect(() => {
    if (!map) return;
    if (on) addOrUpdateCHL(map, isoDate);
    setCHLVisibility(map, on);
  }, [map, on, isoDate]);

  return (
    <button
      className={`px-3 py-1 rounded text-sm font-medium border ${on ? "bg-emerald-600 text-white border-emerald-700" : "bg-white/90 text-emerald-700 border-emerald-400"}`}
      onClick={() => setOn(v => !v)}
      title="Toggle Chlorophyll layer"
    >
      CHL {on ? "On" : "Off"}
    </button>
  );
}


