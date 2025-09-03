import type mapboxgl from "mapbox-gl";

export function firstSymbolLayerId(map: mapboxgl.Map): string | undefined {
  const layers = map.getStyle()?.layers || [];
  const sym = layers.find((l: any) => l.type === "symbol");
  return sym?.id;
}

/** Ensure GeoJSON source + hotspot layers exist and sit above rasters. */
export function ensureHotspotLayers(map: mapboxgl.Map) {
  const beforeId = firstSymbolLayerId(map);
  if (!map.getSource("hotspots")) {
    map.addSource("hotspots", { type: "geojson", data: { type: "FeatureCollection", features: [] } as any } as any);
  }
  if (!map.getLayer("hotspots-points")) {
    map.addLayer(
      {
        id: "hotspots-points",
        type: "circle",
        source: "hotspots",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "confidence"],
            0.4,
            5,
            0.6,
            7,
            0.8,
            9,
            0.95,
            11,
          ],
          "circle-color": [
            "case",
            [">=", ["get", "confidence"], 0.78],
            "#ff3b3b",
            [">=", ["get", "confidence"], 0.62],
            "#f59e0b",
            "#22d3ee",
          ],
          "circle-opacity": 0.95,
          "circle-stroke-color": "rgba(255,255,255,0.9)",
          "circle-stroke-width": 2,
        },
      } as any,
      beforeId
    );
  }
  if (!map.getLayer("hotspots-glow")) {
    map.addLayer(
      {
        id: "hotspots-glow",
        type: "circle",
        source: "hotspots",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "confidence"],
            0.4,
            10,
            0.6,
            12,
            0.8,
            14,
            0.95,
            18,
          ],
          "circle-color": [
            "case",
            [">=", ["get", "confidence"], 0.78],
            "rgba(255,59,59,0.25)",
            [">=", ["get", "confidence"], 0.62],
            "rgba(245,158,11,0.22)",
            "rgba(34,211,238,0.22)",
          ],
          "circle-blur": 0.6,
          "circle-opacity": 0.8,
        },
      } as any,
      "hotspots-points"
    );
  }
}


