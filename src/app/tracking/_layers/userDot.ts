import type mapboxgl from 'mapbox-gl';

const SOURCE_ID = 'tracking-users';
const USER_LAYER = 'tracking-user-dots';
const USER_LABEL = 'tracking-user-labels';

export function upsertTrackingSource(map: mapboxgl.Map, features: any[]) {
  const data = { type: 'FeatureCollection', features } as any;
  const src = map.getSource(SOURCE_ID) as any;
  if (src?.setData) src.setData(data);
  else map.addSource(SOURCE_ID, { type: 'geojson', data } as any);
}

export function ensureTrackingLayers(map: mapboxgl.Map) {
  if (!map.getLayer(USER_LAYER)) {
    map.addLayer({
      id: USER_LAYER,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 5, 12, 10],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.9,
        'circle-blur': 0.6,
        'circle-stroke-color': '#0a0a0a',
        'circle-stroke-width': 1,
      },
      filter: ['==', ['get', 'type'], 'user'],
    } as any);
  }
  if (!map.getLayer(USER_LABEL)) {
    map.addLayer({
      id: USER_LABEL,
      type: 'symbol',
      source: SOURCE_ID,
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 11,
        'text-offset': [0, -1.6],
        'text-anchor': 'bottom',
      },
      paint: {
        'text-color': '#e5e7eb',
        'text-halo-color': '#0a0a0a',
        'text-halo-width': 1,
      },
      filter: ['==', ['get', 'type'], 'user'],
    } as any);
  }
}


