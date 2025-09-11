import mapboxgl from "mapbox-gl";

export function setSstSource(map: mapboxgl.Map, timeUsed: string) {
  const tiles = [`/api/tiles/sst/{z}/{x}/{y}.png?time=${encodeURIComponent(timeUsed)}`];

  if (map.getSource("sst")) {
    // update by removing & re-adding (simplest, avoids stale cache path)
    try { map.removeLayer("sst-layer"); } catch {}
    try { map.removeSource("sst"); } catch {}
  }

  map.addSource("sst", { type: "raster", tiles, tileSize: 256 });
  map.addLayer({
    id: "sst-layer",
    type: "raster",
    source: "sst",
    paint: { "raster-opacity": 0.9 }
  });

  // make sure it's visible
  map.setLayoutProperty("sst-layer", "visibility", "visible");
  map.setLayerZoomRange("sst-layer", 0, 24);
}

