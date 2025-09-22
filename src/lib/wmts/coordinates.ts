/**
 * WMTS coordinate conversion utilities
 * Based on Copernicus Marine JS scripts for lon/lat → tile/pixel conversion
 */

/**
 * Convert longitude to tile column
 */
export function lon2tile(lon: number, zoom: number): number {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

/**
 * Convert latitude to tile row
 */
export function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)
  );
}

/**
 * Convert tile column back to longitude (left edge)
 */
export function tile2lon(x: number, zoom: number): number {
  return x / Math.pow(2, zoom) * 360 - 180;
}

/**
 * Convert tile row back to latitude (top edge)
 */
export function tile2lat(y: number, zoom: number): number {
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, zoom);
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/**
 * Convert lon/lat to pixel coordinates within a tile
 * Returns { i, j } where i is pixel column (0-255) and j is pixel row (0-255)
 */
export function lonLat2pixel(lon: number, lat: number, zoom: number, tileSize: number = 256): {
  tileCol: number;
  tileRow: number;
  i: number;
  j: number;
} {
  // Get tile indices
  const tileCol = lon2tile(lon, zoom);
  const tileRow = lat2tile(lat, zoom);
  
  // Get tile bounds
  const tileLonLeft = tile2lon(tileCol, zoom);
  const tileLonRight = tile2lon(tileCol + 1, zoom);
  const tileLatTop = tile2lat(tileRow, zoom);
  const tileLatBottom = tile2lat(tileRow + 1, zoom);
  
  // Calculate pixel position within tile
  const i = Math.floor((lon - tileLonLeft) / (tileLonRight - tileLonLeft) * tileSize);
  const j = Math.floor((tileLatTop - lat) / (tileLatTop - tileLatBottom) * tileSize);
  
  return {
    tileCol,
    tileRow,
    i: Math.max(0, Math.min(tileSize - 1, i)),
    j: Math.max(0, Math.min(tileSize - 1, j))
  };
}

/**
 * Determine appropriate zoom level based on polygon size
 */
export function getOptimalZoom(bbox: number[]): number {
  const [west, south, east, north] = bbox;
  const width = east - west;
  const height = north - south;
  const maxDim = Math.max(width, height);
  
  // Choose zoom to get reasonable tile coverage
  if (maxDim > 10) return 6;   // Very large area
  if (maxDim > 5) return 7;    // Large area
  if (maxDim > 2) return 8;    // Medium area
  if (maxDim > 1) return 9;    // Small area
  if (maxDim > 0.5) return 10; // Very small area
  return 11;                   // Tiny area
}
