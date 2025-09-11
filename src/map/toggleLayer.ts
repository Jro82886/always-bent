import mapboxgl from 'mapbox-gl';

export function setLayerVisible(map: mapboxgl.Map, layerId: string, on: boolean) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, 'visibility', on ? 'visible' : 'none');
  map.setPaintProperty(layerId, 'raster-opacity', 1);
}
