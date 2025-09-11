import mapboxgl from 'mapbox-gl';

export function setVis(map: mapboxgl.Map, layerId: string, on: boolean) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, 'visibility', on ? 'visible' : 'none');
  map.setPaintProperty(layerId, 'raster-opacity', 1);
  map.setLayerZoomRange(layerId, 0, 24);
}

export function toggle(map: mapboxgl.Map, layerId: string) {
  if (!map.getLayer(layerId)) return;
  const v = map.getLayoutProperty(layerId, 'visibility');
  setVis(map, layerId, v !== 'visible');
}
