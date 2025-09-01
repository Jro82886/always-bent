import type mapboxgl from "mapbox-gl";
import type { RasterLayerDef } from "./index";

function srcId(id: string) { return `${id}-src`; }
function lyrId(id: string) { return `${id}-lyr`; }

export function addOrReplaceRaster(map: mapboxgl.Map, def: RasterLayerDef, date?: string) {
  const url = def.url.includes("{DATE}") ? def.url.replace("{DATE}", date ?? "") : def.url;

  if (map.getLayer(lyrId(def.id))) map.removeLayer(lyrId(def.id));
  if (map.getSource(srcId(def.id))) map.removeSource(srcId(def.id));

  map.addSource(srcId(def.id), {
    type: "raster",
    tiles: [url],
    tileSize: 256,
  } as any);

  map.addLayer({
    id: lyrId(def.id),
    type: "raster",
    source: srcId(def.id),
    minzoom: def.minzoom,
    maxzoom: def.maxzoom,
    layout: { visibility: def.visible === false ? "none" : "visible" },
    paint: { "raster-opacity": def.opacity ?? 1 },
  });
}

export function setLayerVisible(map: mapboxgl.Map, id: string, visible: boolean) {
  const idL = lyrId(id);
  if (map.getLayer(idL)) map.setLayoutProperty(idL, "visibility", visible ? "visible" : "none");
}

export function setLayerOpacity(map: mapboxgl.Map, id: string, opacity: number) {
  const idL = lyrId(id);
  if (map.getLayer(idL)) map.setPaintProperty(idL, "raster-opacity", opacity);
}

/**
 * Make only one of the provided layer ids visible at a time.
 * Expects real Mapbox layer ids (use your own ids or call `lyrId(id)` beforehand).
 */
export function setOnlyLayer(map: mapboxgl.Map, targetLayerId: string, layerIds: string[]) {
  layerIds.forEach((id) => {
    const visibility = id === targetLayerId ? "visible" : "none";
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility);
  });
}


