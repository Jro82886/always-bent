// src/lib/layers.ts
// Raster layer registry + safe helpers: add/remove/show-only/refresh/date/move listeners.

import type mapboxgl from "mapbox-gl";

/* ---------------------------------- Types --------------------------------- */

export type RasterLayerId = "sst" | "chl" | "abfi";
// Compatibility alias per requested naming
export type RasterId = RasterLayerId;

export type RasterLayerConfig = {
  id: RasterLayerId;
  name: string;
  url: string;                 // may include {DATE} and/or {BBOX4326}
  opacity?: number;
  minzoom?: number;
  maxzoom?: number;
  tileSize?: 256 | 512;
};
// Compatibility alias per requested naming
export type RasterLayer = RasterLayerConfig;

export type LayerRuntime = {
  /** true if template includes {BBOX4326} (WMS-style) */
  needsBbox: boolean;
};

export type AddOptions = {
  isoDate?: string | null;
  visible?: boolean;
  opacity?: number;
  beforeId?: string;
};

/* ----------------------------- Layer registry ----------------------------- */
// TODO: replace placeholders with your production URLs
export const RASTER_LAYERS: RasterLayerConfig[] = [
  {
    id: "sst",
    name: "Sea Surface Temp (daily)",
    url: `${process.env.NEXT_PUBLIC_TILES_BASE ?? "/api/tiles"}/sst_daily/{z}/{x}/{y}.png?time={DATE}&style=default`,
    opacity: 0.85,
    minzoom: 0,
    maxzoom: 22, // allow display beyond WMTS matrix via upsampling
    tileSize: 256,
  },
  {
    id: "chl",
    name: "Chlorophyll (daily)",
    url: `${process.env.NEXT_PUBLIC_TILES_BASE ?? "/api/tiles"}/chl_daily/{z}/{x}/{y}.png?time={DATE}&style=default`,
    opacity: 0.85,
    minzoom: 0,
    maxzoom: 22,
    tileSize: 256,
  },
  {
    id: "abfi",
    name: "ABFI Hotspots",
    url: "http://localhost:3001/tiles/abfi/{z}/{x}/{y}.png",
    opacity: 0.85,
    minzoom: 0,
    maxzoom: 10,
    tileSize: 256,
  },
];

// Compatibility exports for components that import { LAYERS }
export const LAYERS: RasterLayerConfig[] = RASTER_LAYERS;
export const LAYER_BY_ID: Record<string, RasterLayerConfig> = Object.fromEntries(
  RASTER_LAYERS.map((l) => [l.id, l])
);
// Back-compat names used by some components
export const layers = RASTER_LAYERS;
export const layersById: Record<string, RasterLayerConfig> = LAYER_BY_ID;

/* ------------------------------- Lookups ---------------------------------- */

export function getRasterLayer(id: string): RasterLayerConfig | null {
  return RASTER_LAYERS.find(l => l.id === id) ?? null;
}

/* ---------------------------- URL expansion ------------------------------- */

const hasXYZ = (tpl: string) => tpl.includes("{z}") && tpl.includes("{x}") && tpl.includes("{y}");
const hasBBOX = (tpl: string) => tpl.includes("{BBOX4326}");

function expandUrlTemplate(
  template: string,
  { isoDate, bbox4326 }: { isoDate?: string | null; bbox4326?: string | null } = {}
): string {
  const date = (isoDate ?? "").trim();
  const bbox = (bbox4326 ?? "").trim();
  return template
    .replaceAll("{DATE}", date || "2025-08-30")
    .replaceAll("{BBOX4326}", bbox);
}

export function getBBOX4326(map: mapboxgl.Map): string {
  const b = map.getBounds();
  if (!b) return "";
  const sw = b.getSouthWest(); // lat,lng
  const ne = b.getNorthEast();
  // BBOX4326 expects minX,minY,maxX,maxY (lngLat order)
  return [sw.lng, sw.lat, ne.lng, ne.lat].join(",");
}

/* ------------------------- Id builders + guards --------------------------- */

const srcId = (id: string) => `src:${id}`;
const lyrId = (id: string) => `lyr:${id}`;

const sourceExists = (map: mapboxgl.Map, id: string) => !!(map as any).getSource(id);
const layerExists = (map: mapboxgl.Map, id: string) => !!map.getLayer(id);

const safe = <T>(fn: () => T): T | undefined => {
  try { return fn(); } catch (e) { console.warn(e); }
  return undefined;
};

/* --------------------------- Add / Remove helpers -------------------------- */

export function addOrUpdateRaster(
  map: mapboxgl.Map,
  cfg: RasterLayerConfig,
  opts: AddOptions & { bbox4326?: string | null } = {}
) {
  if (!map || !(map as any).loaded) {
    console.warn("addOrUpdateRaster: map not ready");
    return;
  }

  const sid = srcId(cfg.id);
  const lid = lyrId(cfg.id);
  const opacity = opts.opacity ?? cfg.opacity ?? 1;
  const visible = opts.visible !== false;

  // Rebuild source & layer to honor new tokens (DATE/BBOX)
  safe(() => layerExists(map, lid) && map.removeLayer(lid));
  safe(() => sourceExists(map, sid) && (map as any).removeSource(sid));

  const expanded = expandUrlTemplate(cfg.url, {
    isoDate: opts.isoDate,
    bbox4326: opts.bbox4326,
  });

  safe(() =>
    map.addSource(sid, {
      type: "raster",
      tiles: [expanded],
      tileSize: cfg.tileSize ?? 256,
    } as any)
  );

  safe(() =>
    map.addLayer(
      {
        id: lid,
        type: "raster",
        source: sid,
        minzoom: cfg.minzoom,
        maxzoom: cfg.maxzoom,
        layout: { visibility: visible ? "visible" : "none" },
        paint: { "raster-opacity": opacity },
      },
      opts.beforeId
    )
  );
}

export function removeRaster(map: mapboxgl.Map, id: RasterLayerId) {
  const sid = srcId(id);
  const lid = lyrId(id);
  safe(() => layerExists(map, lid) && map.removeLayer(lid));
  safe(() => sourceExists(map, sid) && (map as any).removeSource(sid));
}

export function setRasterVisible(map: mapboxgl.Map, id: RasterLayerId, visible: boolean) {
  const lid = lyrId(id);
  if (!layerExists(map, lid)) return;
  safe(() => map.setLayoutProperty(lid, "visibility", visible ? "visible" : "none"));
}

export function setRasterOpacity(map: mapboxgl.Map, id: RasterLayerId, opacity: number) {
  const lid = lyrId(id);
  if (!layerExists(map, lid)) return;
  safe(() => map.setPaintProperty(lid, "raster-opacity", opacity));
}

/** Turn ONE layer on and make all the others off (mutual exclusivity). */
export function showOnly(
  map: mapboxgl.Map,
  idToShow: RasterLayerId,
  opts: { isoDate?: string | null; bbox4326?: string | null } = {}
) {
  for (const cfg of RASTER_LAYERS) {
    if (cfg.id === idToShow) {
      if (!layerExists(map, lyrId(cfg.id))) {
        addOrUpdateRaster(map, cfg, { ...opts, visible: true });
      } else {
        setRasterVisible(map, cfg.id, true);
        // if visible and url needs tokens, refresh in place:
        if (cfg.url.includes("{DATE}") || cfg.url.includes("{BBOX4326}")) {
          addOrUpdateRaster(map, cfg, { ...opts, visible: true });
        }
      }
    } else {
      setRasterVisible(map, cfg.id, false);
    }
  }
}

/** Rebuild a visible layer on date change (keeps visibility state). */
export function refreshOnDate(
  map: mapboxgl.Map,
  id: RasterLayerId,
  isoDate: string,
  bbox4326?: string | null
) {
  const cfg = getRasterLayer(id);
  if (!cfg) return;
  const lid = lyrId(id);
  const vis = map.getLayoutProperty(lid, "visibility") as any;
  const wasVisible = layerExists(map, lid) && vis !== "none";
  addOrUpdateRaster(map, cfg, { isoDate, bbox4326: bbox4326 ?? null, visible: wasVisible });
}

/* ---------------------------- Moveend listener ---------------------------- */

export function needsBbox(id: RasterLayerId): LayerRuntime {
  const cfg = getRasterLayer(id);
  return { needsBbox: !!cfg && hasBBOX(cfg.url) && !hasXYZ(cfg.url) };
}

/** Attach a debounced moveend listener that refreshes the visible layer’s bbox. */
export function wireMoveRefresh(
  map: mapboxgl.Map,
  id: RasterLayerId,
  isoDate: string | null,
  setUnwireRef: (fn: (() => void) | null) => void
) {
  const cfg = getRasterLayer(id);
  if (!cfg) return;
  if (!hasBBOX(cfg.url)) { setUnwireRef(null); return; }

  let t: any = null;
  const handler = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const bbox = getBBOX4326(map);
      refreshOnDate(map, id, isoDate ?? "", bbox);
    }, 200);
  };

  map.on("moveend", handler);
  setUnwireRef(() => () => {
    clearTimeout(t);
    map.off("moveend", handler);
  });

  // do one initial refresh so first view is correct
  const bbox = getBBOX4326(map);
  refreshOnDate(map, id, isoDate ?? "", bbox);
}
