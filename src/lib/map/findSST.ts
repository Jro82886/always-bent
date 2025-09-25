import type mapboxgl from 'mapbox-gl';

const SST_IDS = ['sst-lyr','sst-layer','raster-sst','sst-wmts']; // legacy fallbacks

export function resolveSSTLayer(map: mapboxgl.Map) {
  for (const id of SST_IDS) {
    const lyr = map.getLayer(id);
    if (!lyr) continue;
    const vis = map.getLayoutProperty(id, 'visibility') ?? 'visible';
    const op  = Number(map.getPaintProperty(id, 'raster-opacity') ?? 1);
    if (vis !== 'none' && op > 0.01) {
      const source = (lyr as any).source as string | undefined;
      return { id, source };
    }
  }
  return null;
}

// Temporary helper to find any SST layer ID (will be removed after canonicalization)
export function findSSTId(map: mapboxgl.Map) {
  return SST_IDS.find(id => !!map.getLayer(id)) ?? null;
}
