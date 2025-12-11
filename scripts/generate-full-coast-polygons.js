/**
 * Generate polygon sample data covering the entire US East Coast
 * From Maine (44°N) to Florida Keys (24°N)
 */

const fs = require('fs');
const path = require('path');

// East Coast coverage bounds
const BOUNDS = {
  north: 44.5,  // Maine
  south: 24.0,  // Florida Keys
  west: -82.0,  // Florida Gulf side
  east: -65.0   // Offshore
};

// Feature generation parameters
const GRID_SIZE = 1.5; // degrees between feature centers
const FEATURES_PER_CELL = 2; // avg features per grid cell

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function generateEddy(centerLng, centerLat) {
  const radiusKm = randomInRange(15, 45);
  const radiusDeg = radiusKm / 111;
  const points = [];
  const numPoints = 24;

  // Add slight irregularity for natural look
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const r = radiusDeg * (0.85 + Math.random() * 0.3);
    const lng = centerLng + r * Math.cos(angle) / Math.cos(centerLat * Math.PI / 180);
    const lat = centerLat + r * Math.sin(angle);
    points.push([lng, lat]);
  }
  // Close the polygon
  points.push(points[0]);

  return {
    type: 'Feature',
    properties: {
      class: 'eddy',
      source: 'cmems',
      date: new Date().toISOString().split('T')[0],
      var: 'analysed_sst',
      eddy_type: Math.random() > 0.5 ? 'warm_core' : 'cold_core',
      radius_km: radiusKm
    },
    geometry: {
      type: 'Polygon',
      coordinates: [points]
    }
  };
}

function generateEdge(startLng, startLat) {
  const length = randomInRange(0.3, 0.8); // degrees
  const angle = randomInRange(0, Math.PI * 2);
  const points = [];
  const numPoints = 8;

  // Create a curved line (thermal front)
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const curvature = Math.sin(t * Math.PI) * randomInRange(0.05, 0.15);
    const lng = startLng + t * length * Math.cos(angle) + curvature * Math.cos(angle + Math.PI/2);
    const lat = startLat + t * length * Math.sin(angle) + curvature * Math.sin(angle + Math.PI/2);
    points.push([lng, lat]);
  }

  // Create a thin polygon from the line
  const width = 0.02;
  const polyPoints = [];

  // Forward direction
  for (let i = 0; i < points.length; i++) {
    polyPoints.push([points[i][0] + width, points[i][1] + width]);
  }
  // Backward direction
  for (let i = points.length - 1; i >= 0; i--) {
    polyPoints.push([points[i][0] - width, points[i][1] - width]);
  }
  polyPoints.push(polyPoints[0]);

  return {
    type: 'Feature',
    properties: {
      class: 'edge',
      source: 'cmems',
      date: new Date().toISOString().split('T')[0],
      var: 'analysed_sst',
      strength: randomInRange(0.5, 1.0)
    },
    geometry: {
      type: 'Polygon',
      coordinates: [polyPoints]
    }
  };
}

function generateFilament(centerLng, centerLat) {
  const length = randomInRange(0.2, 0.5);
  const width = randomInRange(0.03, 0.08);
  const angle = randomInRange(0, Math.PI * 2);
  const points = [];
  const numPoints = 12;

  // Elongated shape
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * 2 * Math.PI;
    const elongation = length / width;
    const dx = width * Math.cos(t) * elongation * Math.cos(angle) - width * Math.sin(t) * Math.sin(angle);
    const dy = width * Math.cos(t) * elongation * Math.sin(angle) + width * Math.sin(t) * Math.cos(angle);
    points.push([centerLng + dx, centerLat + dy]);
  }
  points.push(points[0]);

  return {
    type: 'Feature',
    properties: {
      class: 'filament',
      source: 'cmems',
      date: new Date().toISOString().split('T')[0],
      var: 'analysed_sst',
      filament_type: Math.random() > 0.5 ? 'warm' : 'cold',
      length_km: length * 111
    },
    geometry: {
      type: 'Polygon',
      coordinates: [points]
    }
  };
}

// Check if point is likely over water (simple heuristic)
function isOverWater(lng, lat) {
  // Very rough land mask for East Coast
  // Most features should be offshore (east of coastline)

  // Florida Keys area
  if (lat < 25.5 && lng > -81.5) return true;

  // South Florida
  if (lat < 27 && lng > -80.5) return true;

  // Central Florida
  if (lat < 30 && lng > -81.5) return true;

  // Georgia/SC coast
  if (lat < 33 && lng > -81.0) return true;

  // NC/VA coast
  if (lat < 37 && lng > -76.5) return true;

  // Mid-Atlantic
  if (lat < 40 && lng > -75.0) return true;

  // New England
  if (lat < 42 && lng > -72.0) return true;

  // Maine
  if (lat >= 42 && lng > -70.5) return true;

  // Offshore is always water
  if (lng < -72) return true;

  return false;
}

function generateFeatures() {
  const features = [];

  // Generate features on a grid
  for (let lat = BOUNDS.south; lat <= BOUNDS.north; lat += GRID_SIZE) {
    for (let lng = BOUNDS.west; lng <= BOUNDS.east; lng += GRID_SIZE) {
      // Skip if on land
      if (!isOverWater(lng, lat)) continue;

      // Random offset within cell
      const cellLng = lng + randomInRange(0, GRID_SIZE);
      const cellLat = lat + randomInRange(0, GRID_SIZE);

      if (!isOverWater(cellLng, cellLat)) continue;

      // Generate random features
      const numFeatures = Math.floor(Math.random() * FEATURES_PER_CELL) + 1;

      for (let i = 0; i < numFeatures; i++) {
        const featureLng = cellLng + randomInRange(-0.5, 0.5);
        const featureLat = cellLat + randomInRange(-0.5, 0.5);

        if (!isOverWater(featureLng, featureLat)) continue;

        const featureType = Math.random();

        if (featureType < 0.25) {
          // 25% eddies
          features.push(generateEddy(featureLng, featureLat));
        } else if (featureType < 0.6) {
          // 35% edges (thermal fronts)
          features.push(generateEdge(featureLng, featureLat));
        } else {
          // 40% filaments
          features.push(generateFilament(featureLng, featureLat));
        }
      }
    }
  }

  return features;
}

// Generate the data
console.log('Generating full East Coast polygon data...');
const features = generateFeatures();

const geojson = {
  type: 'FeatureCollection',
  features: features,
  properties: {
    generated_at: new Date().toISOString(),
    coverage: 'US East Coast (Maine to Florida Keys)',
    bounds: BOUNDS,
    feature_count: {
      eddy: features.filter(f => f.properties.class === 'eddy').length,
      edge: features.filter(f => f.properties.class === 'edge').length,
      filament: features.filter(f => f.properties.class === 'filament').length
    }
  }
};

// Write to file
const outputPath = path.join(__dirname, '..', 'public', 'abfi_sst_edges_latest.geojson');
fs.writeFileSync(outputPath, JSON.stringify(geojson));

console.log(`Generated ${features.length} features:`);
console.log(`  - Eddies: ${geojson.properties.feature_count.eddy}`);
console.log(`  - Edges: ${geojson.properties.feature_count.edge}`);
console.log(`  - Filaments: ${geojson.properties.feature_count.filament}`);
console.log(`Saved to: ${outputPath}`);
