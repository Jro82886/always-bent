'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useSnipStore } from '@/store/snip-store';
import { extractRealTileData } from '@/lib/analysis/tile-data-extractor';
import SnipAnalysisModal from './SnipAnalysisModal';
import type { SnipResults, Hotspot, PolygonFeature } from '@/store/snip-store';
import type { LayerStats } from '@/lib/analysis/pixel-extractor';
import * as turf from '@turf/turf';
import { useAppState } from '@/lib/store';

interface SnipToolProps {
  map: mapboxgl.Map | null;
  isActive: boolean;
  onDeactivate: () => void;
}

export default function SnipTool({ map, isActive, onDeactivate }: SnipToolProps) {
  const drawRef = useRef<MapboxDraw | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Get the selected date from the app store
  const { isoDate } = useAppState();

  const {
    startDrawing,
    updateDrawing,
    finishDrawing,
    startAnalysis,
    updateProgress,
    finishAnalysis,
    clearSnip,
    setError,
    returnToOverview,
    cameraBefore
  } = useSnipStore();

  // Initialize MapboxDraw
  useEffect(() => {
    if (!map || drawRef.current) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: 'draw_polygon',
      styles: [
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#0f172a',
            'fill-opacity': 0.45
          }
        },
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': '#334155',
            'line-width': 2
          }
        },
        {
          id: 'gl-draw-vertex',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex']],
          paint: {
            'circle-radius': 4,
            'circle-color': '#334155'
          }
        }
      ]
    });

    map.addControl(draw, 'top-left');
    drawRef.current = draw;

    return () => {
      if (drawRef.current) {
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
    };
  }, [map]);

  // Handle activation/deactivation
  useEffect(() => {
    if (!map || !drawRef.current) return;

    if (isActive) {
      // Enter drawing mode
      drawRef.current.changeMode('draw_polygon');
      map.getCanvas().style.cursor = 'crosshair';
      startDrawing();
      setIsDrawing(true);
    } else {
      // Exit drawing mode
      drawRef.current.deleteAll();
      map.getCanvas().style.cursor = '';
      clearSnip();
      setIsDrawing(false);
    }
  }, [isActive, map, startDrawing, clearSnip]);

  // Listen for draw events
  useEffect(() => {
    if (!map || !drawRef.current) return;

    const handleCreate = async (e: any) => {
      const feature = e.features[0];
      if (!feature) return;

      // Get bounding box
      const coordinates = feature.geometry.coordinates[0];
      const lngs = coordinates.map((c: number[]) => c[0]);
      const lats = coordinates.map((c: number[]) => c[1]);
      const bbox: [[number, number], [number, number]] = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      ];

      // Save current camera position
      const camera = {
        center: map.getCenter().toArray() as [number, number],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
      };

      // Update store with drawing
      finishDrawing(bbox, feature);
      setIsDrawing(false);

      // Start analysis
      startAnalysis(camera);

      // Fit to bounds with padding
      map.fitBounds(bbox, {
        padding: { left: 350, right: 400, top: 48, bottom: 48 },
        duration: 1500,
        essential: true
      });

      // Perform analysis
      await performAnalysis(feature, bbox);
    };

    const handleUpdate = (e: any) => {
      const feature = e.features[0];
      if (feature && feature.geometry.coordinates[0].length > 2) {
        const coords = feature.geometry.coordinates[0];
        updateDrawing(
          [coords[0][0], coords[0][1]],
          [coords[2][0], coords[2][1]]
        );
      }
    };

    map.on('draw.create', handleCreate);
    map.on('draw.update', handleUpdate);

    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', handleUpdate);
    };
  }, [map, finishDrawing, startAnalysis, updateDrawing]);

  // Calculate layer statistics from pixel data
  const calculateLayerStats = (pixels: any[], dataType: 'sst' | 'chl'): LayerStats => {
    if (pixels.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        stdDev: 0,
        coveragePct: 0,
        gradientPerKm: 0,
        pixels: []
      };
    }

    const values = pixels.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    // Calculate standard deviation
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Calculate gradient (simplified)
    let maxGradient = 0;
    for (let i = 0; i < pixels.length - 1; i++) {
      const p1 = pixels[i];
      const p2 = pixels[i + 1];
      const dist = turf.distance([p1.lng, p1.lat], [p2.lng, p2.lat], { units: 'kilometers' });
      if (dist > 0) {
        const gradient = Math.abs(p2.value - p1.value) / dist;
        maxGradient = Math.max(maxGradient, gradient);
      }
    }

    // Convert temperature from F to C if SST
    if (dataType === 'sst') {
      const toC = (f: number) => (f - 32) * 5 / 9;
      return {
        min: toC(min),
        max: toC(max),
        mean: toC(mean),
        stdDev: stdDev * 5 / 9,
        coveragePct: 100, // Assuming full coverage if we have data
        gradientPerKm: maxGradient * 5 / 9,
        pixels: pixels.map(p => ({ ...p, value: toC(p.value) }))
      };
    }

    return {
      min,
      max,
      mean,
      stdDev,
      coveragePct: 100, // Assuming full coverage if we have data
      gradientPerKm: maxGradient,
      pixels
    };
  };

  // Calculate polygon area in km²
  const calculatePolygonArea = (polygon: GeoJSON.Feature<GeoJSON.Polygon>): number => {
    return turf.area(polygon) / 1000000; // Convert from m² to km²
  };

  // Perform the actual analysis
  const performAnalysis = async (
    polygon: GeoJSON.Feature<GeoJSON.Polygon>,
    bbox: [[number, number], [number, number]]
  ) => {
    if (!map) return;

    try {
      // Update progress
      updateProgress(10);

      // Check which layers are visible
      const sstVisible = map.getLayer('sst-lyr') &&
                        map.getLayoutProperty('sst-lyr', 'visibility') !== 'none';
      const chlVisible = map.getLayer('chl-lyr') &&
                        map.getLayoutProperty('chl-lyr', 'visibility') !== 'none';

      // Extract pixel data from canvas
      updateProgress(30);
      const pixelData = await extractRealTileData(
        map,
        polygon,
        { sstEnabled: sstVisible, chlEnabled: chlVisible }
      );

      updateProgress(50);

      // Call analyze API for additional data
      // Use the selected date from the store, or fall back to today
      const dateToUse = isoDate ?
        new Date(isoDate + 'T00:00:00Z').toISOString() :
        new Date().toISOString();

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygon,
          date: dateToUse,
          want: { sst: sstVisible, chl: chlVisible }
        })
      });

      updateProgress(70);

      let apiData: any = {};
      if (analyzeResponse.ok) {
        apiData = await analyzeResponse.json();
      }

      // Call ocean features API
      const bboxString = `${bbox[0][0]},${bbox[0][1]},${bbox[1][0]},${bbox[1][1]}`;
      const featuresResponse = await fetch(
        `/api/ocean-features/live?bbox=${bboxString}&date=${dateToUse}`
      );

      updateProgress(85);

      let oceanFeatures: any[] = [];
      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json();
        oceanFeatures = featuresData.features || [];
      }

      // Process pixelData to calculate statistics
      const sstStats = pixelData.sst.length > 0 ? calculateLayerStats(pixelData.sst, 'sst') : undefined;
      const chlStats = pixelData.chl.length > 0 ? calculateLayerStats(pixelData.chl, 'chl') : undefined;

      // Calculate area
      const areaKm2 = calculatePolygonArea(polygon);

      // Combine all data into results
      const results: SnipResults = {
        sst: sstStats,
        chl: chlStats,
        hotspots: generateHotspots({ sst: sstStats, chl: chlStats, pixels: pixelData }, oceanFeatures),
        polygons: convertToPolygonFeatures(oceanFeatures),
        vessels: apiData.fleet?.vessels || [],
        weather: apiData.weather,
        areaKm2,
        timestamp: new Date().toISOString(),
        dataQuality: determineDataQuality({ sst: sstStats, chl: chlStats })
      };

      // Add hotspots to map
      addHotspotsToMap(results.hotspots);

      // Add polygons to map
      addPolygonsToMap(results.polygons);

      updateProgress(100);
      finishAnalysis(results);

    } catch (error: any) {
      console.error('Analysis failed:', error);
      setError(error.message || 'Analysis failed. Please try again.');
    }
  };

  // Generate hotspots from analysis data
  const generateHotspots = (data: { sst?: LayerStats; chl?: LayerStats; pixels: any }, oceanFeatures: any[]): Hotspot[] => {
    const hotspots: Hotspot[] = [];

    // Generate hotspots from SST gradients
    if (data.sst && data.sst.gradientPerKm > 0.5) {
      // Strong temperature gradient areas
      const sstPixels = data.sst.pixels || [];
      for (let i = 0; i < Math.min(3, sstPixels.length); i++) {
        const pixel = sstPixels[i];
        if (pixel) {
          hotspots.push({
            id: `sst-${i}`,
            lat: pixel.lat,
            lng: pixel.lng,
            confidence: Math.min(0.9, data.sst.gradientPerKm / 2),
            type: 'thermal_front',
            title: 'Temperature Break',
            factors: {
              sst: { value: pixel.value, score: 0.8 },
              gradient: { value: data.sst.gradientPerKm, score: 0.9 }
            }
          });
        }
      }
    }

    // Generate hotspots from CHL concentrations
    if (data.chl && data.chl.mean > 2) {
      // High chlorophyll areas
      const chlPixels = data.chl.pixels || [];
      const highChlPixels = chlPixels
        .filter((p: any) => p.value > 3)
        .slice(0, 2);

      for (const pixel of highChlPixels) {
        hotspots.push({
          id: `chl-${pixel.lat}-${pixel.lng}`,
          lat: pixel.lat,
          lng: pixel.lng,
          confidence: Math.min(0.8, pixel.value / 10),
          type: 'chl_edge',
          title: 'Chlorophyll Bloom',
          factors: {
            chl: { value: pixel.value, score: 0.7 }
          }
        });
      }
    }

    // Add hotspots from ocean features
    for (const feature of oceanFeatures.slice(0, 3)) {
      if (feature.properties?.centroid) {
        hotspots.push({
          id: feature.id || `feature-${Math.random()}`,
          lat: feature.properties.centroid[1],
          lng: feature.properties.centroid[0],
          confidence: feature.properties.confidence || 0.6,
          type: feature.properties.type || 'convergence',
          title: feature.properties.title || 'Ocean Feature',
          factors: {}
        });
      }
    }

    return hotspots;
  };

  // Convert ocean features to polygon features
  const convertToPolygonFeatures = (oceanFeatures: any[]): PolygonFeature[] => {
    return oceanFeatures
      .filter(f => f.geometry?.type === 'Polygon')
      .map(f => ({
        id: f.id || `poly-${Math.random()}`,
        type: f.properties?.type || 'convergence',
        geometry: f.geometry,
        properties: {
          strength: f.properties?.strength || 0.5,
          description: f.properties?.description || 'Ocean feature',
          confidence: f.properties?.confidence || 0.5
        }
      }));
  };

  // Determine data quality based on coverage
  const determineDataQuality = (data: { sst?: LayerStats; chl?: LayerStats }): 'high' | 'medium' | 'low' => {
    const sstCoverage = data.sst?.coveragePct || 0;
    const chlCoverage = data.chl?.coveragePct || 0;
    const avgCoverage = (sstCoverage + chlCoverage) / 2;

    if (avgCoverage > 70) return 'high';
    if (avgCoverage > 40) return 'medium';
    return 'low';
  };

  // Add hotspots to map
  const addHotspotsToMap = (hotspots: Hotspot[]) => {
    if (!map) return;

    // Remove existing hotspots layer if it exists
    if (map.getSource('snip-hotspots')) {
      map.removeLayer('snip-hotspots-glow');
      map.removeLayer('snip-hotspots');
      map.removeSource('snip-hotspots');
    }

    // Create GeoJSON from hotspots
    const geojson = {
      type: 'FeatureCollection',
      features: hotspots.map(h => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [h.lng, h.lat]
        },
        properties: {
          confidence: h.confidence,
          title: h.title,
          type: h.type
        }
      }))
    };

    // Add source
    map.addSource('snip-hotspots', {
      type: 'geojson',
      data: geojson as any
    });

    // Add glow layer
    map.addLayer({
      id: 'snip-hotspots-glow',
      type: 'circle',
      source: 'snip-hotspots',
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'confidence'],
          0.3, 15,
          0.6, 20,
          0.9, 25
        ],
        'circle-color': '#00ffff',
        'circle-opacity': 0.2,
        'circle-blur': 1
      }
    });

    // Add main dots
    map.addLayer({
      id: 'snip-hotspots',
      type: 'circle',
      source: 'snip-hotspots',
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'confidence'],
          0.3, 5,
          0.6, 7,
          0.9, 9
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'type'], 'thermal_front'], '#ff6b6b',
          ['==', ['get', 'type'], 'chl_edge'], '#4ecdc4',
          ['==', ['get', 'type'], 'eddy'], '#ffd93d',
          '#00ffff'
        ],
        'circle-opacity': [
          'interpolate', ['linear'], ['get', 'confidence'],
          0.3, 0.6,
          0.9, 1
        ]
      }
    });
  };

  // Add polygons to map
  const addPolygonsToMap = (polygons: PolygonFeature[]) => {
    if (!map || polygons.length === 0) return;

    // Remove existing polygons layer if it exists
    if (map.getSource('snip-polygons')) {
      map.removeLayer('snip-polygons-fill');
      map.removeLayer('snip-polygons-outline');
      map.removeSource('snip-polygons');
    }

    // Create GeoJSON from polygons
    const geojson = {
      type: 'FeatureCollection',
      features: polygons.map(p => ({
        type: 'Feature',
        geometry: p.geometry,
        properties: {
          id: p.id,
          type: p.type,
          strength: p.properties.strength,
          confidence: p.properties.confidence
        }
      }))
    };

    // Add source
    map.addSource('snip-polygons', {
      type: 'geojson',
      data: geojson as any
    });

    // Add fill layer
    map.addLayer({
      id: 'snip-polygons-fill',
      type: 'fill',
      source: 'snip-polygons',
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'type'], 'thermal_front'], '#ff6b6b',
          ['==', ['get', 'type'], 'chl_edge'], '#4ecdc4',
          ['==', ['get', 'type'], 'eddy'], '#ffd93d',
          '#00ffff'
        ],
        'fill-opacity': 0.1
      }
    });

    // Add outline layer
    map.addLayer({
      id: 'snip-polygons-outline',
      type: 'line',
      source: 'snip-polygons',
      paint: {
        'line-color': [
          'case',
          ['==', ['get', 'type'], 'thermal_front'], '#ff6b6b',
          ['==', ['get', 'type'], 'chl_edge'], '#4ecdc4',
          ['==', ['get', 'type'], 'eddy'], '#ffd93d',
          '#00ffff'
        ],
        'line-width': 2,
        'line-opacity': 0.6
      }
    });
  };

  // Listen for restore camera event
  useEffect(() => {
    const handleRestoreCamera = (e: CustomEvent) => {
      if (!map || !e.detail) return;

      const camera = e.detail;
      map.flyTo({
        center: camera.center,
        zoom: camera.zoom,
        bearing: camera.bearing,
        pitch: camera.pitch,
        duration: 1500
      });
    };

    const handleClearSnip = () => {
      if (!map) return;

      // Remove hotspots
      if (map.getSource('snip-hotspots')) {
        map.removeLayer('snip-hotspots-glow');
        map.removeLayer('snip-hotspots');
        map.removeSource('snip-hotspots');
      }

      // Remove polygons
      if (map.getSource('snip-polygons')) {
        map.removeLayer('snip-polygons-fill');
        map.removeLayer('snip-polygons-outline');
        map.removeSource('snip-polygons');
      }

      // Clear drawing
      if (drawRef.current) {
        drawRef.current.deleteAll();
      }

      // Deactivate tool
      onDeactivate();
    };

    window.addEventListener('snip:restore-camera', handleRestoreCamera as any);
    window.addEventListener('snip:clear', handleClearSnip);

    return () => {
      window.removeEventListener('snip:restore-camera', handleRestoreCamera as any);
      window.removeEventListener('snip:clear', handleClearSnip);
    };
  }, [map, onDeactivate]);

  // Render status panel
  const { isAnalyzing, analysisProgress, error, rectBbox } = useSnipStore();

  return (
    <>
      {/* Status Panel */}
      {isActive && (
        <div className="absolute top-20 left-4 bg-slate-900/95 border border-slate-700 rounded-lg p-4 shadow-xl max-w-xs z-50">
          <h3 className="text-cyan-400 font-semibold mb-2">Analysis Tool</h3>

          {isDrawing && !rectBbox && (
            <p className="text-slate-300 text-sm">
              Click and drag to analyze ocean area
            </p>
          )}

          {isAnalyzing && (
            <div className="space-y-2">
              <p className="text-slate-300 text-sm">Analyzing area...</p>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-2 bg-red-500/20 border border-red-500/50 rounded mt-2">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {rectBbox && !isAnalyzing && (
            <div className="space-y-2">
              <p className="text-slate-300 text-sm">Analysis complete</p>
              <div className="flex gap-2">
                <button
                  onClick={() => returnToOverview()}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
                >
                  Return to Overview
                </button>
                <button
                  onClick={() => {
                    clearSnip();
                    window.dispatchEvent(new CustomEvent('snip:clear'));
                  }}
                  className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis Modal */}
      <SnipAnalysisModal />
    </>
  );
}