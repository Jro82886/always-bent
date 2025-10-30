/**
 * Oceanographic Feature Detection Module
 *
 * Automatically detects and classifies key oceanographic features from SST raster data:
 * - Edges (Red): Temperature boundaries with ΔT ≥ 2°C over ≤ 1 mile
 * - Filaments (Yellow): Elongated features attached to larger bodies with ΔT ≥ 0.5°C
 * - Eddies (Green): Detached circular features with ΔT ≥ 0.5°C
 */

import * as turf from '@turf/turf';
import { getTemperatureFromColor } from './sst-color-mapping';

export type FeatureType = 'edge' | 'filament' | 'eddy';

export interface OceanographicFeature {
  id: string;
  type: FeatureType;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  properties: {
    type: FeatureType; // Also include in properties for GeoJSON compatibility
    tempDiffF: number;
    tempDiffC: number;
    minTempF: number;
    maxTempF: number;
    avgTempF: number;
    area: number; // km²
    perimeter: number; // km
    centroid: [number, number]; // [lng, lat]
    aspectRatio: number; // width/length ratio
    score: number; // 0-100 based on strength and persistence
    confidence: number; // 0-1 detection confidence
    color: string; // Display color
    description: string;
  };
}

interface PixelData {
  lat: number;
  lng: number;
  r: number;
  g: number;
  b: number;
  tempF?: number;
  tempC?: number;
}

interface GradientPoint {
  lat: number;
  lng: number;
  gradientF: number; // °F per mile
  direction: number; // degrees
}

/**
 * Main function to detect oceanographic features from SST raster data
 */
export async function detectOceanographicFeatures(
  pixelData: PixelData[],
  bounds: [[number, number], [number, number]],
  options: {
    edgeThresholdF?: number; // Default 2°F
    filamentThresholdF?: number; // Default 0.5°F
    eddyThresholdF?: number; // Default 0.5°F
    maxDistanceMiles?: number; // Default 1 mile
    minFeatureAreaKm2?: number; // Default 5 km²
  } = {}
): Promise<GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, OceanographicFeature['properties']>> {
  const {
    edgeThresholdF = 2.0,
    filamentThresholdF = 0.5,
    eddyThresholdF = 0.5,
    maxDistanceMiles = 1.0,
    minFeatureAreaKm2 = 5
  } = options;

  // Step 1: Enrich pixel data with temperatures
  const enrichedPixels = enrichPixelData(pixelData);

  // Step 2: Calculate temperature gradients
  const gradients = calculateGradients(enrichedPixels, maxDistanceMiles);

  // Step 3: Detect edges (strong temperature boundaries)
  const edges = detectEdges(enrichedPixels, gradients, edgeThresholdF, maxDistanceMiles);

  // Step 4: Detect filaments (elongated features)
  const filaments = detectFilaments(enrichedPixels, gradients, filamentThresholdF, maxDistanceMiles);

  // Step 5: Detect eddies (circular features)
  const eddies = detectEddies(enrichedPixels, gradients, eddyThresholdF, maxDistanceMiles);

  // Step 6: Filter by minimum area
  const allFeatures = [...edges, ...filaments, ...eddies]
    .filter(f => f.properties.area >= minFeatureAreaKm2);

  // Step 7: Score and rank features
  const scoredFeatures = scoreFeatures(allFeatures);

  // Convert to GeoJSON FeatureCollection
  return {
    type: 'FeatureCollection',
    features: scoredFeatures.map(f => ({
      type: 'Feature',
      id: f.id,
      geometry: f.geometry,
      properties: f.properties
    }))
  };
}

/**
 * Enrich pixel data with temperature values
 */
function enrichPixelData(pixels: PixelData[]): PixelData[] {
  return pixels.map(pixel => {
    const temp = getTemperatureFromColor(pixel.r, pixel.g, pixel.b);
    return {
      ...pixel,
      tempF: temp?.tempF || 0,
      tempC: temp?.tempC || 0
    };
  });
}

/**
 * Calculate temperature gradients between pixels
 */
function calculateGradients(pixels: PixelData[], maxDistMiles: number): GradientPoint[] {
  const gradients: GradientPoint[] = [];

  for (let i = 0; i < pixels.length; i++) {
    const p1 = pixels[i];
    if (!p1.tempF) continue;

    let maxGradient = 0;
    let gradientDirection = 0;

    // Check neighbors within max distance
    for (let j = i + 1; j < pixels.length; j++) {
      const p2 = pixels[j];
      if (!p2.tempF) continue;

      const distance = turf.distance(
        [p1.lng, p1.lat],
        [p2.lng, p2.lat],
        { units: 'miles' }
      );

      if (distance > maxDistMiles) continue;

      const tempDiff = Math.abs(p2.tempF - p1.tempF);
      const gradient = tempDiff / Math.max(distance, 0.1); // °F per mile

      if (gradient > maxGradient) {
        maxGradient = gradient;
        // Calculate direction
        const dx = p2.lng - p1.lng;
        const dy = p2.lat - p1.lat;
        gradientDirection = Math.atan2(dy, dx) * 180 / Math.PI;
      }
    }

    if (maxGradient > 0) {
      gradients.push({
        lat: p1.lat,
        lng: p1.lng,
        gradientF: maxGradient,
        direction: gradientDirection
      });
    }
  }

  return gradients;
}

/**
 * Detect edge features (strong temperature boundaries)
 */
function detectEdges(
  pixels: PixelData[],
  gradients: GradientPoint[],
  thresholdF: number,
  maxDistMiles: number
): OceanographicFeature[] {
  const edges: OceanographicFeature[] = [];

  // Find points with strong gradients
  const strongGradients = gradients.filter(g => g.gradientF >= thresholdF);

  // Cluster nearby gradient points into edges
  const clusters = clusterPoints(
    strongGradients.map(g => [g.lng, g.lat]),
    maxDistMiles * 2 // Double the distance for clustering
  );

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    if (cluster.length < 3) continue; // Need at least 3 points for a polygon

    // Create polygon from cluster points
    const points = cluster.map(idx => [strongGradients[idx].lng, strongGradients[idx].lat]);
    const hull = turf.convex(turf.featureCollection(points.map(p => turf.point(p))));

    if (!hull) continue;

    // Calculate temperature statistics for the edge
    const temps = cluster.map(idx => {
      const point = strongGradients[idx];
      const pixel = pixels.find(p => p.lat === point.lat && p.lng === point.lng);
      return pixel?.tempF || 0;
    }).filter(t => t > 0);

    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const tempDiff = maxTemp - minTemp;

    // Calculate geometric properties
    const area = turf.area(hull) / 1000000; // Convert to km²
    const perimeter = turf.length(hull, { units: 'kilometers' });
    const centroid = turf.centroid(hull).geometry.coordinates as [number, number];
    const bbox = turf.bbox(hull);
    const width = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[1]], { units: 'kilometers' });
    const height = turf.distance([bbox[0], bbox[1]], [bbox[0], bbox[3]], { units: 'kilometers' });
    const aspectRatio = Math.min(width, height) / Math.max(width, height);

    edges.push({
      id: `edge-${Date.now()}-${i}`,
      type: 'edge',
      geometry: hull.geometry as GeoJSON.Polygon,
      properties: {
        type: 'edge',
        tempDiffF: tempDiff,
        tempDiffC: tempDiff * 5 / 9,
        minTempF: minTemp,
        maxTempF: maxTemp,
        avgTempF: avgTemp,
        area,
        perimeter,
        centroid,
        aspectRatio,
        score: 0, // Will be calculated later
        confidence: Math.min(1, tempDiff / 5), // Higher diff = higher confidence
        color: '#FF0000', // Red for edges
        description: `Temperature edge with ${tempDiff.toFixed(1)}°F difference`
      }
    });
  }

  return edges;
}

/**
 * Detect filament features (elongated structures)
 */
function detectFilaments(
  pixels: PixelData[],
  gradients: GradientPoint[],
  thresholdF: number,
  maxDistMiles: number
): OceanographicFeature[] {
  const filaments: OceanographicFeature[] = [];

  // Find moderate gradient points
  const moderateGradients = gradients.filter(
    g => g.gradientF >= thresholdF && g.gradientF < 2.0 // Below edge threshold
  );

  // Cluster and analyze for elongated shapes
  const clusters = clusterPoints(
    moderateGradients.map(g => [g.lng, g.lat]),
    maxDistMiles * 3 // Larger distance for filaments
  );

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    if (cluster.length < 5) continue; // Need more points for filament detection

    const points = cluster.map(idx => [moderateGradients[idx].lng, moderateGradients[idx].lat]);
    const hull = turf.convex(turf.featureCollection(points.map(p => turf.point(p))));

    if (!hull) continue;

    // Calculate elongation (aspect ratio)
    const bbox = turf.bbox(hull);
    const width = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[1]], { units: 'kilometers' });
    const height = turf.distance([bbox[0], bbox[1]], [bbox[0], bbox[3]], { units: 'kilometers' });
    const aspectRatio = Math.min(width, height) / Math.max(width, height);

    // Only keep if elongated (aspect ratio < 0.5)
    if (aspectRatio > 0.5) continue;

    // Calculate properties
    const temps = cluster.map(idx => {
      const point = moderateGradients[idx];
      const pixel = pixels.find(p => p.lat === point.lat && p.lng === point.lng);
      return pixel?.tempF || 0;
    }).filter(t => t > 0);

    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const tempDiff = maxTemp - minTemp;

    const area = turf.area(hull) / 1000000;
    const perimeter = turf.length(hull, { units: 'kilometers' });
    const centroid = turf.centroid(hull).geometry.coordinates as [number, number];

    filaments.push({
      id: `filament-${Date.now()}-${i}`,
      type: 'filament',
      geometry: hull.geometry as GeoJSON.Polygon,
      properties: {
        type: 'filament',
        tempDiffF: tempDiff,
        tempDiffC: tempDiff * 5 / 9,
        minTempF: minTemp,
        maxTempF: maxTemp,
        avgTempF: avgTemp,
        area,
        perimeter,
        centroid,
        aspectRatio,
        score: 0,
        confidence: Math.min(1, (1 - aspectRatio) * (tempDiff / 2)),
        color: '#FFFF00', // Yellow for filaments
        description: `Temperature filament, ${Math.max(width, height).toFixed(1)}km long`
      }
    });
  }

  return filaments;
}

/**
 * Detect eddy features (circular, detached structures)
 */
function detectEddies(
  pixels: PixelData[],
  gradients: GradientPoint[],
  thresholdF: number,
  maxDistMiles: number
): OceanographicFeature[] {
  const eddies: OceanographicFeature[] = [];

  // Find circular patterns in gradients
  const moderateGradients = gradients.filter(g => g.gradientF >= thresholdF);

  // Look for closed circulation patterns
  const clusters = clusterPoints(
    moderateGradients.map(g => [g.lng, g.lat]),
    maxDistMiles * 2
  );

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    if (cluster.length < 8) continue; // Need enough points for circular detection

    const points = cluster.map(idx => [moderateGradients[idx].lng, moderateGradients[idx].lat]);
    const hull = turf.convex(turf.featureCollection(points.map(p => turf.point(p))));

    if (!hull) continue;

    // Check circularity
    const bbox = turf.bbox(hull);
    const width = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[1]], { units: 'kilometers' });
    const height = turf.distance([bbox[0], bbox[1]], [bbox[0], bbox[3]], { units: 'kilometers' });
    const aspectRatio = Math.min(width, height) / Math.max(width, height);

    // Only keep if roughly circular (aspect ratio > 0.8)
    if (aspectRatio < 0.8) continue;

    // Check for closed circulation (gradients pointing in circular pattern)
    const isCircular = checkCircularPattern(cluster.map(idx => moderateGradients[idx]));
    if (!isCircular) continue;

    // Calculate properties
    const temps = cluster.map(idx => {
      const point = moderateGradients[idx];
      const pixel = pixels.find(p => p.lat === point.lat && p.lng === point.lng);
      return pixel?.tempF || 0;
    }).filter(t => t > 0);

    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const tempDiff = maxTemp - minTemp;

    const area = turf.area(hull) / 1000000;
    const perimeter = turf.length(hull, { units: 'kilometers' });
    const centroid = turf.centroid(hull).geometry.coordinates as [number, number];
    const radius = Math.sqrt(area / Math.PI);

    eddies.push({
      id: `eddy-${Date.now()}-${i}`,
      type: 'eddy',
      geometry: hull.geometry as GeoJSON.Polygon,
      properties: {
        type: 'eddy',
        tempDiffF: tempDiff,
        tempDiffC: tempDiff * 5 / 9,
        minTempF: minTemp,
        maxTempF: maxTemp,
        avgTempF: avgTemp,
        area,
        perimeter,
        centroid,
        aspectRatio,
        score: 0,
        confidence: Math.min(1, aspectRatio * (tempDiff / 3)),
        color: '#00FF00', // Green for eddies
        description: `${avgTemp > 70 ? 'Warm' : 'Cold'} eddy, ${radius.toFixed(1)}km radius`
      }
    });
  }

  return eddies;
}

/**
 * Cluster nearby points using DBSCAN-like algorithm
 */
function clusterPoints(points: [number, number][], maxDistMiles: number): number[][] {
  const clusters: number[][] = [];
  const visited = new Set<number>();

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;

    const cluster: number[] = [i];
    visited.add(i);

    // Find all points within distance
    let queue = [i];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentPoint = points[current];

      for (let j = 0; j < points.length; j++) {
        if (visited.has(j)) continue;

        const distance = turf.distance(currentPoint, points[j], { units: 'miles' });
        if (distance <= maxDistMiles) {
          cluster.push(j);
          visited.add(j);
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
 * Check if gradient directions form a circular pattern
 */
function checkCircularPattern(gradients: GradientPoint[]): boolean {
  if (gradients.length < 8) return false;

  // Calculate centroid
  const centroid = [
    gradients.reduce((sum, g) => sum + g.lng, 0) / gradients.length,
    gradients.reduce((sum, g) => sum + g.lat, 0) / gradients.length
  ];

  // Check if gradients point tangentially around centroid
  let consistentCount = 0;
  for (const gradient of gradients) {
    // Calculate expected tangent direction
    const radialAngle = Math.atan2(gradient.lat - centroid[1], gradient.lng - centroid[0]);
    const tangentAngle = (radialAngle + Math.PI / 2) * 180 / Math.PI;

    // Check if gradient direction is roughly tangent
    const angleDiff = Math.abs(gradient.direction - tangentAngle);
    const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);

    if (normalizedDiff < 45) {
      consistentCount++;
    }
  }

  return consistentCount >= gradients.length * 0.6; // 60% consistency threshold
}

/**
 * Score features based on various factors
 */
function scoreFeatures(features: OceanographicFeature[]): OceanographicFeature[] {
  return features.map(feature => {
    let score = 0;

    // Temperature difference factor (up to 40 points)
    const tempScore = Math.min(40, feature.properties.tempDiffF * 10);
    score += tempScore;

    // Size factor (up to 20 points)
    const sizeScore = Math.min(20, feature.properties.area / 5);
    score += sizeScore;

    // Shape factor (up to 20 points)
    if (feature.type === 'edge') {
      // Edges: prefer linear features
      score += (1 - feature.properties.aspectRatio) * 20;
    } else if (feature.type === 'filament') {
      // Filaments: prefer elongated features
      score += (1 - feature.properties.aspectRatio) * 15;
    } else if (feature.type === 'eddy') {
      // Eddies: prefer circular features
      score += feature.properties.aspectRatio * 20;
    }

    // Confidence factor (up to 20 points)
    score += feature.properties.confidence * 20;

    // Normalize to 0-100
    feature.properties.score = Math.min(100, Math.round(score));

    return feature;
  });
}

/**
 * Export helper function to convert features to map layers
 */
export function featuresToMapLayers(features: GeoJSON.FeatureCollection): {
  edges: GeoJSON.FeatureCollection;
  filaments: GeoJSON.FeatureCollection;
  eddies: GeoJSON.FeatureCollection;
} {
  const edges = features.features.filter(f => (f.properties as any).type === 'edge');
  const filaments = features.features.filter(f => (f.properties as any).type === 'filament');
  const eddies = features.features.filter(f => (f.properties as any).type === 'eddy');

  return {
    edges: { type: 'FeatureCollection', features: edges },
    filaments: { type: 'FeatureCollection', features: filaments },
    eddies: { type: 'FeatureCollection', features: eddies }
  };
}