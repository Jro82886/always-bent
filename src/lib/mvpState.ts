import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type Mode = 'analysis' | 'tracking' | 'chat';
export type Day = 'latest' | 'today' | '-1d' | '-2d' | '-3d';

type SnipBox = {
  west: number;
  south: number; 
  east: number;
  north: number;
} | null;

interface MVPState {
  // Core navigation
  mode: Mode;
  inletId: string | null;
  
  // Analysis
  sstOn: boolean;
  polygonsOn: boolean;
  opacity: number; // 0..1
  day: Day;
  iso: string; // resolved ISO date
  snipOn: boolean;
  snipBox: SnipBox;
  
  // Tracking
  recBoatsOn: boolean;
  gfwOn: boolean;
  
  // UI
  loading: boolean;
  error?: string;
  
  // Actions
  setMode: (mode: Mode) => void;
  setInletId: (id: string | null) => void;
  setSstOn: (on: boolean) => void;
  setPolygonsOn: (on: boolean) => void;
  setOpacity: (opacity: number) => void;
  setDay: (day: Day) => void;
  setSnipOn: (on: boolean) => void;
  setSnipBox: (box: SnipBox) => void;
  setRecBoatsOn: (on: boolean) => void;
  setGfwOn: (on: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
}

// Resolve day to ISO string
function resolveDay(day: Day): string {
  if (day === 'latest') return 'latest';
  const d = new Date();
  const offset = { today: 0, '-1d': 1, '-2d': 2, '-3d': 3 }[day] ?? 0;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

export const useMVPState = create<MVPState>()(
  subscribeWithSelector((set, get) => ({
    // Defaults
    mode: 'analysis',
    inletId: 'overview', // East Coast overview
    
    // Analysis defaults
    sstOn: false,
    polygonsOn: true,
    opacity: 0.85,
    day: 'latest',
    iso: 'latest',
    snipOn: false,
    snipBox: null,
    
    // Tracking defaults
    recBoatsOn: false,
    gfwOn: false,
    
    // UI
    loading: false,
    error: undefined,
    
    // Actions
    setMode: (mode) => set({ mode }),
    setInletId: (inletId) => set({ inletId }),
    setSstOn: (sstOn) => set({ sstOn }),
    setPolygonsOn: (polygonsOn) => set({ polygonsOn }),
    setOpacity: (opacity) => set({ opacity }),
    setDay: (day) => {
      const iso = resolveDay(day);
      set({ day, iso });
    },
    setSnipOn: (snipOn) => set({ snipOn }),
    setSnipBox: (snipBox) => set({ snipBox }),
    setRecBoatsOn: (recBoatsOn) => set({ recBoatsOn }),
    setGfwOn: (gfwOn) => set({ gfwOn }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }))
);

// Initialize with proper ISO
useMVPState.getState().setDay('latest');
