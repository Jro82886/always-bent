/**
 * Canonical layer IDs for the application.
 * This is the single source of truth for layer identifiers.
 */
export const LAYER_IDS = {
  sst: 'sst-lyr',
  chl: 'chl-lyr',
  ocean: 'ocean-layer',
  bathymetry: 'bathymetry',
  gfw: 'gfw-vessels-dots',
  fleetVessels: 'fleet-vessels',
  fleetTracks: 'fleet-tracks',
  overviewEdges: 'overview-edges-demo',
  snipOutline: 'snip-outline',
  snipOutlineFill: 'snip-outline-fill'
} as const;

// Type helper for layer IDs
export type LayerId = typeof LAYER_IDS[keyof typeof LAYER_IDS];

// Runtime assertion to ensure layer exists
export function assertLayerExists(map: mapboxgl.Map, layerId: LayerId, context?: string) {
  if (!map.getLayer(layerId)) {
    console.warn(`[ABFI] Missing layer id '${layerId}'${context ? ` in ${context}` : ''}`);
  }
}
