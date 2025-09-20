import type mapboxgl from 'mapbox-gl';
import type { BBox } from '@/types/tracking';

export function makeOffshoreFallbackBBox(center: [number, number]): BBox {
  const [lon, lat] = center;
  return [[lon - 0.6, lat - 0.6], [lon + 1.2, lat + 0.6]];
}

export function fitInletOffshore(map: mapboxgl.Map, center: [number, number], bbox?: BBox) {
  const wide = typeof window !== 'undefined' && window.innerWidth >= 1024;
  map.fitBounds(bbox ?? makeOffshoreFallbackBBox(center), {
    padding: wide
      ? { top: 40, right: 360, bottom: 40, left: 40 }
      : { top: 24, right: 24, bottom: 300, left: 24 },
    duration: 800,
  });
}

// Optional hand-tuned inlet views
export const INLET_VIEWS = {
  MONTAUK:        [[-73.95, 40.50], [-70.20, 41.60]],
  OCEAN_CITY:     [[-75.30, 38.10], [-72.40, 39.20]],
  HATTERAS:       [[-76.20, 34.80], [-72.80, 36.20]],
  JUPITER:        [[-80.50, 26.50], [-79.30, 27.40]],
} as const;
