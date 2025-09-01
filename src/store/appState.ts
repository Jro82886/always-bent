// src/store/appState.ts
import { create } from "zustand";
import { DEFAULT_INLET } from "@/lib/inlets";

type RasterId = "sst" | "chl" | "abfi" | null;

const todayISO = () => new Date().toISOString().slice(0, 10);

type AppState = {
  // state
  selectedInletId: string;
  isoDate: string;
  activeRaster: RasterId;
  username: string | null;

  // setters
  setSelectedInletId: (id: string | null | undefined) => void;
  setIsoDate: (d: string | null | undefined) => void;
  setActiveRaster: (id: RasterId) => void; // mutually exclusive by design
  setUsername: (u: string | null | undefined) => void;
};

export const useAppState = create<AppState>((set) => ({
  // Defaults
  selectedInletId: DEFAULT_INLET.id, // <-- East Coast (overview)
  isoDate: todayISO(),
  activeRaster: null,
  username: null,

  // Setters
  setSelectedInletId: (id) =>
    set({ selectedInletId: id ?? DEFAULT_INLET.id }),

  setIsoDate: (d) =>
    set({ isoDate: d ?? todayISO() }),

  setActiveRaster: (id) =>
    set({ activeRaster: id ?? null }),

  setUsername: (u) =>
    set({ username: u ?? null }),
}));