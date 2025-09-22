export function centroidOf(p: GeoJSON.Polygon): { lat: number; lon: number } {
  const c = p.coordinates[0];
  let twiceArea = 0, x = 0, y = 0;
  
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
    const [x0, y0] = c[j];
    const [x1, y1] = c[i];
    const f = (x0 * y1 - x1 * y0);
    twiceArea += f;
    x += (x0 + x1) * f;
    y += (y0 + y1) * f;
  }
  
  const lon = x / (3 * twiceArea);
  const lat = y / (3 * twiceArea);
  return { lat, lon };
}

export const fmtDeg = (v: number, isLat: boolean) =>
  `${Math.abs(v).toFixed(3)}°${isLat ? (v >= 0 ? 'N' : 'S') : (v >= 0 ? 'E' : 'W')}`;
