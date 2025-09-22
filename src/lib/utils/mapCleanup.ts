// Map cleanup utilities to prevent crashes on tab switch

import mapboxgl from 'mapbox-gl';

/**
 * Safely remove a map layer if it exists
 */
export function safeRemoveLayer(map: mapboxgl.Map | null, layerId: string) {
  if (!map) return;
  try {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  } catch (e) {
    console.warn(`Failed to remove layer ${layerId}:`, e);
  }
}

/**
 * Safely remove a map source if it exists
 */
export function safeRemoveSource(map: mapboxgl.Map | null, sourceId: string) {
  if (!map) return;
  try {
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  } catch (e) {
    console.warn(`Failed to remove source ${sourceId}:`, e);
  }
}

/**
 * Safely check if map is loaded and ready
 */
export function isMapReady(map: mapboxgl.Map | null): boolean {
  if (!map) return false;
  try {
    return map.loaded() && map.isStyleLoaded();
  } catch {
    return false;
  }
}

/**
 * Safely add event listener with cleanup
 */
export function safeMapListener(
  map: mapboxgl.Map | null,
  event: string,
  layerOrHandler: string | ((e: any) => void),
  handler?: (e: any) => void
): (() => void) | undefined {
  if (!map) return;
  
  try {
    if (typeof layerOrHandler === 'string' && handler) {
      // Layer-specific event
      map.on(event as any, layerOrHandler, handler);
      return () => {
        try {
          map.off(event as any, layerOrHandler, handler);
        } catch (e) {
          console.warn(`Failed to remove ${event} listener:`, e);
        }
      };
    } else if (typeof layerOrHandler === 'function') {
      // General event
      map.on(event as any, layerOrHandler);
      return () => {
        try {
          map.off(event as any, layerOrHandler);
        } catch (e) {
          console.warn(`Failed to remove ${event} listener:`, e);
        }
      };
    }
  } catch (e) {
    console.warn(`Failed to add ${event} listener:`, e);
  }
}

/**
 * Create abort controller with timeout
 */
export function createAbortController(timeoutMs: number = 30000): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

/**
 * Safe fetch with abort signal
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = createAbortController(timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Cleanup all map resources before unmounting
 */
export function cleanupMapResources(map: mapboxgl.Map | null) {
  if (!map) return;
  
  try {
    // Stop all animations
    map.stop();
    
    // Clear any popups
    const popups = document.querySelectorAll('.mapboxgl-popup');
    popups.forEach(p => p.remove());
    
    // Clear any markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(m => m.remove());
    
  } catch (e) {
    console.warn('Map cleanup error:', e);
  }
}
