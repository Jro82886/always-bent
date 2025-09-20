// src/store/appState.ts
import { create } from "zustand";
import { DEFAULT_INLET } from "@/lib/inlets";

type RasterId = "sst" | "chl" | "abfi" | null;
type AppMode = 'analysis' | 'community' | 'browse';

const todayISO = () => new Date().toISOString().slice(0, 10);

type AppState = {
  // state
  selectedInletId: string;
  isoDate: string;
  activeRaster: RasterId;
  username: string | null;
  _hydrated: boolean;
  communityBadge: boolean;
  appMode: AppMode;

  // setters
  setSelectedInletId: (id: string | null | undefined) => void;
  setIsoDate: (d: string | null | undefined) => void;
  setActiveRaster: (id: RasterId) => void; // mutually exclusive by design
  setUsername: (u: string | null | undefined) => void;
  hydrateOnce: () => void;
  setCommunityBadge: (b: boolean) => void;
  setAppMode: (mode: AppMode) => void;
};

export const useAppState = create<AppState>((set, get) => ({
  // Defaults
  selectedInletId: DEFAULT_INLET.id, // <-- East Coast (overview)
  isoDate: todayISO(),
  activeRaster: null,
  username: null,
  _hydrated: false,
  communityBadge: false,
  appMode: 'analysis' as AppMode, // Default to solo mode

  // Setters
  setSelectedInletId: (id) => {
    const inletId = id ?? DEFAULT_INLET.id;
    set({ selectedInletId: inletId });
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('abfi_selected_inlet', inletId);
      }
    } catch {}
  },

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
        // Hydrate username
        const savedUsername = localStorage.getItem('abfi_username');
        if (savedUsername && savedUsername.trim()) {
          set({ username: savedUsername.trim() });
        }
        
        // Hydrate inlet selection
        const savedInlet = localStorage.getItem('abfi_selected_inlet');
        if (savedInlet) {
          set({ selectedInletId: savedInlet });
        }
        
        // Hydrate app mode
        const savedMode = localStorage.getItem('abfi_app_mode') as AppMode;
        if (savedMode && ['analysis', 'community', 'browse'].includes(savedMode)) {
          set({ appMode: savedMode });
        }
      }
    } catch {}
    set({ _hydrated: true });
  },

  setCommunityBadge: (b) => set({ communityBadge: !!b }),
  
  setAppMode: (mode) => {
    set({ appMode: mode });
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('abfi_app_mode', mode);
      }
    } catch {}
  },
}));