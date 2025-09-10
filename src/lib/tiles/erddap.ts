type BuildParams = {
  base: string;           // e.g. ABFI_SST_WMS_BASE
  layer: string;          // e.g. jplMURSST41:analysed_sst
  version: string;        // 1.3.0
  styles: string;         // boxfill/rainbow
  bbox: readonly [number, number, number, number];
  width?: number;         // default 256
  height?: number;        // default 256
  timeISO?: string;       // e.g. 2025-09-03
};

export function buildErddapGetMapURL(p: BuildParams) {
  const {
    base, layer, version, styles, bbox,
    width = 256, height = 256, timeISO
  } = p;

  const params = new URLSearchParams();
  params.set("service", "WMS");
  params.set("request", "GetMap");
  params.set("version", version);
  params.set("layers", layer);
  params.set("styles", styles);
  params.set("format", "image/png");
  params.set("transparent", "true");
  params.set("crs", "CRS:84"); // lon/lat
  params.set("bbox", bbox.join(","));
  params.set("width", String(width));
  params.set("height", String(height));
  // ERDDAP supports "time" as ISO date/time; we pass date only for daily products
  if (timeISO) params.set("time", timeISO);

  return `${stripSlash(base)}?${params.toString()}`;
}

function stripSlash(s: string) {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}
