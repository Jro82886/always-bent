import type { PersistentBundle } from './persistLayers';

export const OVERVIEW_GEOJSON_URL = '/abfi_sst_edges_latest.geojson';

export const overviewBundle: PersistentBundle = {
  sourceId: 'abfi-overview-src',
  source: {
    type: 'geojson',
    data: OVERVIEW_GEOJSON_URL,
    generateId: true,
  },
  layers: [
    {
      id: 'abfi-overview-fill',
      type: 'fill',
      source: 'abfi-overview-src',
      paint: {
        'fill-color': ['match', ['get','class'], 'filament', '#00DDEB', 'eddy', '#E879F9', '#F59E0B'],
        'fill-opacity': 0.12,
      },
    },
    {
      id: 'abfi-overview-outline',
      type: 'line',
      source: 'abfi-overview-src',
      paint: {
        'line-color': ['match', ['get','class'], 'filament', '#06B6D4', 'eddy', '#D946EF', '#F59E0B'],
        'line-width': 1.4,
        'line-opacity': 0.65,
      },
    },
  ],
};

export const sstBundle = (timeISO: string): PersistentBundle => ({
  sourceId: 'abfi-sst-src',
  source: {
    type: 'raster',
    tiles: [
      `${process.env.NEXT_PUBLIC_ABFI_ORIGIN ?? ''}/api/tiles/sst/{z}/{x}/{y}.png?time=${encodeURIComponent(timeISO)}&style=default`,
    ],
    tileSize: 256,
  },
  layers: [
    {
      id: 'abfi-sst-layer',
      type: 'raster',
      source: 'abfi-sst-src',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 0.55 },
    },
  ],
});


