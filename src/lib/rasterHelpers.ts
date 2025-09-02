import type mapboxgl from "mapbox-gl";

export function ensureRasterLayer(
  map: mapboxgl.Map,
  id: string,
  tiles: string[],
  opts?: {
    tileSize?: number;
    opacity?: number;
    minzoom?: number;
    maxzoom?: number;
    attribution?: string;
  }
) {
  const sourceId = `${id}-src`;
  const {
    tileSize = 256,
    opacity = 1,
    minzoom = 0,
    maxzoom = 22,
    attribution = "",
  } = opts || {};

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "raster",
      tiles,
      tileSize,
      attribution,
    } as any);
  }

  if (!map.getLayer(id)) {
    map.addLayer({
      id,
      type: "raster",
      source: sourceId,
      minzoom,
      maxzoom,
      paint: { "raster-opacity": opacity },
    });
  } else {
    map.setPaintProperty(id, "raster-opacity", opacity);
  }
}

export function removeRasterLayer(map: mapboxgl.Map, id: string) {
  const sourceId = `${id}-src`;
  if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}


