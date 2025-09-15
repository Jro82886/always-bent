/**
 * Mode Manager - Handles state preservation when switching between Analysis/Tracking/Community
 * This ensures nothing breaks when switching tabs
 */

import type mapboxgl from 'mapbox-gl';

export type AppMode = 'analysis' | 'tracking' | 'community' | 'trends';

interface LayerState {
  id: string;
  visibility: 'visible' | 'none';
  opacity?: number;
  filter?: any[];
}

interface ModeState {
  layers: LayerState[];
  mapView?: {
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
  };
  activeTools?: string[];
}

class ModeManager {
  private currentMode: AppMode = 'analysis';
  private savedStates: Map<AppMode, ModeState> = new Map();
  private map: mapboxgl.Map | null = null;
  
  // Layers that belong to each mode
  private readonly modeLayers = {
    analysis: [
      'sst-lyr',
      'chl-lyr',
      'snip-rectangle-fill',
      'snip-rectangle-outline',
      'edge-lines',
      'hotspot-markers',
      'ocean-polygons',
      'bathymetry-contours',
      // All polygon layers
      'polygon-fills',
      'polygon-outlines',
      'polygon-labels',
      'sst-polygons',
      'chl-polygons',
      'edge-polygons',
      'temperature-fronts',
      'chlorophyll-edges'
    ],
    tracking: [
      'vessel-markers',
      'vessel-tracks',
      'fleet-vessels',
      'commercial-vessels',
      'ais-data',
      'tracking-zones'
    ],
    community: [
      'community-hotspots',
      'bite-reports',
      'shared-catches'
    ],
    trends: [
      'trend-heatmap',
      'historical-data'
    ]
  };
  
  /**
   * Initialize with map instance
   */
  setMap(map: mapboxgl.Map) {
    this.map = map;
    console.log('[ModeManager] Map instance set');
  }
  
  /**
   * Get current mode
   */
  getCurrentMode(): AppMode {
    return this.currentMode;
  }
  
  /**
   * Switch to a new mode
   */
  async switchMode(newMode: AppMode): Promise<void> {
    if (!this.map) {
      console.error('[ModeManager] No map instance');
      return;
    }
    
    if (newMode === this.currentMode) {
      console.log(`[ModeManager] Already in ${newMode} mode`);
      return;
    }
    
    console.log(`[ModeManager] Switching from ${this.currentMode} to ${newMode}`);
    
    // Step 1: Save current mode state
    this.saveCurrentState();
    
    // Step 2: Hide current mode layers
    this.hideModeLayers(this.currentMode);
    
    // Step 3: Update current mode
    const previousMode = this.currentMode;
    this.currentMode = newMode;
    
    // Step 4: Restore new mode state if it exists
    const savedState = this.savedStates.get(newMode);
    if (savedState) {
      this.restoreState(savedState);
    } else {
      // First time entering this mode
      this.showModeLayers(newMode);
    }
    
    // Step 5: Emit mode change event for components to react
    this.emitModeChange(previousMode, newMode);
  }
  
  /**
   * Save current state of the active mode
   */
  private saveCurrentState(): void {
    if (!this.map) return;
    
    const state: ModeState = {
      layers: [],
      mapView: {
        center: this.map.getCenter().toArray() as [number, number],
        zoom: this.map.getZoom(),
        bearing: this.map.getBearing(),
        pitch: this.map.getPitch()
      }
    };
    
    // Save visibility state of all layers for this mode
    const layers = this.modeLayers[this.currentMode] || [];
    layers.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        state.layers.push({
          id: layerId,
          visibility: this.map!.getLayoutProperty(layerId, 'visibility') || 'visible',
          opacity: this.map!.getPaintProperty(layerId, 'opacity') as number | undefined,
          filter: this.map!.getFilter(layerId)
        });
      }
    });
    
    this.savedStates.set(this.currentMode, state);
    console.log(`[ModeManager] Saved ${this.currentMode} state:`, state);
  }
  
  /**
   * Restore a saved state
   */
  private restoreState(state: ModeState): void {
    if (!this.map) return;
    
    console.log(`[ModeManager] Restoring state:`, state);
    
    // Restore layer states
    state.layers.forEach(layer => {
      if (this.map!.getLayer(layer.id)) {
        this.map!.setLayoutProperty(layer.id, 'visibility', layer.visibility);
        if (layer.opacity !== undefined) {
          this.map!.setPaintProperty(layer.id, 'opacity', layer.opacity);
        }
        if (layer.filter) {
          this.map!.setFilter(layer.id, layer.filter);
        }
      }
    });
    
    // Note: We don't restore map view to avoid jarring transitions
    // Users expect to stay at their current location
  }
  
  /**
   * Hide all layers for a mode
   */
  private hideModeLayers(mode: AppMode): void {
    if (!this.map) return;
    
    const layers = this.modeLayers[mode] || [];
    layers.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
    
    console.log(`[ModeManager] Hid ${mode} layers`);
  }
  
  /**
   * Show all layers for a mode
   */
  private showModeLayers(mode: AppMode): void {
    if (!this.map) return;
    
    const layers = this.modeLayers[mode] || [];
    layers.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        // Only show if it was visible before (check saved state)
        const savedState = this.savedStates.get(mode);
        const layerState = savedState?.layers.find(l => l.id === layerId);
        const visibility = layerState?.visibility || 'visible';
        this.map!.setLayoutProperty(layerId, 'visibility', visibility);
      }
    });
    
    console.log(`[ModeManager] Showed ${mode} layers`);
  }
  
  /**
   * Emit mode change event
   */
  private emitModeChange(from: AppMode, to: AppMode): void {
    const event = new CustomEvent('modechange', {
      detail: { from, to }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Force refresh current mode (useful after adding new layers)
   */
  refreshCurrentMode(): void {
    if (!this.map) return;
    this.showModeLayers(this.currentMode);
  }
  
  /**
   * Check if a layer belongs to current mode
   */
  isLayerInCurrentMode(layerId: string): boolean {
    const layers = this.modeLayers[this.currentMode] || [];
    return layers.includes(layerId);
  }
  
  /**
   * Register a new layer for a mode
   */
  registerLayer(mode: AppMode, layerId: string): void {
    if (!this.modeLayers[mode]) {
      this.modeLayers[mode] = [];
    }
    if (!this.modeLayers[mode].includes(layerId)) {
      this.modeLayers[mode].push(layerId);
      console.log(`[ModeManager] Registered ${layerId} for ${mode} mode`);
    }
  }
}

// Export singleton instance
export const modeManager = new ModeManager();

// Export hook for React components
export function useModeManager() {
  return modeManager;
}
