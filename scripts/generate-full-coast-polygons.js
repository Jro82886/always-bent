#!/usr/bin/env node
/**
 * Generate REALISTIC oceanographic polygon GeoJSON covering the FULL US East Coast
 *
 * OPTION 2: Parametric curves with 2D direction vectors
 * - Models how ocean currents ACTUALLY flow: particles moving in directions
 * - Both lat and lng change each step based on heading
 * - Direction influenced by: base Gulf Stream path + 2D noise + momentum
 * - Creates truly organic flowing curves, not stair-steps
 */

const fs = require('fs');
const path = require('path');

// 2D Perlin noise implementation for organic direction changes
class PerlinNoise2D {
  constructor(seed = Math.random() * 10000) {
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;

    // Seed-based shuffle
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }

    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

  lerp(a, b, t) { return a + t * (b - a); }

  grad2d(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
  }

  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const A = this.perm[X] + Y;
    const B = this.perm[X + 1] + Y;

    return this.lerp(
      this.lerp(this.grad2d(this.perm[A], x, y), this.grad2d(this.perm[B], x - 1, y), u),
      this.lerp(this.grad2d(this.perm[A + 1], x, y - 1), this.grad2d(this.perm[B + 1], x - 1, y - 1), u),
      v
    ) * 0.5 + 0.5; // Normalize to 0-1
  }

  // Fractal Brownian Motion for multi-scale organic variation
  fbm(x, y, octaves = 4) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let max = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      max += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / max;
  }
}

const noise = new PerlinNoise2D(42);

// Coastline
function getCoastlineLongitude(lat) {
  if (lat < 25) return -80.0;
  if (lat < 26) return -80.1;
  if (lat < 27) return -80.0;
  if (lat < 28) return -80.3;
  if (lat < 29) return -80.8;
  if (lat < 30) return -81.2;
  if (lat < 31) return -81.4;
  if (lat < 32) return -80.9;
  if (lat < 33) return -79.5;
  if (lat < 34) return -78.5;
  if (lat < 35) return -76.5;
  if (lat < 36) return -75.8;
  if (lat < 37) return -75.8;
  if (lat < 38) return -76.0;
  if (lat < 39) return -74.8;
  if (lat < 40) return -74.0;
  if (lat < 41) return -73.8;
  if (lat < 42) return -72.5;
  if (lat < 43) return -70.5;
  if (lat < 44) return -69.8;
  if (lat < 45) return -69.0;
  return -67.0;
}

// Gulf Stream waypoints - key locations the current passes through
// Format: [lat, lng, baseHeading] - heading in degrees (0=N, 90=E)
const GULF_STREAM_WAYPOINTS = [
  [24.5, -80.0, 45],   // Florida Keys - heading NE
  [26.5, -79.5, 35],   // Palm Beach - turning more north
  [29.0, -79.0, 40],   // Cape Canaveral
  [31.0, -79.0, 50],   // Georgia - heading more east
  [33.0, -77.5, 45],   // Cape Fear
  [35.5, -74.5, 55],   // Cape Hatteras - major bend eastward
  [37.5, -73.0, 50],   // Virginia
  [39.5, -71.5, 55],   // New Jersey offshore
  [41.0, -69.0, 60],   // Georges Bank
  [43.0, -66.5, 65],   // Gulf of Maine
  [45.0, -64.0, 70],   // Nova Scotia approach
];

/**
 * Get interpolated target position and heading for a given progress (0-1)
 */
function getGulfStreamTarget(progress) {
  const numSegments = GULF_STREAM_WAYPOINTS.length - 1;
  const segmentProgress = progress * numSegments;
  const segmentIndex = Math.min(Math.floor(segmentProgress), numSegments - 1);
  const t = segmentProgress - segmentIndex;

  const wp1 = GULF_STREAM_WAYPOINTS[segmentIndex];
  const wp2 = GULF_STREAM_WAYPOINTS[segmentIndex + 1];

  // Smooth interpolation using smoothstep
  const smooth = t * t * (3 - 2 * t);

  return {
    lat: wp1[0] + smooth * (wp2[0] - wp1[0]),
    lng: wp1[1] + smooth * (wp2[1] - wp1[1]),
    heading: wp1[2] + smooth * (wp2[2] - wp1[2])
  };
}

/**
 * Generate ONE long, organic, meandering line following the Gulf Stream
 * Uses DIRECTION-BASED particle flow for natural curves
 */
function generateMainGulfStreamFront(id, seed) {
  const coords = [];

  // Starting position
  let lat = 24.5;
  let lng = -80.0;
  let heading = 45; // degrees, 0=N, 90=E

  const stepSize = 0.08; // Distance traveled per step (in degrees)
  const numSteps = 500;

  const noiseScale = 0.5; // Scale for noise sampling
  const noiseOffset = seed * 100;

  for (let i = 0; i <= numSteps; i++) {
    coords.push([lng, lat]);

    // Progress along the path (0 to 1)
    const progress = i / numSteps;

    // Get target position and heading from waypoints
    const target = getGulfStreamTarget(progress);

    // Calculate direction TO target (for attraction)
    const dlat = target.lat - lat;
    const dlng = target.lng - lng;
    const targetDirection = Math.atan2(dlng, dlat) * 180 / Math.PI;

    // 2D noise for organic meanders - sample at current position
    const noiseValue = noise.fbm(lat * noiseScale + noiseOffset, lng * noiseScale, 4);
    const noiseAngle = (noiseValue - 0.5) * 60; // ±30 degrees from noise

    // Blend: base heading + noise + attraction to target path
    const attractionStrength = 0.3;
    const noiseStrength = 0.4;
    const momentumStrength = 0.3;

    // Calculate target heading considering all factors
    let targetHeading = target.heading + noiseAngle;

    // Add attraction toward the target path if we've drifted
    const distToTarget = Math.sqrt(dlat * dlat + dlng * dlng);
    if (distToTarget > 0.5) {
      targetHeading = targetHeading * (1 - attractionStrength) + targetDirection * attractionStrength;
    }

    // Apply momentum for smooth direction changes
    heading = heading * momentumStrength + targetHeading * (1 - momentumStrength);

    // Convert heading to radians and move
    const headingRad = heading * Math.PI / 180;

    // Move in the heading direction
    // Adjust longitude step for latitude (degrees are smaller near poles)
    const latStep = Math.cos(headingRad) * stepSize;
    const lngStep = Math.sin(headingRad) * stepSize / Math.cos(lat * Math.PI / 180);

    lat += latStep;
    lng += lngStep;

    // Stop if we've gone too far
    if (lat > 45 || lng > -62) break;
  }

  return {
    type: 'Feature',
    properties: {
      class: 'eddy',  // GREEN
      feature_type: 'gulf_stream_front',
      id: `main_front_${id}`
    },
    geometry: {
      type: 'LineString',
      coordinates: coords
    }
  };
}

/**
 * Generate a secondary meandering front (parallel to main)
 * Uses direction-based flow like the main front
 */
function generateSecondaryFront(startLat, startLng, endLat, lngOffset, id, seed) {
  const coords = [];

  // Starting position offset from main stream
  let lat = startLat;
  let lng = startLng + lngOffset;
  let heading = 50; // Slightly different initial heading

  const stepSize = 0.06;
  const numSteps = Math.floor((endLat - startLat) * 20);

  const noiseScale = 0.6;
  const noiseOffset = seed * 77;

  for (let i = 0; i <= numSteps; i++) {
    coords.push([lng, lat]);

    const progress = i / numSteps;

    // Get target from main Gulf Stream path
    const target = getGulfStreamTarget(progress * 0.8 + 0.1); // Offset progress

    // 2D noise for meanders
    const noiseValue = noise.fbm(lat * noiseScale + noiseOffset, lng * noiseScale + 50, 4);
    const noiseAngle = (noiseValue - 0.5) * 50; // ±25 degrees

    // Blend heading with noise
    let targetHeading = target.heading + noiseAngle;

    // Momentum for smooth flow
    heading = heading * 0.4 + targetHeading * 0.6;

    const headingRad = heading * Math.PI / 180;
    const latStep = Math.cos(headingRad) * stepSize;
    const lngStep = Math.sin(headingRad) * stepSize / Math.cos(lat * Math.PI / 180);

    lat += latStep;
    lng += lngStep;

    if (lat > endLat || lng > -62) break;
  }

  return {
    type: 'Feature',
    properties: {
      class: 'eddy',  // GREEN
      feature_type: 'thermal_front',
      id: `front_${id}`
    },
    geometry: {
      type: 'LineString',
      coordinates: coords
    }
  };
}

/**
 * Generate organic CYAN filament - irregular elongated blob
 * Uses 2D noise for truly organic shapes
 */
function generateOrganicFilament(centerLat, centerLng, id, seed) {
  const coords = [];

  // Random elongation and orientation
  const length = 0.15 + Math.random() * 0.35;
  const width = 0.04 + Math.random() * 0.06;
  const angle = Math.random() * Math.PI;
  const numPoints = 32;

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * 2 * Math.PI;

    // 2D noise for irregular boundary
    const noiseVal = noise.fbm(
      centerLat + Math.cos(t) * 0.5 + seed,
      centerLng + Math.sin(t) * 0.5,
      3
    );
    const radiusVariation = 0.7 + noiseVal * 0.6;

    const baseX = Math.cos(t) * length * radiusVariation;
    const baseY = Math.sin(t) * width * radiusVariation;

    // Rotate
    const x = baseX * Math.cos(angle) - baseY * Math.sin(angle);
    const y = baseX * Math.sin(angle) + baseY * Math.cos(angle);

    // Adjust for latitude
    const lngOffset = x / Math.cos(centerLat * Math.PI / 180);

    coords.push([centerLng + lngOffset, centerLat + y]);
  }
  coords[coords.length - 1] = [...coords[0]];

  return {
    type: 'Feature',
    properties: {
      class: 'filament',  // CYAN
      feature_type: 'filament',
      id: `filament_${id}`
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coords]
    }
  };
}

/**
 * Generate small ORANGE patch - irregular small blob
 * Uses 2D noise for organic shapes
 */
function generateSmallPatch(centerLat, centerLng, id, seed) {
  const coords = [];
  const size = 0.02 + Math.random() * 0.03;
  const numPoints = 12 + Math.floor(Math.random() * 6);

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * 2 * Math.PI;

    // 2D noise for irregular boundary
    const noiseVal = noise.fbm(
      centerLat + Math.cos(t) * 0.3 + seed * 0.1,
      centerLng + Math.sin(t) * 0.3,
      2
    );
    const radiusVar = 0.6 + noiseVal * 0.8;
    const r = size * radiusVar;

    const dlng = r * Math.cos(t) / Math.cos(centerLat * Math.PI / 180);
    const dlat = r * Math.sin(t);

    coords.push([centerLng + dlng, centerLat + dlat]);
  }
  coords[coords.length - 1] = [...coords[0]];

  return {
    type: 'Feature',
    properties: {
      class: 'edge',  // ORANGE
      feature_type: 'patch',
      id: `patch_${id}`
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coords]
    }
  };
}

/**
 * Generate GREEN eddy - irregular circle
 * Uses 2D noise for organic shapes
 */
function generateEddy(centerLat, centerLng, id, seed) {
  const coords = [];
  const radius = 0.1 + Math.random() * 0.15;
  const numPoints = 28;

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * 2 * Math.PI;

    // 2D noise for irregular boundary
    const noiseVal = noise.fbm(
      centerLat + Math.cos(t) * 0.4 + seed * 0.2,
      centerLng + Math.sin(t) * 0.4,
      3
    );
    const radiusVar = 0.7 + noiseVal * 0.6;
    const r = radius * radiusVar;

    const dlng = r * Math.cos(t) / Math.cos(centerLat * Math.PI / 180);
    const dlat = r * Math.sin(t);

    coords.push([centerLng + dlng, centerLat + dlat]);
  }
  coords[coords.length - 1] = [...coords[0]];

  return {
    type: 'Feature',
    properties: {
      class: 'eddy',  // GREEN
      feature_type: 'eddy',
      id: `eddy_${id}`
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coords]
    }
  };
}

// Main generation
function generateFullCoastPolygons() {
  const features = [];
  let featureId = 0;

  console.log('Generating ORGANIC oceanographic features (Option 2: Direction-based flow)...');
  console.log('Target: Natural flowing curves like real satellite data\n');

  // 1. ONE MAIN Gulf Stream front (the big green line)
  console.log('1. Main Gulf Stream front (GREEN) - direction-based flow...');
  features.push(generateMainGulfStreamFront(featureId++, 1));

  // 2. A few secondary/parallel fronts with direction-based flow
  console.log('2. Secondary fronts (GREEN) - direction-based flow...');
  // generateSecondaryFront(startLat, startLng, endLat, lngOffset, id, seed)
  features.push(generateSecondaryFront(33, -77.0, 43, 0.8, featureId++, 2));   // Offshore
  features.push(generateSecondaryFront(27, -79.5, 38, -0.5, featureId++, 3));  // Inshore
  features.push(generateSecondaryFront(36, -73.5, 44, 1.5, featureId++, 4));   // Far offshore NE

  // 3. Organic filaments (CYAN)
  console.log('3. Filaments (CYAN)...');
  for (let lat = 25; lat <= 44; lat += 1.5) {
    const coastLng = getCoastlineLongitude(lat);
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const lng = coastLng + 0.5 + Math.random() * 2.0;
      features.push(generateOrganicFilament(
        lat + (Math.random() - 0.5) * 1.0,
        lng,
        featureId++,
        featureId
      ));
    }
  }

  // 4. Small patches (ORANGE)
  console.log('4. Small patches (ORANGE)...');
  for (let lat = 25; lat <= 44; lat += 0.7) {
    const coastLng = getCoastlineLongitude(lat);
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const lng = coastLng + 0.3 + Math.random() * 2.5;
      features.push(generateSmallPatch(
        lat + (Math.random() - 0.5) * 0.5,
        lng,
        featureId++,
        featureId
      ));
    }
  }

  // 5. A few eddies (GREEN circles)
  console.log('5. Eddies (GREEN)...');
  const eddySpots = [
    { lat: 34, lng: -74 },
    { lat: 37, lng: -71 },
    { lat: 40, lng: -68 },
    { lat: 42, lng: -66 },
  ];
  for (const spot of eddySpots) {
    features.push(generateEddy(
      spot.lat + (Math.random() - 0.5) * 0.5,
      spot.lng + (Math.random() - 0.5) * 0.5,
      featureId++,
      featureId
    ));
  }

  console.log(`\nGenerated ${features.length} features`);

  const greenLines = features.filter(f => f.properties.class === 'eddy' && f.geometry.type === 'LineString').length;
  const greenEddies = features.filter(f => f.properties.class === 'eddy' && f.geometry.type === 'Polygon').length;
  const orangePatches = features.filter(f => f.properties.class === 'edge').length;
  const cyanFilaments = features.filter(f => f.properties.class === 'filament').length;

  console.log(`  GREEN lines: ${greenLines}`);
  console.log(`  GREEN eddies: ${greenEddies}`);
  console.log(`  ORANGE patches: ${orangePatches}`);
  console.log(`  CYAN filaments: ${cyanFilaments}`);

  return {
    type: 'FeatureCollection',
    features,
    properties: {
      generated_at: new Date().toISOString(),
      coverage: 'Full US East Coast',
      source: 'organic-v4'
    }
  };
}

// Run
const geojson = generateFullCoastPolygons();
const outputPath = path.join(__dirname, '..', 'public', 'abfi_sst_edges_latest.geojson');
fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
console.log(`\nSaved to: ${outputPath}`);
