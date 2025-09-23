// Snip drawing result type
export type SnipResult = {
  polygon: GeoJSON.Polygon;
  bbox: [number, number, number, number];
  center: { lat: number; lon: number };
};
