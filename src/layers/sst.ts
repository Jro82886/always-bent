import mapboxgl from "mapbox-gl";
const SRC = "sst-src", LYR = "sst-lyr";
const tiles = (date: string) => `https://YOUR_PROXY/sst/{z}/{x}/{y}.png?date=${date}`;

export function toggleSst(map: mapboxgl.Map, date: string, on: boolean) {
  if (on) {
    if (map.getLayer(LYR)) return;
    if (map.getSource(SRC)) { map.removeSource(SRC); }
    map.addSource(SRC, { type: "raster", tiles: [tiles(date)], tileSize: 256 } as any);
    map.addLayer({ id: LYR, type: "raster", source: SRC, paint: { "raster-opacity": 0.9 } });
  } else {
    if (map.getLayer(LYR)) map.removeLayer(LYR);
    if (map.getSource(SRC)) map.removeSource(SRC);
  }
}


