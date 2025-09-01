"use client";

import { useAppState } from "@/store/appState";
import { getInletById } from "@/lib/inlets";

export default function StatusPill() {
  const { selectedInletId, isoDate } = useAppState();
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;

  return (
    <div
      className="pointer-events-none absolute bottom-3 right-3 bg-black/60 text-white text-xs rounded px-2 py-1"
    >
      <span className="opacity-90">
        {inlet ? inlet.name : "Overview"} • {isoDate?.slice(0, 10)}
      </span>
    </div>
  );
}


