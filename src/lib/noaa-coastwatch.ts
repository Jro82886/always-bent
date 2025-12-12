/**
 * NOAA CoastWatch & Ocean Prediction Center Integration
 *
 * Fetches REAL satellite-derived ocean features from NOAA:
 * 1. Gulf Stream North/South Wall positions from OPC (traced line)
 * 2. SST thermal front detections from ACSPO (scattered features)
 *
 * NO AUTHENTICATION REQUIRED - Free public data
 */

// NOAA ERDDAP base URL for ACSPO SST with thermal fronts
const ERDDAP_BASE = 'https://coastwatch.noaa.gov/erddap/griddap';
const DATASET_ID = 'noaacwLEOACSPOSSTL3SnrtCDaily';

// NOAA Ocean Prediction Center Gulf Stream data
const OPC_GULF_STREAM_URL = 'https://ocean.weather.gov/gulf_stream_text.php';

interface NOAAGridData {
  table: {
    columnNames: string[];
    columnTypes: string[];
    rows: (number | null)[][];
  };
}

interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

/**
 * Parse coordinate string like "25.2N80.2W" to [lon, lat]
 */
function parseGulfStreamCoord(coord: string): [number, number] | null {
  // Format: 25.2N80.2W or 25.2N 80.2W
  const match = coord.match(/(\d+\.?\d*)N\s*(\d+\.?\d*)W/);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lon = -parseFloat(match[2]); // West is negative

  if (isNaN(lat) || isNaN(lon)) return null;
  return [lon, lat];
}

/**
 * Fetch Gulf Stream North and South Wall positions from NOAA OPC
 * Returns the actual traced Gulf Stream line from satellite/buoy data
 */
export async function fetchGulfStreamWalls(): Promise<{
  northWall: [number, number][];
  southWall: [number, number][];
  date: string;
} | null> {
  try {
    console.log('[NOAA OPC] Fetching Gulf Stream wall positions...');

    const response = await fetch(OPC_GULF_STREAM_URL, {
      headers: { 'Accept': 'text/html' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('[NOAA OPC] HTTP error:', response.status);
      return null;
    }

    const html = await response.text();

    // Extract date from "NORTH WALL DATA FOR 06 DEC 25:"
    const dateMatch = html.match(/NORTH WALL DATA FOR (\d+ \w+ \d+)/);
    const date = dateMatch ? dateMatch[1] : 'unknown';

    // Extract North Wall coordinates
    const northWallMatch = html.match(/NORTH WALL DATA FOR[^:]+:([\s\S]*?)(?:GULF STREAM SOUTH|$)/);
    const northWallText = northWallMatch ? northWallMatch[1] : '';

    // Extract South Wall coordinates
    const southWallMatch = html.match(/SOUTH WALL DATA FOR[^:]+:([\s\S]*?)(?:<\/pre>|2\.|$)/);
    const southWallText = southWallMatch ? southWallMatch[1] : '';

    // Parse coordinates
    const northWall: [number, number][] = [];
    const southWall: [number, number][] = [];

    // Match all coordinate pairs like "25.2N80.2W"
    const coordPattern = /(\d+\.?\d*N\s*\d+\.?\d*W)/g;

    let match;
    while ((match = coordPattern.exec(northWallText)) !== null) {
      const coord = parseGulfStreamCoord(match[1]);
      if (coord) northWall.push(coord);
    }

    coordPattern.lastIndex = 0; // Reset regex
    while ((match = coordPattern.exec(southWallText)) !== null) {
      const coord = parseGulfStreamCoord(match[1]);
      if (coord) southWall.push(coord);
    }

    console.log(`[NOAA OPC] Parsed ${northWall.length} north wall points, ${southWall.length} south wall points (${date})`);

    if (northWall.length === 0 && southWall.length === 0) {
      console.warn('[NOAA OPC] No coordinates parsed from response');
      return null;
    }

    return { northWall, southWall, date };

  } catch (error) {
    console.error('[NOAA OPC] Fetch error:', error);
    return null;
  }
}

/**
 * Convert Gulf Stream walls to GeoJSON features
 */
function gulfStreamToGeoJSON(
  northWall: [number, number][],
  southWall: [number, number][],
  date: string
): GeoJSONFeature[] {
  const features: GeoJSONFeature[] = [];

  if (northWall.length > 1) {
    features.push({
      type: 'Feature',
      properties: {
        class: 'gulf_stream', // Dedicated class for Gulf Stream
        feature_type: 'gulf_stream_north_wall',
        id: 'gulf_stream_north_wall',
        source: 'NOAA Ocean Prediction Center',
        date: date,
        description: 'Gulf Stream North Wall - based on max SST gradient from satellite IR, bathythermographs, and drifting buoys'
      },
      geometry: {
        type: 'LineString',
        coordinates: northWall
      }
    });
  }

  if (southWall.length > 1) {
    features.push({
      type: 'Feature',
      properties: {
        class: 'gulf_stream', // Dedicated class for Gulf Stream
        feature_type: 'gulf_stream_south_wall',
        id: 'gulf_stream_south_wall',
        source: 'NOAA Ocean Prediction Center',
        date: date,
        description: 'Gulf Stream South Wall - based on max SST gradient from satellite IR, bathythermographs, and drifting buoys'
      },
      geometry: {
        type: 'LineString',
        coordinates: southWall
      }
    });
  }

  return features;
}

/**
 * Fetch SST front positions from NOAA ERDDAP
 * Returns grid of binary front indicators (1 = front, 0 = no front)
 */
export async function fetchNOAAFronts(
  minLon: number,
  maxLon: number,
  minLat: number,
  maxLat: number
): Promise<{ fronts: number[][], lons: number[], lats: number[], gradient: number[][] } | null> {
  try {
    // ERDDAP query format: variable[(time)][(lat_start):(lat_stop)][(lon_start):(lon_stop)]
    // Use "last" for most recent data
    // Stride of 5 to reduce data volume (0.02° * 5 = 0.1° resolution)
    const stride = 5;

    // Build query with URL-encoded brackets
    // Format: sst_front_position[(last)][(minLat):stride:(maxLat)][(minLon):stride:(maxLon)]
    const frontQuery = `sst_front_position%5B(last)%5D%5B(${minLat}):${stride}:(${maxLat})%5D%5B(${minLon}):${stride}:(${maxLon})%5D`;
    const gradQuery = `sst_gradient_magnitude%5B(last)%5D%5B(${minLat}):${stride}:(${maxLat})%5D%5B(${minLon}):${stride}:(${maxLon})%5D`;

    const url = `${ERDDAP_BASE}/${DATASET_ID}.json?${frontQuery},${gradQuery}`;

    console.log('[NOAA] Fetching fronts from:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      // 30 second timeout
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error('[NOAA] HTTP error:', response.status, response.statusText);
      return null;
    }

    const data: NOAAGridData = await response.json();

    // Parse the tabular response
    const { columnNames, rows } = data.table;

    // Find column indices
    const latIdx = columnNames.indexOf('latitude');
    const lonIdx = columnNames.indexOf('longitude');
    const frontIdx = columnNames.indexOf('sst_front_position');
    const gradIdx = columnNames.indexOf('sst_gradient_magnitude');

    if (latIdx === -1 || lonIdx === -1 || frontIdx === -1) {
      console.error('[NOAA] Missing expected columns:', columnNames);
      return null;
    }

    // Extract unique lat/lon values
    const latsSet = new Set<number>();
    const lonsSet = new Set<number>();

    for (const row of rows) {
      if (row[latIdx] !== null) latsSet.add(row[latIdx] as number);
      if (row[lonIdx] !== null) lonsSet.add(row[lonIdx] as number);
    }

    const lats = Array.from(latsSet).sort((a, b) => a - b);
    const lons = Array.from(lonsSet).sort((a, b) => a - b);

    // Create 2D arrays
    const fronts: number[][] = Array(lats.length).fill(null).map(() => Array(lons.length).fill(0));
    const gradient: number[][] = Array(lats.length).fill(null).map(() => Array(lons.length).fill(0));

    // Fill arrays
    for (const row of rows) {
      const lat = row[latIdx] as number;
      const lon = row[lonIdx] as number;
      const front = row[frontIdx] as number;
      const grad = gradIdx !== -1 ? (row[gradIdx] as number) : 0;

      const latIndex = lats.indexOf(lat);
      const lonIndex = lons.indexOf(lon);

      if (latIndex !== -1 && lonIndex !== -1) {
        fronts[latIndex][lonIndex] = front || 0;
        gradient[latIndex][lonIndex] = grad || 0;
      }
    }

    console.log(`[NOAA] Received ${rows.length} data points, grid: ${lats.length}x${lons.length}`);

    return { fronts, lons, lats, gradient };

  } catch (error) {
    console.error('[NOAA] Fetch error:', error);
    return null;
  }
}

/**
 * Convert binary front grid to GeoJSON contours using marching squares
 */
export function frontsToGeoJSON(
  fronts: number[][],
  lons: number[],
  lats: number[],
  gradient: number[][]
): GeoJSONFeature[] {
  const features: GeoJSONFeature[] = [];
  let featureId = 0;

  // Simple contour extraction: find connected front pixels and trace edges
  const visited = new Set<string>();

  for (let i = 0; i < lats.length; i++) {
    for (let j = 0; j < lons.length; j++) {
      if (fronts[i][j] === 1 && !visited.has(`${i},${j}`)) {
        // Found a front pixel - trace the connected component
        const contour = traceContour(fronts, i, j, visited);

        if (contour.length >= 3) {
          // Convert pixel indices to lat/lon coordinates
          const coords = contour.map(([pi, pj]) => [lons[pj], lats[pi]]);

          // Calculate average gradient strength for this front
          let avgGradient = 0;
          for (const [pi, pj] of contour) {
            avgGradient += gradient[pi]?.[pj] || 0;
          }
          avgGradient /= contour.length;

          // Determine feature type based on gradient strength
          // Strong gradients (>0.1 K/km) = thermal front, weaker = edge
          const featureType = avgGradient > 0.1 ? 'thermal_front' : 'edge';
          const featureClass = avgGradient > 0.15 ? 'eddy' : avgGradient > 0.05 ? 'edge' : 'filament';

          if (contour.length > 10) {
            // Long contours become LineStrings (fronts)
            features.push({
              type: 'Feature',
              properties: {
                class: 'eddy', // GREEN for thermal fronts
                feature_type: featureType,
                gradient_strength: avgGradient,
                id: `noaa_front_${featureId++}`,
                source: 'NOAA CoastWatch ACSPO'
              },
              geometry: {
                type: 'LineString',
                coordinates: coords
              }
            });
          } else {
            // Short contours become small polygons (patches)
            const closedCoords = [...coords, coords[0]];
            features.push({
              type: 'Feature',
              properties: {
                class: featureClass,
                feature_type: 'patch',
                gradient_strength: avgGradient,
                id: `noaa_patch_${featureId++}`,
                source: 'NOAA CoastWatch ACSPO'
              },
              geometry: {
                type: 'Polygon',
                coordinates: [closedCoords]
              }
            });
          }
        }
      }
    }
  }

  return features;
}

/**
 * Trace a connected component of front pixels
 */
function traceContour(
  fronts: number[][],
  startI: number,
  startJ: number,
  visited: Set<string>
): [number, number][] {
  const contour: [number, number][] = [];
  const stack: [number, number][] = [[startI, startJ]];

  const rows = fronts.length;
  const cols = fronts[0]?.length || 0;

  while (stack.length > 0) {
    const [i, j] = stack.pop()!;
    const key = `${i},${j}`;

    if (visited.has(key)) continue;
    if (i < 0 || i >= rows || j < 0 || j >= cols) continue;
    if (fronts[i][j] !== 1) continue;

    visited.add(key);
    contour.push([i, j]);

    // Check 8-connected neighbors
    stack.push([i - 1, j - 1], [i - 1, j], [i - 1, j + 1]);
    stack.push([i, j - 1], [i, j + 1]);
    stack.push([i + 1, j - 1], [i + 1, j], [i + 1, j + 1]);
  }

  // Sort contour points to form a path (simple nearest-neighbor)
  if (contour.length > 2) {
    return sortContourPoints(contour);
  }

  return contour;
}

/**
 * Sort contour points into a connected path using nearest neighbor
 */
function sortContourPoints(points: [number, number][]): [number, number][] {
  if (points.length <= 2) return points;

  const sorted: [number, number][] = [points[0]];
  const remaining = new Set(points.slice(1).map(p => `${p[0]},${p[1]}`));
  const pointMap = new Map(points.map(p => [`${p[0]},${p[1]}`, p]));

  while (remaining.size > 0) {
    const last = sorted[sorted.length - 1];
    let nearest: [number, number] | null = null;
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

    if (nearest && nearestDist <= 3) { // Only connect nearby points
      sorted.push(nearest);
      remaining.delete(nearestKey);
    } else {
      break; // No nearby points, stop
    }
  }

  return sorted;
}

/**
 * Main function: Fetch NOAA data and convert to GeoJSON FeatureCollection
 *
 * Combines:
 * 1. Gulf Stream North/South Wall from OPC (the main traced lines)
 * 2. SST thermal front detections from ERDDAP (scattered features)
 */
export async function getNOAAPolygons(
  minLon: number,
  maxLon: number,
  minLat: number,
  maxLat: number
): Promise<{
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  properties: Record<string, unknown>;
}> {
  console.log(`[NOAA] Fetching polygons for bbox: [${minLon}, ${minLat}, ${maxLon}, ${maxLat}]`);

  const allFeatures: GeoJSONFeature[] = [];
  let gulfStreamDate = 'unknown';

  // 1. Fetch Gulf Stream walls (the main traced lines)
  try {
    const gulfStream = await fetchGulfStreamWalls();
    if (gulfStream) {
      gulfStreamDate = gulfStream.date;
      const gulfStreamFeatures = gulfStreamToGeoJSON(
        gulfStream.northWall,
        gulfStream.southWall,
        gulfStream.date
      );
      allFeatures.push(...gulfStreamFeatures);
      console.log(`[NOAA] Added ${gulfStreamFeatures.length} Gulf Stream wall features`);
    }
  } catch (e) {
    console.error('[NOAA] Failed to fetch Gulf Stream walls:', e);
  }

  // 2. Fetch SST front detections (scattered thermal features)
  try {
    const frontsData = await fetchNOAAFronts(minLon, maxLon, minLat, maxLat);
    if (frontsData) {
      const frontFeatures = frontsToGeoJSON(
        frontsData.fronts,
        frontsData.lons,
        frontsData.lats,
        frontsData.gradient
      );
      allFeatures.push(...frontFeatures);
      console.log(`[NOAA] Added ${frontFeatures.length} thermal front features`);
    }
  } catch (e) {
    console.error('[NOAA] Failed to fetch thermal fronts:', e);
  }

  if (allFeatures.length === 0) {
    console.warn('[NOAA] No features fetched from any source');
    return {
      type: 'FeatureCollection',
      features: [],
      properties: {
        error: 'Failed to fetch NOAA data',
        generated_at: new Date().toISOString(),
        source: 'NOAA',
        real_data: false
      }
    };
  }

  console.log(`[NOAA] Total: ${allFeatures.length} real features`);

  return {
    type: 'FeatureCollection',
    features: allFeatures,
    properties: {
      generated_at: new Date().toISOString(),
      bbox: [minLon, minLat, maxLon, maxLat],
      sources: [
        'NOAA Ocean Prediction Center (Gulf Stream)',
        'NOAA CoastWatch ERDDAP (thermal fronts)'
      ],
      gulf_stream_date: gulfStreamDate,
      real_data: true,
      feature_count: allFeatures.length
    }
  };
}
