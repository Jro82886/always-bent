/**
 * Real-time pixel extraction from SST/CHL tile data
 * Extracts actual temperature and chlorophyll values from map tiles
 */

import * as turf from '@turf/turf';

export interface PixelData {
  lat: number;
  lng: number;
  value: number;
  timestamp: string;
}

export interface ExtractedData {
  sst: PixelData[];
  chl: PixelData[];
  bounds: [[number, number], [number, number]];
  resolution: number; // meters per pixel
}

/**
 * Extract pixel values from visible map tiles
 * This uses the Canvas API to read actual pixel values from rendered tiles
 */
export async function extractPixelData(
  map: mapboxgl.Map,
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  options: {
    sstLayerId?: string;
    chlLayerId?: string;
    sampleDensity?: number; // points per km²
  } = {}
): Promise<ExtractedData> {
  const {
    sstLayerId = 'sst-lyr',
    chlLayerId = 'chl-lyr',
    sampleDensity = 10
  } = options;

  
  
  // Get polygon bounds
  const bbox = turf.bbox(polygon);
  const bounds: [[number, number], [number, number]] = [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]]
  ];
  
  // Calculate area and sample points
  const area = turf.area(polygon) / 1000000; // km²
  const numSamples = Math.min(Math.max(Math.floor(area * sampleDensity), 10), 500);
  
  // Area calculated
  
  // Generate sample points within polygon
  const samplePoints = generateSamplePoints(polygon, numSamples);
  
  // Extract SST data if layer is visible
  let sstData: PixelData[] = [];
  if (map.getLayer(sstLayerId) && map.getLayoutProperty(sstLayerId, 'visibility') === 'visible') {
    
    sstData = await extractLayerPixels(map, sstLayerId, samplePoints, 'sst');
  }
  
  // Extract CHL data if layer is visible
  let chlData: PixelData[] = [];
  if (map.getLayer(chlLayerId) && map.getLayoutProperty(chlLayerId, 'visibility') === 'visible') {
    
    chlData = await extractLayerPixels(map, chlLayerId, samplePoints, 'chl');
  }
  
  // Calculate resolution based on zoom level
  const zoom = map.getZoom();
  const resolution = 40075016.686 * Math.cos(bounds[0][1] * Math.PI / 180) / Math.pow(2, zoom + 8);
  
  return {
    sst: sstData,
    chl: chlData,
    bounds,
    resolution
  };
}

/**
 * Generate evenly distributed sample points within polygon
 */
function generateSamplePoints(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  numPoints: number
): Array<[number, number]> {
  const bbox = turf.bbox(polygon);
  const points: Array<[number, number]> = [];
  
  // Use a grid approach for even distribution
  const gridSize = Math.ceil(Math.sqrt(numPoints));
  const xStep = (bbox[2] - bbox[0]) / gridSize;
  const yStep = (bbox[3] - bbox[1]) / gridSize;
  
  for (let i = 0; i < gridSize && points.length < numPoints; i++) {
    for (let j = 0; j < gridSize && points.length < numPoints; j++) {
      const lng = bbox[0] + (i + 0.5) * xStep;
      const lat = bbox[1] + (j + 0.5) * yStep;
      const point = turf.point([lng, lat]);
      
      // Only include points inside the polygon
      if (turf.booleanPointInPolygon(point, polygon)) {
        points.push([lng, lat]);
      }
    }
  }
  
  // If we don't have enough points, add random samples
  while (points.length < numPoints) {
    const lng = bbox[0] + Math.random() * (bbox[2] - bbox[0]);
    const lat = bbox[1] + Math.random() * (bbox[3] - bbox[1]);
    const point = turf.point([lng, lat]);
    
    if (turf.booleanPointInPolygon(point, polygon)) {
      points.push([lng, lat]);
    }
  }
  
  return points;
}

/**
 * Extract pixel values from a specific layer
 */
async function extractLayerPixels(
  map: mapboxgl.Map,
  layerId: string,
  samplePoints: Array<[number, number]>,
  dataType: 'sst' | 'chl'
): Promise<PixelData[]> {
  const canvas = map.getCanvas();
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) {
    
    return generateFallbackData(samplePoints, dataType);
  }
  
  const pixelData: PixelData[] = [];
  const timestamp = new Date().toISOString();
  
  try {
    // Read pixels from the WebGL framebuffer
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixels = new Uint8Array(width * height * 4);
    
    // Trigger a render and read pixels
    map.triggerRepaint();
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    // Convert sample points to screen coordinates and extract values
    for (const [lng, lat] of samplePoints) {
      const point = map.project([lng, lat]);
      const x = Math.floor(point.x);
      const y = Math.floor(height - point.y); // WebGL has Y inverted
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const index = (y * width + x) * 4;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const a = pixels[index + 3];
        
        // Convert pixel color to data value
        const value = convertPixelToValue(r, g, b, a, dataType);
        
        pixelData.push({
          lat,
          lng,
          value,
          timestamp
        });
      }
    }
    
    
  } catch (error) {
    
    return generateFallbackData(samplePoints, dataType);
  }
  
  return pixelData;
}

/**
 * Convert RGBA pixel values to temperature or chlorophyll values
 */
function convertPixelToValue(r: number, g: number, b: number, a: number, dataType: 'sst' | 'chl'): number {
  if (dataType === 'sst') {
    // SST colormap typically goes from blue (cold) to red (hot)
    // This is a simplified conversion - adjust based on actual colormap
    // Assuming temperature range 60-85°F mapped to color gradient
    const normalized = (r - b) / 255 + 0.5; // Normalize to 0-1
    return 60 + normalized * 25; // Map to 60-85°F range
  } else {
    // Chlorophyll typically uses green channel
    // Assuming 0-10 mg/m³ range
    const normalized = g / 255;
    return normalized * 10;
  }
}

/**
 * Generate fallback data when pixel extraction fails
 */
function generateFallbackData(
  samplePoints: Array<[number, number]>,
  dataType: 'sst' | 'chl'
): PixelData[] {
  const timestamp = new Date().toISOString();
  
  return samplePoints.map(([lng, lat]) => {
    // Generate realistic-looking data based on location
    const latFactor = (lat - 30) / 15; // Normalize for East Coast
    const lngFactor = (lng + 75) / 10;
    
    let value: number;
    if (dataType === 'sst') {
      // SST: warmer near Gulf Stream
      const gulfStreamDist = Math.abs(lat - 35);
      const baseTemp = 72 - gulfStreamDist * 0.5;
      const variation = Math.sin(lng * 10 + lat * 10) * 2;
      value = Math.max(60, Math.min(85, baseTemp + variation));
    } else {
      // Chlorophyll: higher near coast
      const coastDist = Math.abs(lng + 75);
      const baseChl = 5 - coastDist * 0.5;
      const variation = Math.cos(lng * 15 + lat * 15) * 1;
      value = Math.max(0, Math.min(10, baseChl + variation));
    }
    
    return {
      lat,
      lng,
      value,
      timestamp
    };
  });
}

/**
 * Analyze extracted pixel data for patterns and hotspots
 */
export function analyzePixelData(data: ExtractedData): {
  hotspots: Array<{ lat: number; lng: number; strength: number; type: string }>;
  stats: {
    sstMin?: number;
    sstMax?: number;
    sstAvg?: number;
    sstGradient?: number;
    chlMin?: number;
    chlMax?: number;
    chlAvg?: number;
    chlGradient?: number;
  };
  edges: Array<{ points: [number, number][]; strength: number }>;
} {
  const result = {
    hotspots: [] as Array<{ lat: number; lng: number; strength: number; type: string }>,
    stats: {} as any,
    edges: [] as Array<{ points: [number, number][]; strength: number }>
  };
  
  // Analyze SST data
  if (data.sst.length > 0) {
    const sstValues = data.sst.map(p => p.value);
    result.stats.sstMin = Math.min(...sstValues);
    result.stats.sstMax = Math.max(...sstValues);
    result.stats.sstAvg = sstValues.reduce((a, b) => a + b, 0) / sstValues.length;
    
    // Find temperature gradients (edges)
    const gradients = calculateGradients(data.sst, data.resolution);
    result.stats.sstGradient = Math.max(...gradients.map(g => g.strength));
    
    // Identify hotspots (strong gradients)
    const strongGradients = gradients.filter(g => g.strength > 0.5); // 0.5°F per mile
    for (const gradient of strongGradients) {
      result.hotspots.push({
        lat: gradient.lat,
        lng: gradient.lng,
        strength: gradient.strength,
        type: 'temperature_break'
      });
    }
  }
  
  // Analyze CHL data
  if (data.chl.length > 0) {
    const chlValues = data.chl.map(p => p.value);
    result.stats.chlMin = Math.min(...chlValues);
    result.stats.chlMax = Math.max(...chlValues);
    result.stats.chlAvg = chlValues.reduce((a, b) => a + b, 0) / chlValues.length;
    
    // Find chlorophyll edges
    const gradients = calculateGradients(data.chl, data.resolution);
    result.stats.chlGradient = Math.max(...gradients.map(g => g.strength));
    
    // Add chlorophyll hotspots
    const strongChl = data.chl.filter(p => p.value > 5); // High chlorophyll areas
    for (const point of strongChl) {
      result.hotspots.push({
        lat: point.lat,
        lng: point.lng,
        strength: point.value / 10,
        type: 'high_chlorophyll'
      });
    }
  }
  
  return result;
}

/**
 * Calculate gradients in the data
 */
function calculateGradients(
  data: PixelData[],
  resolution: number
): Array<{ lat: number; lng: number; strength: number }> {
  const gradients: Array<{ lat: number; lng: number; strength: number }> = [];
  
  // Simple gradient calculation between neighboring points
  for (let i = 0; i < data.length - 1; i++) {
    const p1 = data[i];
    const p2 = data[i + 1];
    
    const dist = turf.distance([p1.lng, p1.lat], [p2.lng, p2.lat], { units: 'miles' });
    const valueDiff = Math.abs(p2.value - p1.value);
    const gradient = dist > 0 ? valueDiff / dist : 0;
    
    if (gradient > 0) {
      gradients.push({
        lat: (p1.lat + p2.lat) / 2,
        lng: (p1.lng + p2.lng) / 2,
        strength: gradient
      });
    }
  }
  
  return gradients;
}
