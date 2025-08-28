'use client';

import { create } from 'zustand';
import { INLETS, DEFAULT_INLET } from '@/lib/inlets';

export type AppTab = 'imagery' | 'analysis' | 'community' | 'gfw' | 'reports';
export type OverlayLayer = 'sst' | 'chlorophyll' | null;
type BBox = [number, number, number, number] | null;
export type LatLon = { lat: number; lon: number };
export type CenterMode = 'offshore' | 'inlet';

type AppState = {
  activeTab: AppTab;
  setActiveTab: (t: AppTab) => void;

  username: string;
  setUsername: (u: string) => void;

  inletId: string;
  setInletId: (id: string) => void;

  // Analysis
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  activeLayer: OverlayLayer;
  setActiveLayer: (l: OverlayLayer) => void;

  bbox: BBox;
  setBbox: (b: BBox) => void;
  clearBbox: () => void;

  // Map view
  center: LatLon | null;
  setCenter: (c: LatLon | null) => void;
  zoom: number;
  setZoom: (z: number) => void;
  centerMode: CenterMode;
  setCenterMode: (m: CenterMode) => void;

  analysisText: string;
  setAnalysisText: (t: string) => void;
  clearAnalysis: () => void;

  // Imagery (separate state)
  imageryDate: string;
  setImageryDate: (d: string) => void;
  imageryActiveLayer: OverlayLayer;
  setImageryActiveLayer: (l: OverlayLayer) => void;

  // Community (for v2 mentions)
  unreadMentions: number;
  setUnreadMentions: (n: number | ((n: number) => number)) => void;
};

const today = new Date().toISOString().slice(0, 10);

export const useAppState = create<AppState>((set, get) => ({
  activeTab: 'analysis',
  setActiveTab: (t) => set({ activeTab: t }),

  username: '',
  setUsername: (u) => set({ username: u }),

  inletId: DEFAULT_INLET.id,
  setInletId: (id) => {
    const exists = INLETS.some((i) => i.id === id);
    set({ inletId: exists ? id : DEFAULT_INLET.id });
  },

  selectedDate: today,
  setSelectedDate: (d) => set({ selectedDate: d }),
  activeLayer: null,
  setActiveLayer: (l) => set({ activeLayer: l }),

  bbox: null,
  setBbox: (b) => set({ bbox: b }),
  clearBbox: () => set({ bbox: null }),

  // Map view defaults
  center: null,
  setCenter: (c) => set({ center: c }),
  zoom: 8,
  setZoom: (z) => set({ zoom: z }),
  centerMode: 'offshore',
  setCenterMode: (m) => set({ centerMode: m }),

  analysisText: '',
  setAnalysisText: (t) => set({ analysisText: t }),
  clearAnalysis: () => set({ analysisText: '' }),

  imageryDate: today,
  setImageryDate: (d) => set({ imageryDate: d }),
  imageryActiveLayer: null,
  setImageryActiveLayer: (l) => set({ imageryActiveLayer: l }),

  unreadMentions: 0,
  setUnreadMentions: (n) =>
    set((s) => ({ unreadMentions: typeof n === 'function' ? (n as any)(s.unreadMentions) : n })),
}));
