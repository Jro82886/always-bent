import type mapboxgl from 'mapbox-gl';

export const CANON_SST = 'sst-lyr';
const LEGACY = ['sst-layer','raster-sst','sst-wmts']; // temporary fallbacks

export function resolveSSTLayer(map: mapboxgl.Map) {
  // Try canonical first
  const canonLayer = map.getLayer(CANON_SST);
  if (canonLayer) {
    const vis = map.getLayoutProperty(CANON_SST, 'visibility') ?? 'visible';
    const op = Number(map.getPaintProperty(CANON_SST, 'raster-opacity') ?? 1);
    console.log('[SST] Canon layer found:', { id: CANON_SST, vis, op });
    if (vis !== 'none' && op > 0.01) {
      const source = (canonLayer as any).source as string | undefined;
      return { id: CANON_SST, source };
    }
  }
  
  // Check legacy IDs
  for (const id of LEGACY) {
    const lyr = map.getLayer(id);
    if (!lyr) continue;
    const vis = map.getLayoutProperty(id, 'visibility') ?? 'visible';
    const op = Number(map.getPaintProperty(id, 'raster-opacity') ?? 1);
    console.log('[SST] Legacy layer found:', { id, vis, op });
    if (vis !== 'none' && op > 0.01) {
      const source = (lyr as any).source as string | undefined;
      return { id, source };
    }
  }
  
  console.log('[SST] No visible SST layer found');
  return null;
}

// Temporary helper to find any SST layer ID (will be removed after canonicalization)
export function findSSTId(map: mapboxgl.Map) {
  const ALL_SST_IDS = [CANON_SST, ...LEGACY];
  return ALL_SST_IDS.find(id => !!map.getLayer(id)) ?? null;
}
