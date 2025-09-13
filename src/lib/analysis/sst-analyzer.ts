/**
 * SST Analysis Engine
 * JavaScript implementation of Jeff's Python algorithm
 * Detects edges, hard breaks, eddies, and filaments
 */

import * as turf from '@turf/turf';

// Jeff's thresholds from Python algorithm
const EDGE_BREAK_F_PER_MILE = 0.5;      // Standard edge
const HARD_BREAK_F_PER_MILE = 2.0;      // Hard edge
const MILE_TO_KM = 1.609344;
const EDGE_THR_F_PER_KM = EDGE_BREAK_F_PER_MILE / MILE_TO_KM;
const HARD_THR_F_PER_KM = HARD_BREAK_F_PER_MILE / MILE_TO_KM;

// Shape detection thresholds
const CIRCULARITY_THR = 0.65;  // For eddy detection
const ELONGATION_THR = 2.5;    // For filament detection
const MIN_AREA_KM2 = 2.0;      // Ignore tiny features

export interface SSTDataPoint {
  lat: number;
  lng: number;
  temp_f: number;
}

export interface DetectedFeature {
  type: 'edge' | 'hard_edge' | 'eddy' | 'filament';
  geometry: GeoJSON.Polygon;
  properties: {
    grad_f_per_km_mean: number;
    grad_f_per_km_max: number;
    delta_temp_f: number;
    area_km2: number;
    perimeter_km: number;
    circularity: number;
    elongation: number;
    orientation_deg: number;
    score: number;
    center: [number, number];
  };
}

export interface AnalysisResult {
  polygon: GeoJSON.Feature;
  features: DetectedFeature[];
  hotspot: {
    location: [number, number];
    confidence: number;
    gradient_strength: number;
    optimal_approach: string;
  } | null;
  stats: {
    min_temp_f: number;
    max_temp_f: number;
    avg_temp_f: number;
    temp_range_f: number;
    area_km2: number;
  };
  layerAnalysis?: {
    sst?: {
      active: boolean;
      description: string;
    };
    chl?: {
      active: boolean;
      description: string;
      avg_chl_mg_m3?: number;
      max_chl_mg_m3?: number;
    };
    convergence?: {
      detected: boolean;
      confidence: number;
      description: string;
    };
  };
  boatActivity?: {
    unique_boats: number;
    total_reports: number;
    species: string[];
    avg_catch_quality: number;
  };
}

/**
 * Calculate temperature gradient at a point
 * Simplified for browser - uses neighboring points
 */
function calculateGradient(
  point: SSTDataPoint,
  neighbors: SSTDataPoint[]
): { magnitude: number; direction: number } {
  if (neighbors.length < 2) {
    return { magnitude: 0, direction: 0 };
  }

  let maxGradient = 0;
  let gradientDirection = 0;

  for (const neighbor of neighbors) {
    const distance = turf.distance(
      [point.lng, point.lat],
      [neighbor.lng, neighbor.lat],
      { units: 'kilometers' }
    );
    
    if (distance > 0) {
      const tempDiff = Math.abs(neighbor.temp_f - point.temp_f);
      const gradient = tempDiff / distance; // °F per km
      
      if (gradient > maxGradient) {
        maxGradient = gradient;
        gradientDirection = turf.bearing(
          [point.lng, point.lat],
          [neighbor.lng, neighbor.lat]
        );
      }
    }
  }

  return { magnitude: maxGradient, direction: gradientDirection };
}

/**
 * Calculate shape metrics for feature classification
 */
function calculateShapeMetrics(polygon: GeoJSON.Polygon): {
  area_km2: number;
  perimeter_km: number;
  circularity: number;
  elongation: number;
  orientation_deg: number;
} {
  const area = turf.area(polygon) / 1e6; // km²
  const perimeter = turf.length(turf.polygonToLine(polygon), { units: 'kilometers' });
  
  // Circularity: 4π × area / perimeter²
  const circularity = (4 * Math.PI * area * 1e6) / Math.pow(perimeter * 1000, 2);
  
  // Elongation using bounding box approximation
  const bbox = turf.bbox(polygon);
  const width = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[1]], { units: 'kilometers' });
  const height = turf.distance([bbox[0], bbox[1]], [bbox[0], bbox[3]], { units: 'kilometers' });
  const elongation = Math.max(width, height) / Math.min(width, height);
  
  // Orientation of major axis
  const orientation = Math.atan2(height, width) * 180 / Math.PI;

  return {
    area_km2: area,
    perimeter_km: perimeter,
    circularity: Math.min(1, Math.max(0, circularity)),
    elongation: elongation,
    orientation_deg: (orientation + 360) % 180
  };
}

/**
 * Classify feature based on Jeff's criteria
 */
function classifyFeature(
  gradientMean: number,
  metrics: ReturnType<typeof calculateShapeMetrics>
): 'edge' | 'hard_edge' | 'eddy' | 'filament' {
  // Base classification on gradient strength
  let featureType: 'edge' | 'hard_edge' = gradientMean >= HARD_THR_F_PER_KM ? 'hard_edge' : 'edge';
  
  // Refine based on shape
  if (metrics.circularity >= CIRCULARITY_THR && metrics.elongation < 1.8) {
    return 'eddy';
  } else if (metrics.elongation >= ELONGATION_THR) {
    return 'filament';
  }
  
  return featureType;
}

/**
 * Calculate feature score (0-1) based on Jeff's algorithm
 */
function calculateScore(
  gradientMean: number,
  gradientMax: number,
  area_km2: number,
  featureType: string
): number {
  // Normalize gradient (soft cap at 2.5 °F/km)
  const gradNorm = Math.min(gradientMean / 2.5, 1.0);
  
  // Normalize area (soft cap at 500 km²)
  const areaNorm = Math.min(area_km2 / 500.0, 1.0);
  
  // Type bonus
  const typeBonus = {
    'hard_edge': 0.15,
    'edge': 0.0,
    'filament': 0.1,
    'eddy': 0.2
  }[featureType] || 0;
  
  // Weighted combination (Jeff's weights)
  const score = 0.55 * gradNorm + 0.25 * areaNorm + 0.20 * 0 + typeBonus; // No persistence yet
  
  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Main analysis function
 * Analyzes SST data within a polygon using Jeff's algorithm
 */
export async function analyzeSSTPolygon(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  sstData: SSTDataPoint[]
): Promise<AnalysisResult> {
  // Filter SST points within polygon
  const pointsInPolygon = sstData.filter(point => 
    turf.booleanPointInPolygon([point.lng, point.lat], polygon)
  );

  if (pointsInPolygon.length < 3) {
    throw new Error('Not enough SST data points in selected area');
  }

  // Calculate basic statistics
  const temps = pointsInPolygon.map(p => p.temp_f);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  const tempRange = maxTemp - minTemp;
  const areaKm2 = turf.area(polygon) / 1e6;

  // Calculate gradients for each point
  const gradients: Array<{ point: SSTDataPoint; gradient: number; direction: number }> = [];
  
  for (const point of pointsInPolygon) {
    // Find neighbors within 5km
    const neighbors = pointsInPolygon.filter(p => {
      if (p === point) return false;
      const dist = turf.distance([point.lng, point.lat], [p.lng, p.lat], { units: 'kilometers' });
      return dist <= 5;
    });
    
    const { magnitude, direction } = calculateGradient(point, neighbors);
    gradients.push({ point, gradient: magnitude, direction });
  }

  // Find edges (points exceeding threshold)
  const edgePoints = gradients.filter(g => g.gradient >= EDGE_THR_F_PER_KM);
  const hardEdgePoints = gradients.filter(g => g.gradient >= HARD_THR_F_PER_KM);

  // Cluster edge points into features (simplified clustering)
  const features: DetectedFeature[] = [];
  
  if (edgePoints.length > 0) {
    // Create a convex hull around edge points for simplified feature detection
    const edgeCoords = edgePoints.map(e => [e.point.lng, e.point.lat]);
    
    if (edgeCoords.length >= 3) {
      const hull = turf.convex(turf.featureCollection(
        edgeCoords.map(c => turf.point(c))
      ));
      
      if (hull) {
        const metrics = calculateShapeMetrics(hull.geometry);
        const gradientMean = edgePoints.reduce((sum, e) => sum + e.gradient, 0) / edgePoints.length;
        const gradientMax = Math.max(...edgePoints.map(e => e.gradient));
        
        const featureType = classifyFeature(gradientMean, metrics);
        const score = calculateScore(gradientMean, gradientMax, metrics.area_km2, featureType);
        
        features.push({
          type: featureType,
          geometry: hull.geometry,
          properties: {
            grad_f_per_km_mean: gradientMean,
            grad_f_per_km_max: gradientMax,
            delta_temp_f: gradientMean * MILE_TO_KM, // Delta over 1 mile
            ...metrics,
            score,
            center: turf.center(hull).geometry.coordinates as [number, number]
          }
        });
      }
    }
  }

  // Find primary hotspot ONLY if there's a real temperature break
  let hotspot = null;
  if (gradients.length > 0) {
    const maxGradientPoint = gradients.reduce((max, g) => 
      g.gradient > max.gradient ? g : max
    );
    
    // Only create hotspot if gradient is significant (at least 0.5°F per mile)
    if (maxGradientPoint.gradient >= EDGE_THR_F_PER_KM) {
      // Determine optimal approach direction (perpendicular to gradient)
      const approachAngle = (maxGradientPoint.direction + 90) % 360;
      const approachDir = 
        approachAngle < 45 || approachAngle >= 315 ? 'E-W' :
        approachAngle < 135 ? 'N-S' :
        approachAngle < 225 ? 'E-W' : 'N-S';
      
      hotspot = {
        location: [maxGradientPoint.point.lng, maxGradientPoint.point.lat] as [number, number],
        confidence: Math.min(maxGradientPoint.gradient / HARD_THR_F_PER_KM, 1.0),
        gradient_strength: maxGradientPoint.gradient,
        optimal_approach: `Approach from ${approachDir} along the edge`
      };
    }
  }
  
  // Add educational feedback when no hotspot found
  const waterQuality = tempRange < 1 ? 'uniform' : 
                       tempRange < 2 ? 'minimal variation' : 
                       'some variation';

  return {
    polygon,
    features,
    hotspot,
    stats: {
      min_temp_f: minTemp,
      max_temp_f: maxTemp,
      avg_temp_f: avgTemp,
      temp_range_f: tempRange,
      area_km2: areaKm2
    }
  };
}

/**
 * Generate mock SST data for testing
 * Creates a gradient pattern with some variation
 */
export function generateMockSSTData(bounds: number[][]): SSTDataPoint[] {
  const [[west, south], [east, north]] = bounds;
  const data: SSTDataPoint[] = [];
  
  // Create a grid of points
  const latStep = (north - south) / 30;  // More points for better gradients
  const lngStep = (east - west) / 30;
  
  // Create a strong temperature break in the middle (simulating Gulf Stream edge)
  const edgeLng = west + (east - west) * 0.4;  // Edge at 40% across
  
  for (let lat = south; lat <= north; lat += latStep) {
    for (let lng = west; lng <= east; lng += lngStep) {
      let temp_f;
      
      // Create a REALISTIC temperature break at the edge (1-3°F is typical)
      if (lng < edgeLng) {
        // Cold side (shelf water)
        temp_f = 72 + Math.random() * 0.5;  // 72-72.5°F
      } else {
        // Warm side (Gulf Stream edge)
        temp_f = 74.5 + Math.random() * 0.5;  // 74.5-75°F
      }
      
      // Add some north-south variation
      temp_f += ((lat - south) / (north - south)) * 1;
      
      // Add a narrow transition zone right at the edge
      const distFromEdge = Math.abs(lng - edgeLng);
      if (distFromEdge < (east - west) * 0.02) {  // Within 2% of edge (narrow break)
        // Smooth transition across the break
        const transitionFactor = (lng - (edgeLng - (east - west) * 0.02)) / ((east - west) * 0.04);
        temp_f = 72.25 + (transitionFactor * 2.5);  // 2.5°F total change
      }
      
      data.push({
        lat,
        lng,
        temp_f
      });
    }
  }
  
  return data;
}

/**
 * Multi-layer ocean analysis
 * Combines SST, Chlorophyll, and other data for comprehensive intelligence
 */
export async function analyzeMultiLayer(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  sstData: SSTDataPoint[] | null,
  chlData: CHLDataPoint[] | null
): Promise<AnalysisResult> {
  // If we have SST data, use the existing analysis as base
  let result: AnalysisResult;
  
  if (sstData && sstData.length > 0) {
    result = await analyzeSSTPolygon(polygon, sstData);
  } else {
    // Create a basic result structure if no SST
    const areaKm2 = turf.area(polygon) / 1e6;
    result = {
      polygon,
      features: [],
      hotspot: null,
      stats: {
        min_temp_f: 0,
        max_temp_f: 0,
        avg_temp_f: 0,
        temp_range_f: 0,
        area_km2: areaKm2
      }
    };
  }
  
  // Initialize layer analysis
  result.layerAnalysis = {
    sst: {
      active: !!sstData,
      description: sstData ? 
        `Temperature range: ${result.stats.min_temp_f.toFixed(1)}°F - ${result.stats.max_temp_f.toFixed(1)}°F` :
        'SST layer not active'
    }
  };
  
  // Analyze chlorophyll if available
  if (chlData && chlData.length > 0) {
    const chlValues = chlData.map(p => p.chl_mg_m3);
    const avgChl = chlValues.reduce((a, b) => a + b, 0) / chlValues.length;
    const maxChl = Math.max(...chlValues);
    
    let chlDescription = '';
    if (maxChl > 1.0) {
      chlDescription = '🌿 HIGH PLANKTON BLOOM detected! Prime baitfish aggregation zone.';
    } else if (avgChl > 0.5) {
      chlDescription = '🌿 Moderate chlorophyll indicates productive water with good forage.';
    } else {
      chlDescription = '🌿 Clear blue water - look for structure and temperature breaks.';
    }
    
    result.layerAnalysis.chl = {
      active: true,
      description: chlDescription,
      avg_chl_mg_m3: avgChl,
      max_chl_mg_m3: maxChl
    };
    
    // Check for convergence zones (SST edge + CHL bloom)
    if (sstData && result.features.length > 0 && maxChl > 0.7) {
      const hasStrongEdge = result.features.some(f => 
        f.type === 'edge' || f.type === 'hard_edge'
      );
      
      if (hasStrongEdge) {
        result.layerAnalysis.convergence = {
          detected: true,
          confidence: 0.85,
          description: '🎯 CONVERGENCE ZONE: Temperature break aligns with plankton bloom! This is where ocean systems collide and predators hunt.'
        };
        
        // Boost hotspot confidence for convergence
        if (result.hotspot) {
          result.hotspot.confidence = Math.min(1.0, result.hotspot.confidence * 1.3);
          result.hotspot.optimal_approach = 'Work the edges where green water meets blue - fish are stacked here!';
        }
      }
    }
  } else {
    result.layerAnalysis.chl = {
      active: false,
      description: 'Chlorophyll layer not active'
    };
  }
  
  return result;
}

// Chlorophyll data point interface
export interface CHLDataPoint {
  lat: number;
  lng: number;
  chl_mg_m3: number; // Chlorophyll concentration in mg/m³
}

// Generate mock chlorophyll data
export function generateMockCHLData(bounds: number[][]): CHLDataPoint[] {
  const [[west, south], [east, north]] = bounds;
  const data: CHLDataPoint[] = [];
  
  // Create a grid of points
  const latStep = (north - south) / 20;
  const lngStep = (east - west) / 20;
  
  for (let lat = south; lat <= north; lat += latStep) {
    for (let lng = west; lng <= east; lng += lngStep) {
      // Base chlorophyll decreases offshore (west to east)
      const baseChl = 0.8 - ((lng - west) / (east - west)) * 0.6;
      
      // Add plankton bloom patterns
      const bloomPattern = Math.sin((lat - south) * 8) * 0.3;
      
      // Add an upwelling zone with high chlorophyll
      const upwellingLat = (north + south) / 2 + 0.1;
      const upwellingLng = west + (east - west) * 0.3;
      const distFromUpwelling = Math.sqrt(
        Math.pow(lat - upwellingLat, 2) + Math.pow(lng - upwellingLng, 2)
      );
      const upwellingBonus = Math.max(0, 0.5 - distFromUpwelling * 5);
      
      data.push({
        lat,
        lng,
        chl_mg_m3: Math.max(0.1, baseChl + bloomPattern + upwellingBonus)
      });
    }
  }
  
  return data;
}
