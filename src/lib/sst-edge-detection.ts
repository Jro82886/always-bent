/**
 * SST Edge Detection - JavaScript implementation
 *
 * Replicates the Python backend's edge detection algorithms:
 * - Sobel gradient calculation for thermal fronts
 * - Marching squares contour tracing
 * - Feature classification (eddy, filament, edge)
 *
 * This replaces the need for the Railway Python backend.
 */

const ERDDAP_BASE = 'https://coastwatch.noaa.gov/erddap/griddap';
const DATASET_ID = 'noaacwLEOACSPOSSTL3SnrtCDaily';

interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

interface SSTGrid {
  sst: (number | null)[][];
  lons: number[];
  lats: number[];
}

/**
 * Fetch raw SST temperature data from NOAA ERDDAP
 */
async function fetchSSTData(
  minLon: number,
  maxLon: number,
  minLat: number,
  maxLat: number
): Promise<SSTGrid | null> {
  try {
    // Use stride of 10 for ~0.2° resolution (balances detail vs performance)
    const stride = 10;

    const query = `sea_surface_temperature%5B(last)%5D%5B(${minLat}):${stride}:(${maxLat})%5D%5B(${minLon}):${stride}:(${maxLon})%5D`;
    const url = `${ERDDAP_BASE}/${DATASET_ID}.json?${query}`;

    console.log('[SST Edge Detection] Fetching SST data...');

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error('[SST Edge Detection] HTTP error:', response.status);
      return null;
    }

    const data = await response.json();
    const { columnNames, rows } = data.table;

    const latIdx = columnNames.indexOf('latitude');
    const lonIdx = columnNames.indexOf('longitude');
    const sstIdx = columnNames.indexOf('sea_surface_temperature');

    if (latIdx === -1 || lonIdx === -1 || sstIdx === -1) {
      console.error('[SST Edge Detection] Missing columns');
      return null;
    }

    // Extract unique coordinates
    const latsSet = new Set<number>();
    const lonsSet = new Set<number>();

    for (const row of rows) {
      if (row[latIdx] !== null) latsSet.add(row[latIdx] as number);
      if (row[lonIdx] !== null) lonsSet.add(row[lonIdx] as number);
    }

    const lats = Array.from(latsSet).sort((a, b) => a - b);
    const lons = Array.from(lonsSet).sort((a, b) => a - b);

    // Create 2D SST grid
    const sst: (number | null)[][] = Array(lats.length)
      .fill(null)
      .map(() => Array(lons.length).fill(null));

    for (const row of rows) {
      const lat = row[latIdx] as number;
      const lon = row[lonIdx] as number;
      const temp = row[sstIdx] as number | null;

      const latIndex = lats.indexOf(lat);
      const lonIndex = lons.indexOf(lon);

      if (latIndex !== -1 && lonIndex !== -1) {
        sst[latIndex][lonIndex] = temp;
      }
    }

    console.log(`[SST Edge Detection] Grid: ${lats.length}x${lons.length}`);
    return { sst, lons, lats };

  } catch (error) {
    console.error('[SST Edge Detection] Fetch error:', error);
    return null;
  }
}

/**
 * Sobel gradient calculation
 * Returns gradient magnitude at each point
 */
function calculateSobelGradient(sst: (number | null)[][]): number[][] {
  const rows = sst.length;
  const cols = sst[0]?.length || 0;
  const gradient: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));

  // Sobel kernels
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      // Skip if center pixel is null
      if (sst[i][j] === null) continue;

      let gx = 0;
      let gy = 0;
      let validCount = 0;

      // Apply Sobel kernels
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          const val = sst[i + di][j + dj];
          if (val !== null) {
            gx += val * sobelX[di + 1][dj + 1];
            gy += val * sobelY[di + 1][dj + 1];
            validCount++;
          }
        }
      }

      // Only compute gradient if we have enough valid neighbors
      if (validCount >= 6) {
        gradient[i][j] = Math.sqrt(gx * gx + gy * gy);
      }
    }
  }

  return gradient;
}

/**
 * Threshold gradient to create binary edge map
 */
function thresholdGradient(
  gradient: number[][],
  threshold: number = 2.0 // °C change across ~0.4° (~40km)
): boolean[][] {
  const rows = gradient.length;
  const cols = gradient[0]?.length || 0;
  const edges: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      edges[i][j] = gradient[i][j] > threshold;
    }
  }

  return edges;
}

/**
 * Trace contours using connected component analysis
 * Returns arrays of connected edge pixels
 */
function traceContours(edges: boolean[][]): number[][][] {
  const rows = edges.length;
  const cols = edges[0]?.length || 0;
  const visited = new Set<string>();
  const contours: number[][][] = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (edges[i][j] && !visited.has(`${i},${j}`)) {
        const contour = traceConnectedComponent(edges, i, j, visited);
        if (contour.length >= 3) {
          contours.push(contour);
        }
      }
    }
  }

  return contours;
}

/**
 * Trace a single connected component using flood fill
 */
function traceConnectedComponent(
  edges: boolean[][],
  startI: number,
  startJ: number,
  visited: Set<string>
): number[][] {
  const contour: number[][] = [];
  const stack: [number, number][] = [[startI, startJ]];
  const rows = edges.length;
  const cols = edges[0]?.length || 0;

  while (stack.length > 0) {
    const [i, j] = stack.pop()!;
    const key = `${i},${j}`;

    if (visited.has(key)) continue;
    if (i < 0 || i >= rows || j < 0 || j >= cols) continue;
    if (!edges[i][j]) continue;

    visited.add(key);
    contour.push([i, j]);

    // 8-connected neighbors
    stack.push([i-1, j-1], [i-1, j], [i-1, j+1]);
    stack.push([i, j-1], [i, j+1]);
    stack.push([i+1, j-1], [i+1, j], [i+1, j+1]);
  }

  // Sort contour points to form a path
  return sortContourPoints(contour);
}

/**
 * Sort contour points into a connected path using nearest neighbor
 */
function sortContourPoints(points: number[][]): number[][] {
  if (points.length <= 2) return points;

  const sorted: number[][] = [points[0]];
  const remaining = new Set(points.slice(1).map(p => `${p[0]},${p[1]}`));
  const pointMap = new Map(points.map(p => [`${p[0]},${p[1]}`, p]));

  while (remaining.size > 0) {
    const last = sorted[sorted.length - 1];
    let nearest: number[] | null = null;
    let nearestDist = Infinity;
    let nearestKey = '';

    for (const key of remaining) {
      const point = pointMap.get(key)!;
      const dist = Math.abs(point[0] - last[0]) + Math.abs(point[1] - last[1]);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = point;
        nearestKey = key;
      }
    }

    if (nearest && nearestDist <= 2) {
      sorted.push(nearest);
      remaining.delete(nearestKey);
    } else {
      break;
    }
  }

  return sorted;
}

/**
 * Classify a contour based on its shape
 * - Eddy: Roughly circular (width ≈ height, closed)
 * - Filament: Elongated (length >> width)
 * - Edge: Linear thermal front
 */
function classifyContour(contour: number[][]): 'eddy' | 'filament' | 'edge' {
  if (contour.length < 5) return 'edge';

  // Calculate bounding box
  let minI = Infinity, maxI = -Infinity;
  let minJ = Infinity, maxJ = -Infinity;

  for (const [i, j] of contour) {
    minI = Math.min(minI, i);
    maxI = Math.max(maxI, i);
    minJ = Math.min(minJ, j);
    maxJ = Math.max(maxJ, j);
  }

  const height = maxI - minI;
  const width = maxJ - minJ;
  const aspectRatio = Math.max(height, width) / (Math.min(height, width) + 0.1);

  // Check if contour is closed (start near end)
  const start = contour[0];
  const end = contour[contour.length - 1];
  const isClosed = Math.abs(start[0] - end[0]) <= 2 && Math.abs(start[1] - end[1]) <= 2;

  // Classify
  if (isClosed && aspectRatio < 2.0 && contour.length > 15) {
    return 'eddy'; // Roughly circular, closed
  } else if (aspectRatio > 3.0) {
    return 'filament'; // Very elongated
  } else {
    return 'edge'; // Default: thermal edge/front
  }
}

/**
 * Smooth contour coordinates using moving average
 */
function smoothContour(coords: number[][], windowSize: number = 3): number[][] {
  if (coords.length < windowSize) return coords;

  const smoothed: number[][] = [];
  const half = Math.floor(windowSize / 2);

  for (let i = 0; i < coords.length; i++) {
    let sumLon = 0, sumLat = 0, count = 0;

    for (let j = -half; j <= half; j++) {
      const idx = Math.max(0, Math.min(coords.length - 1, i + j));
      sumLon += coords[idx][0];
      sumLat += coords[idx][1];
      count++;
    }

    smoothed.push([sumLon / count, sumLat / count]);
  }

  return smoothed;
}

/**
 * Convert pixel contour to lat/lon coordinates
 */
function contourToCoords(
  contour: number[][],
  lons: number[],
  lats: number[]
): number[][] {
  const coords: number[][] = [];

  for (const [i, j] of contour) {
    if (i >= 0 && i < lats.length && j >= 0 && j < lons.length) {
      coords.push([lons[j], lats[i]]);
    }
  }

  return coords;
}

/**
 * Main function: Run edge detection and return GeoJSON features
 */
export async function detectOceanFeatures(
  minLon: number,
  maxLon: number,
  minLat: number,
  maxLat: number
): Promise<GeoJSONFeature[]> {
  console.log('[SST Edge Detection] Starting edge detection...');

  // 1. Fetch SST data
  const sstData = await fetchSSTData(minLon, maxLon, minLat, maxLat);
  if (!sstData) {
    console.warn('[SST Edge Detection] Failed to fetch SST data');
    return [];
  }

  const { sst, lons, lats } = sstData;

  // 2. Calculate Sobel gradient
  console.log('[SST Edge Detection] Calculating gradients...');
  const gradient = calculateSobelGradient(sst);

  // 3. Threshold to find edges
  const edges = thresholdGradient(gradient, 1.5);

  // 4. Trace contours
  console.log('[SST Edge Detection] Tracing contours...');
  const contours = traceContours(edges);

  // 5. Convert to GeoJSON features
  const features: GeoJSONFeature[] = [];
  let featureId = 0;

  for (const contour of contours) {
    // Convert to lat/lon
    let coords = contourToCoords(contour, lons, lats);
    if (coords.length < 3) continue;

    // Smooth the coordinates
    coords = smoothContour(coords, 5);

    // Classify the feature
    const featureClass = classifyContour(contour);

    // Calculate average gradient strength
    let avgGradient = 0;
    for (const [i, j] of contour) {
      avgGradient += gradient[i]?.[j] || 0;
    }
    avgGradient /= contour.length;

    if (featureClass === 'eddy' && coords.length > 10) {
      // Eddies are closed polygons
      const closedCoords = [...coords, coords[0]];
      features.push({
        type: 'Feature',
        properties: {
          class: 'eddy',
          feature_type: 'detected_eddy',
          gradient_strength: avgGradient,
          id: `detected_eddy_${featureId++}`,
          source: 'SST Edge Detection (Sobel)'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [closedCoords]
        }
      });
    } else if (featureClass === 'filament') {
      // Filaments are elongated lines/polygons
      if (coords.length > 8) {
        features.push({
          type: 'Feature',
          properties: {
            class: 'filament',
            feature_type: 'cold_filament',
            gradient_strength: avgGradient,
            id: `detected_filament_${featureId++}`,
            source: 'SST Edge Detection (Sobel)'
          },
          geometry: {
            type: 'LineString',
            coordinates: coords
          }
        });
      }
    } else {
      // Thermal edges/fronts
      features.push({
        type: 'Feature',
        properties: {
          class: 'edge',
          feature_type: 'thermal_front',
          gradient_strength: avgGradient,
          id: `detected_edge_${featureId++}`,
          source: 'SST Edge Detection (Sobel)'
        },
        geometry: {
          type: 'LineString',
          coordinates: coords
        }
      });
    }
  }

  console.log(`[SST Edge Detection] Detected ${features.length} features`);

  // Count by type
  const counts = { eddy: 0, filament: 0, edge: 0 };
  for (const f of features) {
    const cls = f.properties.class as string;
    if (cls in counts) counts[cls as keyof typeof counts]++;
  }
  console.log(`[SST Edge Detection] Eddies: ${counts.eddy}, Filaments: ${counts.filament}, Edges: ${counts.edge}`);

  return features;
}
