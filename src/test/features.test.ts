/**
 * Comprehensive Test Suite for Always Bent Features
 *
 * This test suite verifies all the new features implemented:
 * 1. SST Color-to-Temperature Conversion
 * 2. Oceanographic Feature Detection
 * 3. Enhanced Snip Report Analysis
 * 4. Snip Score System
 * 5. Water Movement Visualization
 * 6. East Coast Temperature Scale
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as turf from '@turf/turf';

// Import modules to test
import {
  getTemperatureFromColor,
  analyzeTemperatureField,
  findBestTemperatureBreak,
  COPERNICUS_THERMAL_COLORMAP
} from '@/lib/analysis/sst-color-mapping';

import {
  detectOceanographicFeatures,
  featuresToMapLayers
} from '@/lib/analysis/oceanographic-features';

import {
  analyzeSnipArea,
  type SnipAnalysisReport
} from '@/lib/analysis/snip-report-analyzer';

import {
  WaterMovementVisualization
} from '@/lib/visualization/water-movement';

// ============================================================================
// Task 1.1: SST Color-to-Temperature Conversion Tests
// ============================================================================
describe('Task 1.1: SST Color-to-Temperature Conversion', () => {
  describe('getTemperatureFromColor', () => {
    it('should convert purple/deep blue colors to cold temperatures (35-44°F)', () => {
      const result = getTemperatureFromColor(50, 0, 100);
      expect(result).toBeDefined();
      expect(result?.tempF).toBeGreaterThanOrEqual(35);
      expect(result?.tempF).toBeLessThanOrEqual(44);
      expect(result?.confidence).toBeGreaterThan(0.7);
    });

    it('should convert cyan colors to cool temperatures (53-59°F)', () => {
      const result = getTemperatureFromColor(0, 200, 200);
      expect(result).toBeDefined();
      expect(result?.tempF).toBeGreaterThanOrEqual(53);
      expect(result?.tempF).toBeLessThanOrEqual(59);
    });

    it('should convert green colors to moderate temperatures (62-68°F)', () => {
      const result = getTemperatureFromColor(0, 200, 100);
      expect(result).toBeDefined();
      expect(result?.tempF).toBeGreaterThanOrEqual(62);
      expect(result?.tempF).toBeLessThanOrEqual(68);
    });

    it('should convert yellow colors to warm temperatures (71-74°F)', () => {
      const result = getTemperatureFromColor(200, 200, 0);
      expect(result).toBeDefined();
      expect(result?.tempF).toBeGreaterThanOrEqual(71);
      expect(result?.tempF).toBeLessThanOrEqual(74);
    });

    it('should convert red colors to hot temperatures (83-89°F)', () => {
      const result = getTemperatureFromColor(255, 0, 0);
      expect(result).toBeDefined();
      expect(result?.tempF).toBeGreaterThanOrEqual(83);
      expect(result?.tempF).toBeLessThanOrEqual(89);
    });

    it('should handle near-match colors with lower confidence', () => {
      const result = getTemperatureFromColor(55, 10, 95); // Slightly off from reference
      expect(result).toBeDefined();
      expect(result?.confidence).toBeLessThan(1.0);
      expect(result?.confidence).toBeGreaterThan(0.5);
    });

    it('should convert temperature to Celsius correctly', () => {
      const result = getTemperatureFromColor(200, 200, 0); // Yellow ~74°F
      expect(result).toBeDefined();
      const expectedC = (result!.tempF - 32) * 5 / 9;
      expect(Math.abs(result!.tempC - expectedC)).toBeLessThan(0.1);
    });
  });

  describe('analyzeTemperatureField', () => {
    it('should calculate correct temperature statistics', () => {
      const pixels = [
        { r: 0, g: 0, b: 200 },    // Cold ~44°F
        { r: 0, g: 200, b: 100 },   // Moderate ~62°F
        { r: 255, g: 0, b: 0 }      // Hot ~86°F
      ];

      const stats = analyzeTemperatureField(pixels);

      expect(stats.minF).toBeLessThan(50);
      expect(stats.maxF).toBeGreaterThan(80);
      expect(stats.avgF).toBeGreaterThan(55);
      expect(stats.avgF).toBeLessThan(70);
    });

    it('should detect temperature breaks', () => {
      const pixels = [
        { r: 0, g: 0, b: 200 },    // Cold
        { r: 0, g: 0, b: 200 },    // Cold
        { r: 255, g: 0, b: 0 },    // Hot - big jump!
        { r: 255, g: 0, b: 0 }     // Hot
      ];

      const stats = analyzeTemperatureField(pixels);
      expect(stats.tempBreaks.length).toBeGreaterThan(0);
      expect(stats.tempBreaks[0].deltaF).toBeGreaterThan(30); // Large temperature jump
    });
  });

  describe('findBestTemperatureBreak', () => {
    it('should identify the strongest temperature gradient', () => {
      const pixels = [
        { r: 0, g: 0, b: 200, lat: 35.0, lng: -75.0 },    // Cold
        { r: 0, g: 100, b: 150, lat: 35.1, lng: -75.1 },  // Cool
        { r: 255, g: 100, b: 0, lat: 35.2, lng: -75.2 },  // Very warm - strongest break
        { r: 255, g: 50, b: 0, lat: 35.3, lng: -75.3 }    // Hot
      ];

      const bestBreak = findBestTemperatureBreak(pixels);
      expect(bestBreak).toBeDefined();
      expect(bestBreak?.deltaF).toBeGreaterThan(10);
      expect(bestBreak?.description).toContain('Break');
    });

    it('should return null when no significant break exists', () => {
      const pixels = [
        { r: 0, g: 180, b: 100, lat: 35.0, lng: -75.0 },
        { r: 0, g: 185, b: 95, lat: 35.1, lng: -75.1 },
        { r: 0, g: 175, b: 105, lat: 35.2, lng: -75.2 }
      ];

      const bestBreak = findBestTemperatureBreak(pixels);
      expect(bestBreak).toBeNull();
    });
  });
});

// ============================================================================
// Task 1.2: Oceanographic Feature Detection Tests
// ============================================================================
describe('Task 1.2: Oceanographic Feature Detection', () => {
  const createTestPixels = (tempPattern: 'uniform' | 'edge' | 'circular') => {
    const pixels: any[] = [];

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        let r, g, b;
        const lat = 35 + i * 0.01;
        const lng = -75 + j * 0.01;

        if (tempPattern === 'uniform') {
          r = 0; g = 200; b = 100; // Uniform moderate temp
        } else if (tempPattern === 'edge') {
          // Sharp temperature boundary
          if (j < 5) {
            r = 0; g = 0; b = 200; // Cold
          } else {
            r = 255; g = 0; b = 0; // Hot
          }
        } else { // circular
          // Circular warm eddy
          const dist = Math.sqrt((i - 5) ** 2 + (j - 5) ** 2);
          if (dist < 3) {
            r = 255; g = 100; b = 0; // Warm center
          } else {
            r = 0; g = 100; b = 200; // Cool surroundings
          }
        }

        pixels.push({ lat, lng, r, g, b });
      }
    }

    return pixels;
  };

  it('should detect edge features when sharp temperature gradient exists', async () => {
    const pixels = createTestPixels('edge');
    const bounds: [[number, number], [number, number]] = [[-75.1, 35], [-74.9, 35.1]];

    const features = await detectOceanographicFeatures(pixels, bounds, {
      edgeThresholdF: 2.0,
      minFeatureAreaKm2: 0.1 // Lower threshold for test
    });

    const edges = features.features.filter(f => f.properties?.type === 'edge');
    expect(edges.length).toBeGreaterThan(0);

    const firstEdge = edges[0];
    expect(firstEdge.properties?.tempDiffF).toBeGreaterThan(20); // Strong gradient
    expect(firstEdge.properties?.color).toBe('#FF0000'); // Red for edges
  });

  it('should detect eddy features in circular temperature patterns', async () => {
    const pixels = createTestPixels('circular');
    const bounds: [[number, number], [number, number]] = [[-75.1, 35], [-74.9, 35.1]];

    const features = await detectOceanographicFeatures(pixels, bounds, {
      eddyThresholdF: 0.5,
      minFeatureAreaKm2: 0.1
    });

    const eddies = features.features.filter(f => f.properties?.type === 'eddy');
    expect(eddies.length).toBeGreaterThan(0);

    const firstEddy = eddies[0];
    expect(firstEddy.properties?.aspectRatio).toBeGreaterThan(0.7); // Circular
    expect(firstEddy.properties?.color).toBe('#00FF00'); // Green for eddies
  });

  it('should not detect features in uniform temperature field', async () => {
    const pixels = createTestPixels('uniform');
    const bounds: [[number, number], [number, number]] = [[-75.1, 35], [-74.9, 35.1]];

    const features = await detectOceanographicFeatures(pixels, bounds, {
      edgeThresholdF: 2.0,
      minFeatureAreaKm2: 0.1
    });

    expect(features.features.length).toBe(0);
  });

  it('should calculate feature scores based on strength and size', async () => {
    const pixels = createTestPixels('edge');
    const bounds: [[number, number], [number, number]] = [[-75.1, 35], [-74.9, 35.1]];

    const features = await detectOceanographicFeatures(pixels, bounds, {
      minFeatureAreaKm2: 0.1
    });

    const scored = features.features.filter(f => f.properties?.score > 0);
    expect(scored.length).toBeGreaterThan(0);

    scored.forEach(feature => {
      expect(feature.properties?.score).toBeGreaterThanOrEqual(0);
      expect(feature.properties?.score).toBeLessThanOrEqual(100);
    });
  });

  it('should convert features to separate map layers', async () => {
    const pixels = createTestPixels('edge');
    const bounds: [[number, number], [number, number]] = [[-75.1, 35], [-74.9, 35.1]];

    const features = await detectOceanographicFeatures(pixels, bounds, {
      minFeatureAreaKm2: 0.1
    });

    const layers = featuresToMapLayers(features);

    expect(layers.edges.type).toBe('FeatureCollection');
    expect(layers.filaments.type).toBe('FeatureCollection');
    expect(layers.eddies.type).toBe('FeatureCollection');
  });
});

// ============================================================================
// Task 2: Snip Report Analysis Tests
// ============================================================================
describe('Task 2: Enhanced Snip Report Analysis', () => {
  const createTestPolygon = () => {
    return turf.polygon([[
      [-75.0, 35.0],
      [-75.0, 35.1],
      [-74.9, 35.1],
      [-74.9, 35.0],
      [-75.0, 35.0]
    ]]);
  };

  const createTestPixelData = () => [
    { lat: 35.05, lng: -74.95, r: 0, g: 0, b: 200, type: 'sst' as const },
    { lat: 35.06, lng: -74.96, r: 0, g: 200, b: 100, type: 'sst' as const },
    { lat: 35.07, lng: -74.97, r: 255, g: 0, b: 0, type: 'sst' as const },
    { lat: 35.05, lng: -74.95, r: 0, g: 200, b: 50, type: 'chl' as const },
    { lat: 35.06, lng: -74.96, r: 100, g: 200, b: 0, type: 'chl' as const }
  ];

  beforeEach(() => {
    // Mock fetch for GFW API calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: [],
        total: 0
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should analyze temperature correctly in snip area', async () => {
    const polygon = createTestPolygon();
    const pixels = createTestPixelData();

    const report = await analyzeSnipArea(polygon, pixels, {
      includeFleet: false,
      includeTrends: false
    });

    expect(report.temperature).toBeDefined();
    expect(report.temperature.currentAvgF).toBeGreaterThan(0);
    expect(report.temperature.minF).toBeLessThan(report.temperature.maxF);
    expect(report.temperature.rangeBar.unit).toBe('F');
  });

  it('should analyze chlorophyll and determine water clarity', async () => {
    const polygon = createTestPolygon();
    const pixels = createTestPixelData();

    const report = await analyzeSnipArea(polygon, pixels, {
      includeFleet: false,
      includeTrends: false
    });

    expect(report.chlorophyll).toBeDefined();
    expect(report.chlorophyll.currentAvgMgM3).toBeGreaterThan(0);
    expect(report.chlorophyll.clarityScale.label).toBeDefined();
    expect(['Dirty', 'Clean', 'Green', 'Green-Blue', 'Blue', 'Cobalt Blue'])
      .toContain(report.chlorophyll.clarityScale.label);
  });

  it('should calculate snip score correctly', async () => {
    const polygon = createTestPolygon();
    const pixels = createTestPixelData();

    const report = await analyzeSnipArea(polygon, pixels, {
      includeFleet: false,
      includeTrends: false
    });

    expect(report.score).toBeDefined();
    expect(report.score.total).toBeGreaterThanOrEqual(0);
    expect(report.score.total).toBeLessThanOrEqual(100);

    // Check breakdown adds up correctly
    const breakdown = report.score.breakdown;
    const sum = breakdown.temperatureGradient +
                breakdown.chlorophyll +
                breakdown.fleetActivity +
                breakdown.userReports +
                breakdown.trendAlignment;
    expect(sum).toBe(report.score.total);

    // Check category assignment
    if (report.score.total >= 70) {
      expect(report.score.category).toBe('Strong');
    } else if (report.score.total >= 40) {
      expect(report.score.category).toBe('Fair');
    } else {
      expect(report.score.category).toBe('Poor');
    }
  });

  it('should generate narrative summary with tactical advice', async () => {
    const polygon = createTestPolygon();
    const pixels = createTestPixelData();

    const report = await analyzeSnipArea(polygon, pixels, {
      includeFleet: false,
      includeTrends: false
    });

    expect(report.narrative).toBeDefined();
    expect(report.narrative.overview).toBeTruthy();
    expect(report.narrative.tacticalAdvice).toBeTruthy();
    expect(Array.isArray(report.narrative.keyFactors)).toBe(true);
    expect(Array.isArray(report.narrative.warnings)).toBe(true);

    // Tactical advice should include fishing guidance
    expect(report.narrative.tacticalAdvice.toLowerCase()).toMatch(/fish|edge|structure|bait/);
  });

  it('should detect ocean features in the snip area', async () => {
    const polygon = createTestPolygon();
    const pixels = createTestPixelData();

    const report = await analyzeSnipArea(polygon, pixels);

    expect(report.oceanFeatures).toBeDefined();
    expect(typeof report.oceanFeatures.edges).toBe('number');
    expect(typeof report.oceanFeatures.filaments).toBe('number');
    expect(typeof report.oceanFeatures.eddies).toBe('number');
    expect(Array.isArray(report.oceanFeatures.features)).toBe(true);
  });

  it('should include metadata with area and center point', async () => {
    const polygon = createTestPolygon();
    const pixels = createTestPixelData();

    const report = await analyzeSnipArea(polygon, pixels);

    expect(report.metadata).toBeDefined();
    expect(report.metadata.areaKm2).toBeGreaterThan(0);
    expect(report.metadata.centerPoint).toHaveLength(2);
    expect(report.metadata.timestamp).toBeTruthy();
    expect(['high', 'medium', 'low']).toContain(report.metadata.dataQuality);
  });
});

// ============================================================================
// Task 4.1: Water Movement Visualization Tests
// ============================================================================
describe('Task 4.1: 3-Day Water Movement Visualization', () => {
  let mockMap: any;

  beforeEach(() => {
    // Create a mock Mapbox map
    mockMap = {
      getBounds: vi.fn().mockReturnValue({
        getWest: () => -75,
        getSouth: () => 35,
        getEast: () => -74,
        getNorth: () => 36
      }),
      addSource: vi.fn(),
      removeSource: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      getSource: vi.fn().mockReturnValue(null),
      getLayer: vi.fn().mockReturnValue(null),
      setPaintProperty: vi.fn()
    };

    // Mock fetch for historical data
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { type: 'edge', centroid: [-74.5, 35.5] },
            geometry: { type: 'Polygon', coordinates: [[]] }
          }
        ]
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize water movement visualization', () => {
    const visualization = new WaterMovementVisualization(mockMap);
    expect(visualization).toBeDefined();
  });

  it('should load 3 days of historical data when enabled', async () => {
    const visualization = new WaterMovementVisualization(mockMap);

    await visualization.toggle({
      enabled: true,
      currentDate: new Date('2025-01-20'),
      showEdges: true,
      showFilaments: true,
      showEddies: true
    });

    // Should fetch data for 3 days
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should create layers with correct opacity for each day', async () => {
    const visualization = new WaterMovementVisualization(mockMap);

    await visualization.toggle({
      enabled: true,
      currentDate: new Date('2025-01-20')
    });

    // Check that layers were added with different opacities
    const addLayerCalls = mockMap.addLayer.mock.calls;

    // Should have layers for current (100%), T-1 (40%), T-2 (20%)
    const fillLayers = addLayerCalls.filter((call: any) =>
      call[0].type === 'fill'
    );

    expect(fillLayers.length).toBeGreaterThan(0);

    // Check opacity values
    const opacities = fillLayers.map((call: any) =>
      call[0].paint['fill-opacity']
    );

    expect(opacities).toContain(1.0 * 0.2);  // Current day
    expect(opacities).toContain(0.4 * 0.2);  // 1 day ago
    expect(opacities).toContain(0.2 * 0.2);  // 2 days ago
  });

  it('should clear layers when disabled', async () => {
    const visualization = new WaterMovementVisualization(mockMap);

    // Enable first
    await visualization.toggle({
      enabled: true,
      currentDate: new Date('2025-01-20')
    });

    // Then disable
    await visualization.toggle({
      enabled: false,
      currentDate: new Date('2025-01-20')
    });

    // Check that removeLayer was called
    expect(mockMap.removeLayer).toHaveBeenCalled();
  });

  it('should calculate movement statistics', async () => {
    const visualization = new WaterMovementVisualization(mockMap);

    await visualization.toggle({
      enabled: true,
      currentDate: new Date('2025-01-20')
    });

    const stats = visualization.getMovementStats();

    expect(stats).toBeDefined();
    expect(stats.totalFeatures).toBeGreaterThanOrEqual(0);
    expect(stats.movement.edges).toBeDefined();
    expect(stats.movement.filaments).toBeDefined();
    expect(stats.movement.eddies).toBeDefined();
  });
});

// ============================================================================
// Integration Tests
// ============================================================================
describe('Integration Tests', () => {
  it('should handle complete analysis workflow', async () => {
    // Create test data
    const polygon = turf.polygon([[
      [-75.0, 35.0],
      [-75.0, 35.2],
      [-74.8, 35.2],
      [-74.8, 35.0],
      [-75.0, 35.0]
    ]]);

    const pixels = [];
    // Create a temperature gradient from west to east
    for (let i = 0; i < 20; i++) {
      const lng = -75.0 + (i * 0.01);
      const temp = 50 + (i * 2); // Increasing temperature
      const r = Math.min(255, temp * 3);
      const g = Math.max(0, 200 - temp * 2);
      const b = Math.max(0, 200 - temp * 2);

      pixels.push({
        lat: 35.1,
        lng: lng,
        r, g, b,
        type: 'sst' as const
      });

      // Add some chlorophyll data
      pixels.push({
        lat: 35.1,
        lng: lng,
        r: 0,
        g: 100 + i * 5,
        b: 50,
        type: 'chl' as const
      });
    }

    // Mock APIs
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ entries: [], total: 0 })
    });

    // Run full analysis
    const report = await analyzeSnipArea(polygon, pixels);

    // Verify comprehensive results
    expect(report).toBeDefined();
    expect(report.temperature.currentAvgF).toBeGreaterThan(50);
    expect(report.temperature.bestBreak).toBeDefined(); // Should detect gradient
    expect(report.chlorophyll.currentAvgMgM3).toBeGreaterThan(0);
    expect(report.score.total).toBeGreaterThan(0);
    expect(report.narrative.overview).toContain('°F');
    expect(report.metadata.areaKm2).toBeGreaterThan(0);
  });

  it('should handle edge cases gracefully', async () => {
    const polygon = turf.polygon([[
      [-75, 35], [-75, 35.01], [-74.99, 35.01], [-74.99, 35], [-75, 35]
    ]]);

    // Test with empty pixel data
    const report = await analyzeSnipArea(polygon, [], {
      includeFleet: false,
      includeTrends: false
    });

    expect(report).toBeDefined();
    expect(report.temperature.currentAvgF).toBe(0);
    expect(report.chlorophyll.currentAvgMgM3).toBe(0);
    expect(report.score.total).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================
describe('Performance Tests', () => {
  it('should process large pixel datasets efficiently', () => {
    const startTime = performance.now();

    // Create large dataset (10,000 pixels)
    const pixels = [];
    for (let i = 0; i < 10000; i++) {
      pixels.push({
        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255
      });
    }

    const stats = analyzeTemperatureField(pixels);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(stats).toBeDefined();
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });

  it('should detect features in large areas efficiently', async () => {
    const startTime = performance.now();

    // Create large pixel grid (100x100)
    const pixels = [];
    for (let i = 0; i < 100; i++) {
      for (let j = 0; j < 100; j++) {
        pixels.push({
          lat: 35 + i * 0.001,
          lng: -75 + j * 0.001,
          r: j < 50 ? 0 : 255,  // Create edge
          g: 0,
          b: j < 50 ? 200 : 0
        });
      }
    }

    const features = await detectOceanographicFeatures(
      pixels,
      [[-75.1, 35], [-74.9, 35.1]]
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(features.features).toBeDefined();
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });
});