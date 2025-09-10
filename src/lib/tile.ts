// WebMercator tile -> lon/lat bbox (CRS:84 order: lon,lat)
export function tileBBoxCRS84(z: number, x: number, y: number) {
  const n = Math.pow(2, z);
  const lonLeft = x / n * 360 - 180;
  const lonRight = (x + 1) / n * 360 - 180;

  const lat2deg = (t: number) => (180 / Math.PI) * Math.atan(Math.sinh(t));
  const latTop = lat2deg(Math.PI * (1 - 2 * y / n));
  const latBottom = lat2deg(Math.PI * (1 - 2 * (y + 1) / n));
  const minLat = Math.max(-89.999999, Math.min(latBottom, latTop));
  const maxLat = Math.min(89.999999, Math.max(latBottom, latTop));

  return { minLon: lonLeft, minLat, maxLon: lonRight, maxLat };
}
