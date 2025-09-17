/**
 * SST Edge and Eddy Detection Algorithm
 * Identifies temperature gradients ≥0.5°F per mile
 * Generates polygons for eddies (circular) and edges (linear)
 */

import * as turf from '@turf/turf';

export interface SSTPoint {
  lat: number;
  lng: number;
  temp_f: number;
}

export interface EdgeFeature {
  type: 'edge' | 'eddy' | 'filament';
  geometry: GeoJSON.Polygon | GeoJSON.LineString;
  properties: {
    class: 'edge' | 'eddy' | 'filament'; // For compatibility with Jeff's format
    gradient_f_per_mi: number; // °F per mile
    delta_f: number; // Temperature difference
    warm_side_mean_f: number;
    cool_side_mean_f: number;
    confidence: number;
    detected: string; // ISO date
    notes?: string;
  };
}

// Constants
const GRADIENT_THRESHOLD = 0.5; // °F per mile minimum
const MILES_TO_KM = 1.60934;
const EDDY_CIRCULARITY_THRESHOLD = 0.7; // How circular to be considered an eddy

/**
 * Detect edges and eddies from SST data grid
 */
export function detectSSTFeatures(sstData: SSTPoint[]): EdgeFeature[] {
  const features: EdgeFeature[] = [];
  
  // Create a spatial index for efficient neighbor lookup
  const points = sstData.map(p => 
    turf.point([p.lng, p.lat], { temp_f: p.temp_f })
  );
  
  // Find temperature gradients
  const gradientPoints: Array<{
    point: [number, number];
    gradient: number;
    direction: number;
  }> = [];
  
  for (let i = 0; i < sstData.length; i++) {
    const point = sstData[i];
    const neighbors = findNeighbors(sstData, point, 1); // Within 1 mile
    
    for (const neighbor of neighbors) {
      const distanceMiles = turf.distance(
        [point.lng, point.lat],
        [neighbor.lng, neighbor.lat],
        { units: 'miles' }
      );
      
      if (distanceMiles > 0 && distanceMiles <= 1) {
        const tempDiff = Math.abs(neighbor.temp_f - point.temp_f);
        const gradient = tempDiff / distanceMiles;
        
        if (gradient >= GRADIENT_THRESHOLD) {
          const bearing = turf.bearing(
            [point.lng, point.lat],
            [neighbor.lng, neighbor.lat]
          );
          
          gradientPoints.push({
            point: [point.lng, point.lat],
            gradient,
            direction: bearing
          });
        }
      }
    }
  }
  
  // Cluster gradient points to find features
  const clusters = clusterGradientPoints(gradientPoints);
  
  for (const cluster of clusters) {
    const feature = analyzeCluster(cluster, sstData);
    if (feature) {
      features.push(feature);
    }
  }
  
  return features;
}

/**
 * Find neighboring points within a specified distance (miles)
 */
function findNeighbors(
  data: SSTPoint[],
  center: SSTPoint,
  radiusMiles: number
): SSTPoint[] {
  const neighbors: SSTPoint[] = [];
  
  for (const point of data) {
    if (point === center) continue;
    
    const distance = turf.distance(
      [center.lng, center.lat],
      [point.lng, point.lat],
      { units: 'miles' }
    );
    
    if (distance <= radiusMiles) {
      neighbors.push(point);
    }
  }
  
  return neighbors;
}

/**
 * Cluster gradient points that are connected
 */
function clusterGradientPoints(
  points: Array<{ point: [number, number]; gradient: number; direction: number }>
): Array<typeof points> {
  if (points.length === 0) return [];
  
  const clusters: Array<typeof points> = [];
  const visited = new Set<number>();
  
  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;
    
    const cluster: typeof points = [];
    const queue = [i];
    
    while (queue.length > 0) {
      const idx = queue.shift()!;
      if (visited.has(idx)) continue;
      
      visited.add(idx);
      cluster.push(points[idx]);
      
      // Find connected points (within 2 miles)
      for (let j = 0; j < points.length; j++) {
        if (visited.has(j)) continue;
        
        const distance = turf.distance(
          points[idx].point,
          points[j].point,
          { units: 'miles' }
        );
        
        if (distance <= 2) {
          queue.push(j);
        }
      }
    }
    
    if (cluster.length >= 3) {
      clusters.push(cluster);
    }
  }
  
  return clusters;
}

/**
 * Analyze a cluster to determine if it's an eddy, filament, or edge
 * - Eddy: circular feature (4 sides / closed loop)
 * - Filament: 3-sided feature
 * - Edge: 1-2 sided feature (linear)
 */
function analyzeCluster(
  cluster: Array<{ point: [number, number]; gradient: number; direction: number }>,
  sstData: SSTPoint[]
): EdgeFeature | null {
  if (cluster.length < 3) return null;
  
  // Extract points for geometry
  const coords = cluster.map(c => c.point);
  
  // Calculate convex hull
  const points = coords.map(c => turf.point(c));
  const featureCollection = turf.featureCollection(points);
  const hull = turf.convex(featureCollection);
  
  if (!hull) return null;
  
  // Calculate shape metrics
  const area = turf.area(hull);
  const perimeter = turf.length(hull, { units: 'meters' });
  const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
  
  // Count "sides" based on direction changes in the cluster
  const sides = countSides(cluster);
  
  // Determine feature type based on sides and circularity
  let featureType: 'eddy' | 'filament' | 'edge';
  if (circularity >= EDDY_CIRCULARITY_THRESHOLD && sides >= 4) {
    featureType = 'eddy';
  } else if (sides === 3) {
    featureType = 'filament';
  } else {
    featureType = 'edge';
  }
  
  // Calculate temperature statistics
  const temps = cluster.map(c => {
    const point = sstData.find(p => 
      Math.abs(p.lng - c.point[0]) < 0.001 && 
      Math.abs(p.lat - c.point[1]) < 0.001
    );
    return point?.temp_f || 0;
  }).filter(t => t > 0);
  
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const deltaF = maxTemp - minTemp;
  const avgGradient = cluster.reduce((a, b) => a + b.gradient, 0) / cluster.length;
  
  // Calculate warm and cool side means
  const warmSideMean = temps.filter(t => t > avgTemp).reduce((a, b) => a + b, 0) / 
                       temps.filter(t => t > avgTemp).length || avgTemp;
  const coolSideMean = temps.filter(t => t <= avgTemp).reduce((a, b) => a + b, 0) / 
                       temps.filter(t => t <= avgTemp).length || avgTemp;
  
  // Generate appropriate geometry based on type
  let geometry: GeoJSON.Polygon | GeoJSON.LineString;
  let notes: string;
  
  if (featureType === 'eddy') {
    // For eddies, create a smooth circular polygon
    const center = turf.center(featureCollection);
    const radius = Math.sqrt(area / Math.PI) / 1000; // Convert to km
    const circle = turf.circle(center.geometry.coordinates, radius, {
      steps: 32,
      units: 'kilometers'
    });
    geometry = circle.geometry;
    notes = `Circular eddy with ${deltaF.toFixed(1)}°F core anomaly`;
  } else if (featureType === 'filament') {
    // For filaments, create a triangular or 3-sided polygon
    const buffered = turf.buffer(hull, 0.3, { units: 'miles' });
    // Ensure we get a Polygon, not MultiPolygon
    if (buffered?.geometry.type === 'Polygon') {
      geometry = buffered.geometry;
    } else {
      geometry = hull.geometry;
    }
    notes = `Filament structure extending from main feature`;
  } else {
    // For edges, create a linear feature
    const line = createEdgeLine(cluster);
    const buffered = turf.buffer(line, 0.5, { units: 'miles' });
    // Ensure we get a Polygon, not MultiPolygon
    if (buffered?.geometry.type === 'Polygon') {
      geometry = buffered.geometry;
    } else {
      geometry = line.geometry;
    }
    notes = `Temperature edge with ${avgGradient.toFixed(1)}°F/mi gradient`;
  }
  
  return {
    type: featureType,
    geometry,
    properties: {
      class: featureType,
      gradient_f_per_mi: avgGradient,
      delta_f: deltaF,
      warm_side_mean_f: warmSideMean,
      cool_side_mean_f: coolSideMean,
      confidence: featureType === 'eddy' ? circularity : 
                  featureType === 'filament' ? 0.7 : 
                  1 - circularity,
      detected: new Date().toISOString(),
      notes
    }
  };
}

/**
 * Count the number of "sides" in a cluster based on direction changes
 */
function countSides(
  cluster: Array<{ point: [number, number]; gradient: number; direction: number }>
): number {
  if (cluster.length < 3) return 1;
  
  // Sort points spatially
  const sorted = [...cluster].sort((a, b) => {
    const distA = Math.sqrt(a.point[0] ** 2 + a.point[1] ** 2);
    const distB = Math.sqrt(b.point[0] ** 2 + b.point[1] ** 2);
    return distA - distB;
  });
  
  let sides = 1;
  let lastDirection = sorted[0].direction;
  
  for (let i = 1; i < sorted.length; i++) {
    const dirChange = Math.abs(sorted[i].direction - lastDirection);
    // Count a new side if direction changes by more than 45 degrees
    if (dirChange > 45 && dirChange < 315) {
      sides++;
    }
    lastDirection = sorted[i].direction;
  }
  
  // Check if it forms a closed loop (eddy)
  const firstPoint = sorted[0].point;
  const lastPoint = sorted[sorted.length - 1].point;
  const distance = Math.sqrt(
    Math.pow(firstPoint[0] - lastPoint[0], 2) + 
    Math.pow(firstPoint[1] - lastPoint[1], 2)
  );
  
  // If endpoints are close, it's likely a closed feature
  if (distance < 0.05) { // ~5km at mid-latitudes
    sides = 4; // Closed loop = 4 sides (eddy)
  }
  
  return sides;
}

/**
 * Create a smooth line through edge points
 */
function createEdgeLine(
  cluster: Array<{ point: [number, number]; gradient: number; direction: number }>
): GeoJSON.Feature<GeoJSON.LineString> {
  // Sort points to create a continuous line
  const sorted = [...cluster].sort((a, b) => {
    // Sort by longitude first, then latitude
    if (Math.abs(a.point[0] - b.point[0]) > 0.01) {
      return a.point[0] - b.point[0];
    }
    return a.point[1] - b.point[1];
  });
  
  const coords = sorted.map(c => c.point);
  
  // Smooth the line if we have enough points
  if (coords.length > 3) {
    const line = turf.lineString(coords);
    const smoothed = turf.bezierSpline(line);
    return smoothed;
  }
  
  return turf.lineString(coords);
}

/**
 * Generate daily polygons from SST tile data
 * This would be called by a cron job or API endpoint
 */
export async function generateDailyPolygons(
  sstTileUrl: string,
  bounds: [[number, number], [number, number]]
): Promise<GeoJSON.FeatureCollection> {
  // In production, this would fetch real SST data from tiles
  // For now, we'll use the mock data approach
  
  // Tile data extraction implemented in pixel-extractor module
  // const sstData = await extractSSTFromTiles(sstTileUrl, bounds);
  
  // For testing, generate sample data
  const sstData = generateSampleSSTData(bounds);
  
  // Detect features
  const features = detectSSTFeatures(sstData);
  
  // Convert to GeoJSON FeatureCollection in Jeff's format
  const geoJsonFeatures = features.map(f => ({
    type: 'Feature' as const,
    geometry: f.geometry,
    properties: {
      ...f.properties,
      type: f.type, // Keep both for compatibility
      id: `${f.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_time: new Date().toISOString(),
      band_width_m: 800 // Approximate band width
    }
  }));
  
  return {
    type: 'FeatureCollection',
    features: geoJsonFeatures
  };
}

/**
 * Generate sample SST data for testing
 * Creates realistic eddies, edges, and filaments
 */
function generateSampleSSTData(bounds: [[number, number], [number, number]]): SSTPoint[] {
  const [[west, south], [east, north]] = bounds;
  const data: SSTPoint[] = [];
  
  // Create a finer grid for better feature detection
  const gridSize = 60;
  const latStep = (north - south) / gridSize;
  const lngStep = (east - west) / gridSize;
  
  // Feature 1: Warm eddy (circular)
  const eddyCenter = {
    lat: (north + south) / 2 + 0.05,
    lng: (east + west) / 2 - (east - west) * 0.2
  };
  const eddyRadius = 0.08;
  
  // Feature 2: Cold eddy (circular)
  const coldEddyCenter = {
    lat: (north + south) / 2 - 0.1,
    lng: (east + west) / 2 + (east - west) * 0.15
  };
  const coldEddyRadius = 0.06;
  
  // Feature 3: Temperature front (edge - linear)
  const frontLng = west + (east - west) * 0.4;
  
  // Feature 4: Filament (3-sided feature extending from warm eddy)
  const filamentStart = {
    lat: eddyCenter.lat - 0.05,
    lng: eddyCenter.lng + eddyRadius
  };
  
  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      const lat = south + i * latStep;
      const lng = west + j * lngStep;
      
      let temp_f = 72; // Base temperature
      
      // Add warm eddy (circular warm core)
      const distToWarmEddy = Math.sqrt(
        Math.pow(lat - eddyCenter.lat, 2) + 
        Math.pow(lng - eddyCenter.lng, 2)
      );
      if (distToWarmEddy < eddyRadius) {
        temp_f += 2.5 * (1 - distToWarmEddy / eddyRadius);
      }
      
      // Add cold eddy (circular cold core)
      const distToColdEddy = Math.sqrt(
        Math.pow(lat - coldEddyCenter.lat, 2) + 
        Math.pow(lng - coldEddyCenter.lng, 2)
      );
      if (distToColdEddy < coldEddyRadius) {
        temp_f -= 2.0 * (1 - distToColdEddy / coldEddyRadius);
      }
      
      // Add temperature front (sharp edge)
      if (lng > frontLng) {
        // Sharper gradient at the front
        const distFromFront = Math.abs(lng - frontLng);
        if (distFromFront < 0.02) {
          temp_f += 1.0 * (1 - distFromFront / 0.02);
        } else {
          temp_f += 1.8;
        }
      }
      
      // Add filament (warm water extending from eddy)
      const distToFilament = Math.sqrt(
        Math.pow(lat - filamentStart.lat, 2) + 
        Math.pow(lng - filamentStart.lng, 2)
      );
      if (distToFilament < 0.12 && lng > filamentStart.lng && lat < filamentStart.lat + 0.05) {
        temp_f += 1.2 * (1 - distToFilament / 0.12);
      }
      
      // Add some realistic noise
      temp_f += (Math.random() - 0.5) * 0.2;
      
      data.push({ lat, lng, temp_f });
    }
  }
  
  return data;
}
