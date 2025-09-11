export function setSstSource(map: any, timeUsed: string) {
  const tiles = [`/api/tiles/sst/{z}/{x}/{y}.png?time=${encodeURIComponent(timeUsed)}`];

  // rebuild ensures Mapbox fetches the new URL path immediately
  try { if (map.getLayer("sst-lyr")) map.removeLayer("sst-lyr"); } catch {}
  try { if (map.getSource("sst-src")) map.removeSource("sst-src"); } catch {}

  map.addSource("sst-src", { type: "raster", tiles, tileSize: 256 });

  map.addLayer({
    id: "sst-lyr",
    type: "raster",
    source: "sst-src",
    paint: { "raster-opacity": 1 },
    minzoom: 0,
    maxzoom: 9 // MODIS Level9 cap to avoid 404s
  });

  map.setLayoutProperty("sst-lyr", "visibility", "visible");
}
