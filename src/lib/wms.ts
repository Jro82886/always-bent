// XYZ tile to BBOX conversion for WMS

export function xyzToBboxCRS84(z: number, x: number, y: number) {
  const n = Math.pow(2, z);
  const lon1 = x / n * 360 - 180;
  const lat1 = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
  const lon2 = (x + 1) / n * 360 - 180;
  const lat2 = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
  
  const south = Math.min(lat1, lat2);
  const north = Math.max(lat1, lat2);
  const west = Math.min(lon1, lon2);
  const east = Math.max(lon1, lon2);
  
  return { west, south, east, north };
}

export function buildWMSUrl(
  base: string,
  layer: string,
  bbox: { west: number; south: number; east: number; north: number },
  options: {
    time?: string;
    version?: string;
    styles?: string;
    format?: string;
    crs?: string;
    width?: number;
    height?: number;
  } = {}
): string {
  const {
    time = 'latest',
    version = '1.3.0',
    styles = 'boxfill/rainbow',
    format = 'image/png',
    crs = 'CRS:84',
    width = 256,
    height = 256
  } = options;

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: version,
    LAYERS: layer,
    STYLES: styles,
    FORMAT: format,
    TRANSPARENT: 'true',
    CRS: crs,
    BBOX: `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`,
    WIDTH: width.toString(),
    HEIGHT: height.toString()
  });

  if (time && time !== 'latest') {
    params.set('TIME', time);
  }

  return `${base}?${params.toString()}`;
}
