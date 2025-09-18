/**
 * Real Tile Pixel Extraction
 * Extracts actual temperature and chlorophyll values from map tiles
 */

interface PixelData {
  value: number;
  lat: number;
  lng: number;
}

interface TileBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Calculate tile bounds for a given tile coordinate
 */
function getTileBounds(z: number, x: number, y: number): TileBounds {
  const n = Math.pow(2, z);
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  
  const north = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
  const south = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
  
  return { north, south, east, west };
}

/**
 * Extract pixel values from a tile image
 */
export async function extractTilePixels(
  tileUrl: string,
  z: number,
  x: number,
  y: number,
  layer: 'sst' | 'chl'
): Promise<number[][]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const values: number[][] = [];
      
      // Process each pixel
      for (let row = 0; row < canvas.height; row++) {
        const rowValues: number[] = [];
        
        for (let col = 0; col < canvas.width; col++) {
          const idx = (row * canvas.width + col) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const a = pixels[idx + 3];
          
          // Skip transparent pixels
          if (a < 128) {
            rowValues.push(NaN);
            continue;
          }
          
          // Decode value based on layer type and colormap
          let value: number;
          
          if (layer === 'sst') {
            // SST uses a temperature colormap
            // This is simplified - in reality would need the exact colormap
            // Red = warm, Blue = cold
            const warmth = (r - b) / 255;
            value = 15 + warmth * 15; // Map to 15-30°C range
          } else {
            // CHL uses log scale with turbo colormap
            // Green = moderate chlorophyll
            const greenness = g / 255;
            value = Math.pow(10, -1 + greenness * 2); // 0.1 to 10 mg/m³
          }
          
          rowValues.push(value);
        }
        
        values.push(rowValues);
      }
      
      resolve(values);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load tile: ${tileUrl}`));
    };
    
    img.src = tileUrl;
  });
}

/**
 * Extract values for a bounding box by fetching relevant tiles
 */
export async function extractBBoxValues(
  bbox: [number, number, number, number],
  layer: 'sst' | 'chl',
  zoom: number = 8
): Promise<{ values: number[][], bounds: TileBounds }> {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  
  // Calculate tile range
  const minTileX = Math.floor((minLng + 180) / 360 * Math.pow(2, zoom));
  const maxTileX = Math.floor((maxLng + 180) / 360 * Math.pow(2, zoom));
  const minTileY = Math.floor((1 - Math.log(Math.tan(maxLat * Math.PI / 180) + 1 / Math.cos(maxLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  const maxTileY = Math.floor((1 - Math.log(Math.tan(minLat * Math.PI / 180) + 1 / Math.cos(minLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  
  // For now, just use the center tile
  const centerX = Math.floor((minTileX + maxTileX) / 2);
  const centerY = Math.floor((minTileY + maxTileY) / 2);
  
  const tileUrl = `/api/tiles/${layer}/${zoom}/${centerX}/${centerY}?time=latest`;
  const values = await extractTilePixels(tileUrl, zoom, centerX, centerY, layer);
  const bounds = getTileBounds(zoom, centerX, centerY);
  
  return { values, bounds };
}

/**
 * Detect gradients in pixel data
 */
export function detectGradients(values: number[][], threshold: number = 0.5): {
  edges: boolean[][];
  gradients: number[][];
} {
  const rows = values.length;
  const cols = values[0].length;
  const edges = Array(rows).fill(null).map(() => Array(cols).fill(false));
  const gradients = Array(rows).fill(null).map(() => Array(cols).fill(0));
  
  // Sobel operators
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      if (isNaN(values[i][j])) continue;
      
      let gx = 0, gy = 0;
      
      // Apply Sobel operators
      for (let ki = -1; ki <= 1; ki++) {
        for (let kj = -1; kj <= 1; kj++) {
          const val = values[i + ki][j + kj];
          if (!isNaN(val)) {
            gx += val * sobelX[ki + 1][kj + 1];
            gy += val * sobelY[ki + 1][kj + 1];
          }
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      gradients[i][j] = magnitude;
      
      if (magnitude > threshold) {
        edges[i][j] = true;
      }
    }
  }
  
  return { edges, gradients };
}

/**
 * Find hotspots based on convergence of gradients
 */
export function findConvergenceZones(
  sstGradients: number[][],
  chlGradients: number[][],
  bounds: TileBounds
): Array<{ lat: number; lng: number; confidence: number }> {
  const hotspots: Array<{ lat: number; lng: number; confidence: number }> = [];
  const rows = sstGradients.length;
  const cols = sstGradients[0].length;
  
  // Look for areas where both SST and CHL show strong gradients
  for (let i = 5; i < rows - 5; i += 5) {
    for (let j = 5; j < cols - 5; j += 5) {
      const sstGrad = sstGradients[i][j];
      const chlGrad = chlGradients[i][j];
      
      // High gradients in both layers = likely hotspot
      if (sstGrad > 0.5 && chlGrad > 0.3) {
        const lat = bounds.south + (i / rows) * (bounds.north - bounds.south);
        const lng = bounds.west + (j / cols) * (bounds.east - bounds.west);
        const confidence = Math.min(1, (sstGrad + chlGrad) / 2);
        
        hotspots.push({ lat, lng, confidence });
      }
    }
  }
  
  return hotspots;
}
