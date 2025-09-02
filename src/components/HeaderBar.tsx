// src/components/HeaderBar.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useMapbox } from "@/lib/MapCtx";
import { INLETS, DEFAULT_INLET, getInletById } from "@/lib/inlets";
import { buildInletColorMap } from "@/lib/inletColors";
import { useAppState } from "@/store/appState";

/** Small helper for today's ISO (YYYY-MM-DD) */
const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * HeaderBar
 * - Inlet dropdown (flies map to selection)
 * - Date picker (writes to store)
 * - Exclusive layer toggles (SST / CHL / ABFI)
 */
const COLOR_MAP = buildInletColorMap(INLETS.map(i => i.id), {});

export default function HeaderBar() {
  const map = useMapbox();
  const {
    selectedInletId,
    setSelectedInletId,
    isoDate,
    setIsoDate,
    activeRaster,          // 'sst' | 'chl' | 'abfi' | null
    setActiveRaster,
  } = useAppState();

  const currentId = selectedInletId ?? DEFAULT_INLET.id;
  const activeInlet = useMemo(() => getInletById(currentId) ?? DEFAULT_INLET, [currentId]);
  const [legendOpen, setLegendOpen] = useState(false);

  // Keep a local input mirror for date (optional—can write straight to store)
  const [localDate, setLocalDate] = useState<string>(isoDate || todayISO());

  useEffect(() => {
    if (!isoDate) setIsoDate(todayISO());
    else if (isoDate !== localDate) setLocalDate(isoDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isoDate]);

  const onChangeInlet = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || DEFAULT_INLET.id;
    if (id === selectedInletId) return; // no-op if unchanged
    const inlet = getInletById(id) ?? DEFAULT_INLET;
    console.log("[HeaderBar] inlet change:", id, inlet);
    setSelectedInletId(inlet.id);
  };

  // Ensure map is positioned once on mount (helpful during debugging)
  useEffect(() => {
    if (!map) return;
    const inlet = getInletById(currentId) ?? DEFAULT_INLET;
    // Do not animate here; MapShell handles authoritative fly on changes
    map.jumpTo({ center: inlet.center, zoom: inlet.zoom });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  const onChangeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    setLocalDate(d);
    setIsoDate(d);
  };

  // One-at-a-time layer selection
  const toggleLayer = (id: "sst" | "chl" | "abfi") => {
    setActiveRaster(activeRaster === id ? null : id);
  };

  return (
    <div className="pointer-events-auto z-40 flex flex-wrap items-center gap-2 rounded-md bg-black/50 px-3 py-2 text-white backdrop-blur">
      {/* Inlet select */}
      <select
        id="inlet-select"
        value={activeInlet.id}
        onChange={onChangeInlet}
        className="rounded bg-black/60 px-2 py-1 outline-none ring-1 ring-white/10 focus:ring-cyan-400/60"
      >
        {INLETS.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>

      {/* Selected inlet swatch */}
      <span
        className="inline-block h-4 w-4 rounded-full border border-white/40"
        style={{ backgroundColor: COLOR_MAP[activeInlet.id] ?? '#343A40' }}
        title="Inlet color"
      />

      <button
        type="button"
        onClick={() => setLegendOpen(v => !v)}
        className="rounded-md bg-black/60 text-white/90 px-2 py-1 text-xs border border-white/15 hover:bg-black/70"
      >
        Colors
      </button>

      {legendOpen && (
        <div className="absolute mt-10 left-0 max-h-64 w-72 overflow-auto rounded-md border border-white/15 bg-black/80 p-2 backdrop-blur z-50">
          <div className="mb-1 text-xs text-white/60">Inlet Colors</div>
          <ul className="space-y-1">
            {INLETS.map((i) => (
              <li key={i.id} className="flex items-center gap-2 text-xs text-white/90">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full border border-white/40"
                  style={{ backgroundColor: COLOR_MAP[i.id] ?? '#343A40' }}
                />
                <span>{i.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Date picker */}
      <label className="ml-3 mr-1 text-xs opacity-80" htmlFor="date-input">
        Date
      </label>
      <input
        id="date-input"
        type="date"
        value={localDate}
        onChange={onChangeDate}
        className="rounded bg-black/60 px-2 py-1 outline-none ring-1 ring-white/10 focus:ring-cyan-400/60"
      />

      {/* Divider */}
      <span className="mx-2 h-5 w-px bg-white/15" />

      {/* Layer toggles (exclusive) */}
      <span className="text-xs opacity-80">Layers</span>
      <ToggleButton
        label="SST"
        active={activeRaster === "sst"}
        onClick={() => toggleLayer("sst")}
      />
      <ToggleButton
        label="CHL"
        active={activeRaster === "chl"}
        onClick={() => toggleLayer("chl")}
      />
      <ToggleButton
        label="ABFI"
        active={activeRaster === "abfi"}
        onClick={() => toggleLayer("abfi")}
      />
    </div>
  );
}

/** A tiny button component for the layer toggles */
function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded px-3 py-1 text-sm font-medium transition",
        "ring-1 ring-white/10 hover:ring-cyan-300/50",
        active
          ? "bg-cyan-400 text-black shadow-[0_0_24px_rgba(0,221,235,0.35)]"
          : "bg-black/60 text-white hover:bg-black/50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}