// src/store/appState.ts
import { create } from "zustand";
import { DEFAULT_INLET } from "@/lib/inlets";

type RasterId = "sst" | "sst_raw" | "chl" | "abfi" | null;

const todayISO = () => new Date().toISOString().slice(0, 10);

type AppState = {
  // state
  selectedInletId: string;
  isoDate: string;
  activeRaster: RasterId;
  username: string | null;
  _hydrated: boolean;
  communityBadge: boolean;

  // setters
  setSelectedInletId: (id: string | null | undefined) => void;
  setIsoDate: (d: string | null | undefined) => void;
  setActiveRaster: (id: RasterId) => void; // mutually exclusive by design
  setUsername: (u: string | null | undefined) => void;
  hydrateOnce: () => void;
  setCommunityBadge: (b: boolean) => void;
};

export const useAppState = create<AppState>((set, get) => ({
  // Defaults
  selectedInletId: DEFAULT_INLET.id, // <-- East Coast (overview)
  isoDate: todayISO(),
  activeRaster: null,
  username: null,
  _hydrated: false,
  communityBadge: false,

  // Setters
  setSelectedInletId: (id) =>
    set({ selectedInletId: id ?? DEFAULT_INLET.id }),

  setIsoDate: (d) =>
    set({ isoDate: d ?? todayISO() }),

  setActiveRaster: (id) =>
    set({ activeRaster: id ?? null }),

  setUsername: (u) => {
    const clean = (u ?? '').trim();
    set({ username: clean || null });
    try {
      if (typeof window !== 'undefined') {
        if (clean) localStorage.setItem('abfi_username', clean);
      }
    } catch {}
  },

  hydrateOnce: () => {
    if (get()._hydrated) return;
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('abfi_username');
        if (saved && saved.trim()) set({ username: saved.trim() });
      }
    } catch {}
    set({ _hydrated: true });
  },

  setCommunityBadge: (b) => set({ communityBadge: !!b }),
}));