/**
 * SnipTool State Management
 * Manages the state for the Analysis Snipping Tool
 */

import { create } from 'zustand';
import type { LayerStats } from '@/lib/analysis/pixel-extractor';

export interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  confidence: number;
  type: 'thermal_front' | 'eddy' | 'convergence' | 'chl_edge' | 'high_activity';
  title: string;
  factors: {
    sst?: { value: number; score: number };
    chl?: { value: number; score: number };
    gradient?: { value: number; score: number };
  };
}

export interface PolygonFeature {
  id: string;
  type: 'thermal_front' | 'eddy' | 'convergence' | 'chl_edge';
  geometry: GeoJSON.Polygon;
  properties: {
    strength: number;
    description: string;
    confidence: number;
  };
}

export interface VesselActivity {
  name: string;
  type: 'commercial' | 'recreational' | 'charter';
  lastSeen: string;
  position?: [number, number];
}

export interface SnipResults {
  // Ocean data statistics
  sst?: LayerStats;
  chl?: LayerStats;

  // Analysis features
  hotspots: Hotspot[];
  polygons: PolygonFeature[];

  // Vessel intelligence
  vessels: VesselActivity[];

  // Environmental data
  weather?: {
    windSpeed: number;
    windDirection: number;
    waveHeight: number;
    temperature: number;
  };

  // Metadata
  areaKm2: number;
  timestamp: string;
  dataQuality: 'high' | 'medium' | 'low';

  // Comprehensive analysis report (new)
  comprehensiveReport?: any; // SnipAnalysisReport
}

export interface CameraState {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

interface SnipState {
  // Drawing state
  isDrawing: boolean;
  drawStart: [number, number] | null;
  drawEnd: [number, number] | null;

  // Analysis state
  rectBbox: [[number, number], [number, number]] | null;
  polygon: GeoJSON.Feature<GeoJSON.Polygon> | null;
  cameraBefore: CameraState | null;

  // Processing state
  isAnalyzing: boolean;
  analysisProgress: number;

  // Results
  results: SnipResults | null;

  // UI state
  showModal: boolean;
  error: string | null;

  // Actions
  startDrawing: () => void;
  updateDrawing: (start: [number, number], end: [number, number]) => void;
  finishDrawing: (bbox: [[number, number], [number, number]], polygon: GeoJSON.Feature<GeoJSON.Polygon>) => void;

  startAnalysis: (camera: CameraState) => void;
  updateProgress: (progress: number) => void;
  finishAnalysis: (results: SnipResults) => void;

  showAnalysisModal: () => void;
  hideAnalysisModal: () => void;

  returnToOverview: () => void;
  clearSnip: () => void;

  setError: (error: string | null) => void;
}

export const useSnipStore = create<SnipState>((set, get) => ({
  // Initial state
  isDrawing: false,
  drawStart: null,
  drawEnd: null,

  rectBbox: null,
  polygon: null,
  cameraBefore: null,

  isAnalyzing: false,
  analysisProgress: 0,

  results: null,
  showModal: false,
  error: null,

  // Drawing actions
  startDrawing: () => {
    set({
      isDrawing: true,
      drawStart: null,
      drawEnd: null,
      error: null
    });
  },

  updateDrawing: (start, end) => {
    set({
      drawStart: start,
      drawEnd: end
    });
  },

  finishDrawing: (bbox, polygon) => {
    // Calculate area to ensure minimum size
    const [west, south, east, north] = [bbox[0][0], bbox[0][1], bbox[1][0], bbox[1][1]];
    const widthKm = calculateDistanceKm(south, west, south, east);
    const heightKm = calculateDistanceKm(south, west, north, west);
    const areaKm2 = widthKm * heightKm;

    if (areaKm2 < 10) {
      set({
        error: 'Area too small. Please draw a larger area (minimum 10 km²).',
        isDrawing: false
      });
      return;
    }

    set({
      isDrawing: false,
      rectBbox: bbox,
      polygon: polygon
    });
  },

  // Analysis actions
  startAnalysis: (camera) => {
    set({
      cameraBefore: camera,
      isAnalyzing: true,
      analysisProgress: 0,
      error: null
    });
  },

  updateProgress: (progress) => {
    set({ analysisProgress: progress });
  },

  finishAnalysis: (results) => {
    set({
      isAnalyzing: false,
      analysisProgress: 100,
      results: results,
      showModal: true // Auto-open modal when analysis completes
    });

    // Fire custom event for other components
    window.dispatchEvent(new CustomEvent('snip:complete', { detail: results }));
  },

  // Modal actions
  showAnalysisModal: () => {
    set({ showModal: true });
  },

  hideAnalysisModal: () => {
    set({ showModal: false });
  },

  // Navigation actions
  returnToOverview: () => {
    const state = get();
    if (state.cameraBefore) {
      // Fire event to restore camera
      window.dispatchEvent(new CustomEvent('snip:restore-camera', {
        detail: state.cameraBefore
      }));
    }
  },

  // Clear action
  clearSnip: () => {
    set({
      isDrawing: false,
      drawStart: null,
      drawEnd: null,
      rectBbox: null,
      polygon: null,
      cameraBefore: null,
      isAnalyzing: false,
      analysisProgress: 0,
      results: null,
      showModal: false,
      error: null
    });

    // Fire event to clear map overlays
    window.dispatchEvent(new CustomEvent('snip:clear'));
  },

  // Error handling
  setError: (error) => {
    set({
      error,
      isAnalyzing: false,
      analysisProgress: 0
    });
  }
}));

// Utility function to calculate distance
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Export helper to check if snipping is active
export const isSnipping = () => {
  const state = useSnipStore.getState();
  return state.isDrawing || state.isAnalyzing || state.rectBbox !== null;
};