'use client';
import { create } from 'zustand';

export const useCommunityStore = create<{
  tab: 'highlights' | 'mine';
  setTab: (t: 'highlights' | 'mine') => void;
  species: string; 
  setSpecies: (s: string) => void;
  dateRange: 'today' | '7d' | '14d'; 
  setDateRange: (r: 'today' | '7d' | '14d') => void;
}>((set) => ({
  tab: 'highlights',
  setTab: (t) => set({ tab: t }),
  species: 'all', 
  setSpecies: (s) => set({ species: s }),
  dateRange: 'today', 
  setDateRange: (r) => set({ dateRange: r }),
}));
