// src/components/HeaderBar.tsx
"use client";

import { useEffect, useState } from "react";
import { INLETS, DEFAULT_INLET } from "@/lib/inlets";
import { useAppState } from "@/store/appState";

/** Small helper for today's ISO (YYYY-MM-DD) */
const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * HeaderBar
 * - Inlet dropdown (flies map to selection)
 * - Date picker (writes to store)
 * - Exclusive layer toggles (SST / CHL / ABFI)
 */
export default function HeaderBar() {
  const {
    selectedInletId,
    setSelectedInletId,
    isoDate,
    setIsoDate,
    activeRaster,          // 'sst' | 'chl' | 'abfi' | null
    setActiveRaster,
  } = useAppState();

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
    setSelectedInletId(id);
  };

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
      <label className="mr-1 text-xs opacity-80" htmlFor="inlet-select">
        Inlet
      </label>
      <select
        id="inlet-select"
        value={selectedInletId || DEFAULT_INLET.id}
        onChange={onChangeInlet}
        className="rounded bg-black/60 px-2 py-1 outline-none ring-1 ring-white/10 focus:ring-cyan-400/60"
      >
        {INLETS.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>

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