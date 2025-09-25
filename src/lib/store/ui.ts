import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mode } from '@/types/domain';

interface UIState {
  // Core UI state
  mode: Mode;
  selectedInletId: string | null;
  selectedDate: string; // ISO date
  
  // Layer toggles
  layers: {
    sst: boolean;
    chl: boolean;
    bathymetry: boolean;
    vessels: boolean;
    bites: boolean;
  };
  
  // Feature toggles
  features: {
    recBoatsOn: boolean;
    gfwOn: boolean;
    myTracksOn: boolean;
  };
  
  // Actions
  setMode: (mode: Mode) => void;
  setInletId: (id: string | null) => void;
  setDate: (date: string) => void;
  toggleLayer: (layer: keyof UIState['layers']) => void;
  toggleFeature: (feature: keyof UIState['features']) => void;
  reset: () => void;
}

const getDefaultDate = () => new Date().toISOString().slice(0, 10);

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      mode: 'analysis',
      selectedInletId: null,
      selectedDate: getDefaultDate(),
      
      layers: {
        sst: false,
        chl: false,
        bathymetry: false,
        vessels: false,
        bites: false,
      },
      
      features: {
        recBoatsOn: false,
        gfwOn: false,
        myTracksOn: false,
      },
      
      // Actions
      setMode: (mode) => set({ mode }),
      setInletId: (id) => set({ selectedInletId: id }),
      setDate: (date) => set({ selectedDate: date }),
      
      toggleLayer: (layer) => set((state) => ({
        layers: {
          ...state.layers,
          [layer]: !state.layers[layer]
        }
      })),
      
      toggleFeature: (feature) => set((state) => ({
        features: {
          ...state.features,
          [feature]: !state.features[feature]
        }
      })),
      
      reset: () => set({
        mode: 'analysis',
        selectedInletId: null,
        selectedDate: getDefaultDate(),
        layers: {
          sst: false,
          chl: false,
          bathymetry: false,
          vessels: false,
          bites: false,
        },
        features: {
          recBoatsOn: false,
          gfwOn: false,
          myTracksOn: false,
        }
      })
    }),
    {
      name: 'abfi-ui-state',
      partialize: (state) => ({
        selectedInletId: state.selectedInletId,
        layers: state.layers,
        features: state.features,
      })
    }
  )
);
