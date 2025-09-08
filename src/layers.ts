import type mapboxgl from "mapbox-gl";

/** ====== Config (swap URLs later) ====== */
const SST_SOURCE_ID = "sst-src";
const SST_LAYER_ID = "sst-layer";
const CHL_SOURCE_ID = "chl-src";
const CHL_LAYER_ID = "chl-layer";
const ABFI_SOURCE_ID = "abfi-src";
const ABFI_LAYER_ID = "abfi-layer";

/** WMTS via local proxy for SST */
const TILES_BASE = process.env.NEXT_PUBLIC_TILES_BASE || "/api/tiles";
const SST_XYZ = `${TILES_BASE}/sst/{z}/{x}/{y}.png?time={DATE}`;
const CHL_XYZ = "https://example.invalid/chl/{DATE}/{z}/{x}/{y}.png"; // placeholder
const ABFI_XYZ = "http://localhost:3001/tiles/abfi/{z}/{x}/{y}.png"; // local dev

/** Shared helpers */
function dateStr(isoDate?: string | null) {
  return (isoDate ?? new Date().toISOString()).slice(0, 10);
}

function ensureRasterSource(
  map: mapboxgl.Map,
  id: string,
  url: string,
  options?: { tileSize?: number }
) {
  if (!map.getSource(id)) {
    map.addSource(id, {
      type: "raster",
      tiles: [url],
      tileSize: options?.tileSize ?? 256,
    } as any);
  } else {
    // If already exists, update tiles array if it changed
    const s = map.getSource(id) as any; // RasterTileSource
    if (s.tiles && s.tiles[0] !== url) {
      map.removeSource(id);
      map.addSource(id, {
        type: "raster",
        tiles: [url],
        tileSize: options?.tileSize ?? 256,
      } as any);
    }
  }
}

function ensureRasterLayer(
  map: mapboxgl.Map,
  layerId: string,
  sourceId: string,
  opts?: { opacity?: number; minzoom?: number; maxzoom?: number }
) {
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: "raster",
      source: sourceId,
      paint: { "raster-opacity": opts?.opacity ?? 0.85 },
      minzoom: opts?.minzoom ?? 0,
      maxzoom: opts?.maxzoom ?? 10,
    } as any);
  }
}

/** ====== SST ====== */
export function addOrUpdateSST(map: mapboxgl.Map, isoDate?: string | null) {
  const url = SST_XYZ.replace("{DATE}", dateStr(isoDate));
  if (!url || !/^https?:\/\//.test(url)) return;
  ensureRasterSource(map, SST_SOURCE_ID, url);
  ensureRasterLayer(map, SST_LAYER_ID, SST_SOURCE_ID, { maxzoom: 10 });
}

export function setSSTVisibility(map: mapboxgl.Map, visible: boolean) {
  if (map.getLayer(SST_LAYER_ID)) {
    map.setLayoutProperty(SST_LAYER_ID, "visibility", visible ? "visible" : "none");
  }
}

export function removeSST(map: mapboxgl.Map) {
  if (map.getLayer(SST_LAYER_ID)) map.removeLayer(SST_LAYER_ID);
  if (map.getSource(SST_SOURCE_ID)) map.removeSource(SST_SOURCE_ID);
}

/** ====== CHL (chlorophyll) ====== */
export function addOrUpdateCHL(map: mapboxgl.Map, isoDate?: string | null) {
  const url = CHL_XYZ.replace("{DATE}", dateStr(isoDate));
  if (!url || !/^https?:\/\//.test(url)) return;
  ensureRasterSource(map, CHL_SOURCE_ID, url);
  ensureRasterLayer(map, CHL_LAYER_ID, CHL_SOURCE_ID, { opacity: 0.85 });
}

export function setCHLVisibility(map: mapboxgl.Map, visible: boolean) {
  if (map.getLayer(CHL_LAYER_ID)) {
    map.setLayoutProperty(CHL_LAYER_ID, "visibility", visible ? "visible" : "none");
  }
}

export function removeCHL(map: mapboxgl.Map) {
  if (map.getLayer(CHL_LAYER_ID)) map.removeLayer(CHL_LAYER_ID);
  if (map.getSource(CHL_SOURCE_ID)) map.removeSource(CHL_SOURCE_ID);
}

/** ====== ABFI ====== */
export function addOrUpdateABFI(map: mapboxgl.Map, isoDate?: string | null) {
  const url = ABFI_XYZ.replace("{DATE}", dateStr(isoDate));
  if (!url || !/^https?:\/\//.test(url)) return;
  ensureRasterSource(map, ABFI_SOURCE_ID, url);
  ensureRasterLayer(map, ABFI_LAYER_ID, ABFI_SOURCE_ID, { opacity: 0.85 });
}

export function setABFIVisibility(map: mapboxgl.Map, visible: boolean) {
  if (map.getLayer(ABFI_LAYER_ID)) {
    map.setLayoutProperty(ABFI_LAYER_ID, "visibility", visible ? "visible" : "none");
  }
}

export function removeABFI(map: mapboxgl.Map) {
  if (map.getLayer(ABFI_LAYER_ID)) map.removeLayer(ABFI_LAYER_ID);
  if (map.getSource(ABFI_SOURCE_ID)) map.removeSource(ABFI_SOURCE_ID);
}

// Re-export registry so `import { RASTER_LAYERS } from "@/layers"` works
export { RASTER_LAYERS } from "./layers/index";


