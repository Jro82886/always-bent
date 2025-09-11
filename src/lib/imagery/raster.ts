import type mapboxgl from 'mapbox-gl';

export function addOrReplaceRasterLayer(
  map: mapboxgl.Map,
  opts: { sourceId: string; layerId: string; tiles: string[]; tileSize: number; beforeId?: string }
) {
  const { sourceId, layerId, tiles, tileSize, beforeId } = opts;
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);

  map.addSource(sourceId, { type: 'raster', tiles, tileSize } as any);
  map.addLayer(
    { id: layerId, type: 'raster', source: sourceId, paint: { 'raster-opacity': 1 }, layout: { visibility: 'visible' } },
    beforeId
  );
  const top = map.getStyle().layers?.at(-1)?.id;
  if (top && top !== layerId) map.moveLayer(layerId, top);
}
