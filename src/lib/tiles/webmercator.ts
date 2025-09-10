// Convert z/x/y to lon/lat bbox in CRS:84 (lon,lat order)
export function xyzToBboxCRS84(z: number, x: number, y: number) {
  const n = Math.pow(2, z);
  const lonLeft = (x / n) * 360 - 180;
  const lonRight = ((x + 1) / n) * 360 - 180;
  const latTop = tile2lat(y, z);
  const latBottom = tile2lat(y + 1, z);
  // WMS 1.3.0 + CRS:84 expects [minLon, minLat, maxLon, maxLat]
  const minLon = lonLeft;
  const maxLon = lonRight;
  const minLat = latBottom;
  const maxLat = latTop;
  return [minLon, minLat, maxLon, maxLat] as const;
}

function tile2lat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}
