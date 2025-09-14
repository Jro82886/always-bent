'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { getVesselTracksInArea } from '@/lib/analysis/trackAnalyzer';
import { analyzeMultiLayer, generateMockSSTData, generateMockCHLData } from '@/lib/analysis/sst-analyzer';
import type { AnalysisResult } from '@/lib/analysis/sst-analyzer';
import { Maximize2, Loader2, Target, TrendingUp } from 'lucide-react';

interface SnipToolProps {
  map: mapboxgl.Map | null;
  onAnalysisComplete: (analysis: AnalysisResult) => void;
  isActive?: boolean;
}

// Helper functions for map visualizations
function visualizeHotspotOnMap(map: mapboxgl.Map, hotspot: any) {
  if (!hotspot || !hotspot.location) return;
  
  // Ensure source exists
  if (!map.getSource('snip-hotspots')) {
    map.addSource('snip-hotspots', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }
  
  // Add hotspot layer if not exists
  if (!map.getLayer('snip-hotspots-layer')) {
    map.addLayer({
      id: 'snip-hotspots-layer',
      type: 'circle',
      source: 'snip-hotspots',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'confidence'],
          0.5, 10,
          1.0, 20
        ],
        'circle-color': '#ff6b6b',
        'circle-opacity': 0.8,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2
      }
    });
    
    // Add pulsing effect layer
    map.addLayer({
      id: 'snip-hotspots-pulse',
      type: 'circle',
      source: 'snip-hotspots',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'confidence'],
          0.5, 20,
          1.0, 40
        ],
        'circle-color': '#ff6b6b',
        'circle-opacity': 0.3,
        'circle-stroke-width': 0
      }
    });
  }
  
  // Update data
  const source = map.getSource('snip-hotspots') as mapboxgl.GeoJSONSource;
  source.setData({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        confidence: hotspot.confidence,
        type: hotspot.type,
        description: `${Math.round(hotspot.confidence * 100)}% confidence hotspot`
      },
      geometry: {
        type: 'Point',
        coordinates: hotspot.location
      }
    }]
  });
}

function visualizeEdgesOnMap(map: mapboxgl.Map, features: any[]) {
  if (!features || features.length === 0) return;
  
  // Ensure source exists
  if (!map.getSource('snip-edges')) {
    map.addSource('snip-edges', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }
  
  // Add edge layer if not exists
  if (!map.getLayer('snip-edges-layer')) {
    map.addLayer({
      id: 'snip-edges-layer',
      type: 'line',
      source: 'snip-edges',
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['get', 'strength'],
          0, '#00d4ff',
          0.5, '#ffaa00',
          1, '#ff0000'
        ],
        'line-width': 3,
        'line-opacity': 0.7
      }
    });
  }
  
  // Convert features to lines if they have geometry
  const edgeFeatures = features
    .filter(f => f.geometry)
    .map(f => ({
      type: 'Feature' as const,
      properties: {
        strength: f.properties?.score || 0.5,
        type: f.type,
        gradient: f.properties?.grad_f_per_km_mean || 0
      },
      geometry: f.geometry
    }));
  
  if (edgeFeatures.length > 0) {
    const source = map.getSource('snip-edges') as mapboxgl.GeoJSONSource;
    source.setData({
      type: 'FeatureCollection',
      features: edgeFeatures
    });
  }
}

export default function SnipTool({ map, onAnalysisComplete, isActive = false }: SnipToolProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentArea, setCurrentArea] = useState<number>(0);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [hasAnalysisResults, setHasAnalysisResults] = useState(false);
  
  // Use refs for mouse tracking
  const startPoint = useRef<[number, number] | null>(null);
  const currentPolygon = useRef<any>(null);

  // Start drawing mode
  const startDrawing = useCallback(() => {
    if (!map) {
      console.log('[SNIP] No map available');
      return;
    }

    console.log('[SNIP] Starting drawing mode');
    
    // Clear any previous analysis before starting new one
    clearDrawing();
    setHasAnalysisResults(false);
    setLastAnalysis(null);
    
    setIsDrawing(true);
    startPoint.current = null;
    
    // Change cursor with enhanced visibility
    const canvas = map.getCanvas();
    canvas.style.cursor = 'crosshair';
    
    // Add visual feedback class to canvas
    canvas.classList.add('snipping-active');
    
    // Add CSS for enhanced cursor if not already present
    if (!document.getElementById('snip-cursor-styles')) {
      const style = document.createElement('style');
      style.id = 'snip-cursor-styles';
      style.textContent = `
        .snipping-active {
          position: relative;
          outline: 2px solid rgba(0, 212, 255, 0.3);
          outline-offset: -2px;
          box-shadow: inset 0 0 20px rgba(0, 212, 255, 0.1);
        }
      `;
      document.head.appendChild(style);
    }
    
    // Disable map interactions
    map.dragPan.disable();
    map.dragRotate.disable();
    map.doubleClickZoom.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    
    // Clear any existing rectangle
    if (map.getSource('snip-rectangle')) {
      const source = map.getSource('snip-rectangle') as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    
    // Update button text
    const button = document.querySelector('button[onclick*="Analyze"]');
    if (button && button.textContent?.includes('Select')) {
      const originalText = button.innerHTML;
      button.innerHTML = `
        <svg class="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" stroke-dasharray="3 3" />
        </svg>
        Drawing... Click and drag
      `;
      // Store original text for restoration
      (window as any).__originalButtonText = originalText;
    }
  }, [map]);

  // Clear drawing
  const clearDrawing = useCallback(() => {
    if (!map) return;
    
    console.log('[SNIP] Clearing drawing');
    setIsDrawing(false);
    setIsAnalyzing(false);
    setCurrentArea(0);
    startPoint.current = null;
    currentPolygon.current = null;
    
    // Reset cursor
    const canvas = map.getCanvas();
    canvas.style.cursor = '';
    canvas.classList.remove('snipping-active');
    
    // Re-enable map interactions
    map.dragPan.enable();
    map.dragRotate.enable();
    map.doubleClickZoom.enable();
    map.scrollZoom.enable();
    map.boxZoom.enable();
    
    // Clear rectangle
    if (map.getSource('snip-rectangle')) {
      const source = map.getSource('snip-rectangle') as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    
    // Clear analysis visualizations too
    if (map.getSource('snip-hotspots')) {
      const source = map.getSource('snip-hotspots') as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    
    if (map.getSource('snip-edges')) {
      const source = map.getSource('snip-edges') as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    
    // Clear analysis state
    setHasAnalysisResults(false);
    setLastAnalysis(null);
    
    // Restore button text
    const button = document.querySelector('button[onclick*="Analyze"]');
    if (button && (window as any).__originalButtonText) {
      button.innerHTML = (window as any).__originalButtonText;
      delete (window as any).__originalButtonText;
    }
  }, [map]);

  // Update rectangle
  const updateRectangle = useCallback((corner1: [number, number], corner2: [number, number]) => {
    if (!map || !map.getSource('snip-rectangle')) return;
    
    const minX = Math.min(corner1[0], corner2[0]);
    const maxX = Math.max(corner1[0], corner2[0]);
    const minY = Math.min(corner1[1], corner2[1]);
    const maxY = Math.max(corner1[1], corner2[1]);
    
    const coords: [number, number][] = [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
      [minX, minY]
    ];
    
    const polygon = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords]
      }
    };
    
    // Create corner points for enhanced visibility
    const cornerPoints = coords.slice(0, 4).map(coord => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Point' as const,
        coordinates: coord
      }
    }));
    
    const source = map.getSource('snip-rectangle') as mapboxgl.GeoJSONSource;
    source.setData({
      type: 'FeatureCollection',
      features: [polygon, ...cornerPoints]
    });
    
    // Calculate area
    const polygonFeature = turf.polygon([coords]);
    const areaM2 = turf.area(polygonFeature);
    setCurrentArea(areaM2 / 1000000);
    currentPolygon.current = polygon;
  }, [map]);

  // Complete drawing and analyze
  const completeDrawing = useCallback(async () => {
    if (!map || !currentPolygon.current) return;
    
    console.log('[SNIP] Completing drawing and analyzing...');
    setIsAnalyzing(true);
    
    try {
      const polygon = currentPolygon.current;
      
      // Step 1: Get vessel tracks
      console.log('[SNIP] Step 1: Getting vessel tracks...');
      const vesselData = await getVesselTracksInArea(polygon, map);
      console.log('[SNIP] Found vessel tracks:', vesselData.tracks.length);
      
      // Step 2: Check active layers
      console.log('[SNIP] Step 2: Checking active layers...');
      const activeLayers = {
        sst: map.getLayer('sst-lyr') && map.getLayoutProperty('sst-lyr', 'visibility') === 'visible',
        chl: map.getLayer('chl-lyr') && map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
        ocean: map.getLayer('ocean-layer') && map.getLayoutProperty('ocean-layer', 'visibility') === 'visible'
      };
      console.log('[SNIP] Active layers:', activeLayers);
      
      // Step 3: Get bounds and generate data
      console.log('[SNIP] Step 3: Generating ocean data...');
      setAnalysisStep('Extracting temperature and chlorophyll data...');
      const bbox = turf.bbox(polygon);
      const bounds: [[number, number], [number, number]] = [[bbox[0], bbox[1]], [bbox[2], bbox[3]]];
      
      // Generate data (using mock for now)
      const sstData = activeLayers.sst || true ? generateMockSSTData(bounds) : null; // Always generate SST for demo
      const chlData = activeLayers.chl ? generateMockCHLData(bounds) : null;
      
      // Step 4: Run analysis
      console.log('[SNIP] Step 4: Running multi-layer analysis...');
      setAnalysisStep('Detecting edges, fronts, and convergence zones...');
      const analysis = await analyzeMultiLayer(
        polygon as GeoJSON.Feature<GeoJSON.Polygon>,
        sstData,
        chlData
      );
      
      // Step 5: Add vessel info and visualize on map
      console.log('[SNIP] Step 5: Adding visualizations to map...');
      setAnalysisStep('Mapping hotspots and vessel activity...');
      const analysisWithVessels = {
        ...analysis,
        vesselTracks: vesselData.summary
      };
      
      // Visualize hotspots on map
      if (analysis.hotspot) {
        console.log('[SNIP] Visualizing hotspot at:', analysis.hotspot.location);
        visualizeHotspotOnMap(map, analysis.hotspot);
      }
      
      // Visualize edges on map
      if (analysis.features && analysis.features.length > 0) {
        console.log('[SNIP] Visualizing', analysis.features.length, 'edge features');
        visualizeEdgesOnMap(map, analysis.features);
      }
      
      // Visualize vessel tracks if any
      if (vesselData.tracks && vesselData.tracks.length > 0) {
        console.log('[SNIP] Found', vesselData.tracks.length, 'vessel tracks in area');
        // Vessel tracks are already visible on the map from the vessel tracking layer
      }
      
      // Step 6: Store analysis and trigger completion callback
      console.log('[SNIP] Step 6: Analysis complete, showing results...');
      console.log('[SNIP] Full analysis:', analysisWithVessels);
      
      // Store the analysis for later access when clicking
      setLastAnalysis(analysisWithVessels);
      setHasAnalysisResults(true);
      
      // Show the analysis modal immediately
      onAnalysisComplete(analysisWithVessels);
      
      // Keep rectangle AND visualizations visible
      // Rectangle stays to show the analyzed area
      setIsDrawing(false);
      setIsAnalyzing(false);
      setAnalysisStep('');
      // Don't clear the rectangle or area - keep them visible
      // The rectangle will only clear when user starts a new selection
    } catch (error) {
      console.error('[SNIP] Analysis error:', error);
      alert('Analysis failed. Please try again.');
      setIsAnalyzing(false);
      clearDrawing();
    }
  }, [map, onAnalysisComplete, clearDrawing]);

  // Initialize layers
  useEffect(() => {
    if (!map) return;

    const initLayers = () => {
      console.log('[SNIP] Initializing layers');
      
      // Remove existing
      if (map.getLayer('snip-rectangle-fill')) map.removeLayer('snip-rectangle-fill');
      if (map.getLayer('snip-rectangle-outline')) map.removeLayer('snip-rectangle-outline');
      if (map.getLayer('snip-rectangle-corners')) map.removeLayer('snip-rectangle-corners');
      if (map.getSource('snip-rectangle')) map.removeSource('snip-rectangle');
      
      // Add source
      map.addSource('snip-rectangle', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      
      // Add layers with muted slate blue styling
      // Fill layer - semi-transparent slate blue so you can see through
      map.addLayer({
        id: 'snip-rectangle-fill',
        type: 'fill',
        source: 'snip-rectangle',
        paint: {
          'fill-color': '#64748b', // Slate blue color
          'fill-opacity': 0.3 // Semi-transparent to see tracks/hotspots through it
        }
      });
      
      // Outline - heavy slate blue marking all edges
      map.addLayer({
        id: 'snip-rectangle-outline',
        type: 'line',
        source: 'snip-rectangle',
        paint: {
          'line-color': '#475569', // Darker slate blue for heavy edge marking
          'line-width': 4, // Thick line for heavy marking
          'line-opacity': 1.0 // Fully opaque for strong edge definition
        }
      });
      
      // Corner markers - matching slate blue theme
      map.addLayer({
        id: 'snip-rectangle-corners',
        type: 'circle',
        source: 'snip-rectangle',
        paint: {
          'circle-radius': 6,
          'circle-color': '#64748b', // Slate blue
          'circle-stroke-color': '#475569', // Darker slate blue border
          'circle-stroke-width': 2,
          'circle-opacity': 1.0
        },
        filter: ['==', '$type', 'Point']
      });
      
      // Keep snip layers on top without interfering with other layers
      const moveToTop = () => {
        try {
          // Only move our snip layers to top, don't touch other layers
          const snipLayers = ['snip-rectangle-fill', 'snip-rectangle-outline', 'snip-rectangle-corners'];
          
          snipLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              // Move each snip layer to the top
              map.moveLayer(layerId);
            }
          });
        } catch (e) {
          // Silently handle any layer reordering issues
        }
      };
      
      // Only listen to style changes, not all data events
      map.on('style.load', moveToTop);
      
      // Initial move to top after a short delay
      setTimeout(moveToTop, 100);
      
      return () => {
        map.off('style.load', moveToTop);
      };
    };

    if (map.isStyleLoaded()) {
      const cleanup = initLayers();
      return cleanup;
    } else {
      let cleanup: (() => void) | undefined;
      const handleLoad = () => {
        cleanup = initLayers();
      };
      map.once('style.load', handleLoad);
      return () => {
        if (cleanup) cleanup();
        map.off('style.load', handleLoad);
      };
    }
  }, [map]);

  // Handle clicks on analysis results
  useEffect(() => {
    if (!map || !hasAnalysisResults || !lastAnalysis) return;
    
    const handleResultClick = (e: mapboxgl.MapMouseEvent) => {
      // Check if click is on any of our analysis layers
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['snip-rectangle-fill', 'snip-hotspots-layer', 'snip-edges-layer']
      });
      
      if (features.length > 0) {
        console.log('[SNIP] Clicked on analysis result, showing report');
        // Re-show the analysis modal
        onAnalysisComplete(lastAnalysis);
      }
    };
    
    // Add cursor change on hover
    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['snip-rectangle-fill', 'snip-hotspots-layer', 'snip-edges-layer']
      });
      
      map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
    };
    
    map.on('click', handleResultClick);
    map.on('mousemove', handleMouseMove);
    
    return () => {
      map.off('click', handleResultClick);
      map.off('mousemove', handleMouseMove);
    };
  }, [map, hasAnalysisResults, lastAnalysis, onAnalysisComplete]);
  
  // Mouse event handlers for drawing
  useEffect(() => {
    if (!map || !isDrawing) return;

    console.log('[SNIP] Setting up drawing handlers, isDrawing:', isDrawing);

    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      console.log('[SNIP] Mouse down for drawing');
      e.preventDefault();
      startPoint.current = [e.lngLat.lng, e.lngLat.lat];
      updateRectangle(startPoint.current, startPoint.current);
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!startPoint.current) return;
      const current: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      updateRectangle(startPoint.current, current);
    };

    const handleMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (!startPoint.current) return;
      
      const endPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const dx = Math.abs(endPoint[0] - startPoint.current[0]);
      const dy = Math.abs(endPoint[1] - startPoint.current[1]);
      
      console.log('[SNIP] Mouse up, distance:', dx, dy);
      
      if (dx > 0.0001 || dy > 0.0001) {
        // Keep rectangle visible and trigger analysis
        updateRectangle(startPoint.current, endPoint);
        
        // Re-enable map interactions but keep rectangle
        map.dragPan.enable();
        map.dragRotate.enable();
        map.doubleClickZoom.enable();
        map.scrollZoom.enable();
        map.boxZoom.enable();
        map.getCanvas().style.cursor = '';
        
        // Trigger analysis while keeping rectangle visible
        completeDrawing();
      } else {
        // Too small, clear everything
        clearDrawing();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearDrawing();
    };

    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleEscape);

    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [map, isDrawing, updateRectangle, completeDrawing, clearDrawing]);

  // Handle programmatic trigger
  useEffect(() => {
    const handleTrigger = () => {
      console.log('[SNIP] Triggered programmatically');
      startDrawing();
    };
    
    // Add to window for easy access
    (window as any).startSnipping = handleTrigger;
    
    return () => {
      delete (window as any).startSnipping;
    };
  }, [startDrawing]);

  return (
    <div className="hidden">
      <button
        data-snip-button
        onClick={startDrawing}
        className="hidden"
      >
        Start Snipping
      </button>
      
      {/* Click hint for analysis results */}
      {hasAnalysisResults && !isAnalyzing && !isDrawing && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 pointer-events-none z-[9999]">
          <div className="bg-black/90 backdrop-blur-md rounded-lg px-4 py-2 flex items-center gap-2 border border-cyan-400/30">
            <Target size={16} className="text-cyan-400" />
            <span className="text-sm text-cyan-300">
              Click the highlighted area to view analysis details
            </span>
          </div>
        </div>
      )}
      
      {/* Enhanced Status display with better visibility */}
      {(isDrawing || isAnalyzing) && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 pointer-events-none z-[9999]">
          {isDrawing && !isAnalyzing && (
            <div className="bg-black/95 backdrop-blur-md rounded-xl px-6 py-3 flex items-center gap-3 border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(0,212,255,0.5)]">
              <div className="relative">
                <Maximize2 size={18} className="text-cyan-400" />
                <div className="absolute inset-0 animate-ping">
                  <Maximize2 size={18} className="text-cyan-400 opacity-75" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-cyan-300">
                  Click and drag to select area
                </span>
                {currentArea > 0 && (
                  <span className="text-xs text-cyan-400/80">
                    Area: {currentArea.toFixed(1)} km² • {(currentArea * 0.386).toFixed(1)} mi²
                  </span>
                )}
              </div>
              <div className="ml-2 text-xs text-cyan-500/60">
                ESC to cancel
              </div>
            </div>
          )}
          
          {isAnalyzing && (
            <div className="bg-black/95 backdrop-blur-md rounded-xl px-6 py-3 flex items-center gap-3 border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(0,212,255,0.5)]">
              <Loader2 size={18} className="text-cyan-400 animate-spin" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-cyan-300">
                  Analyzing ocean intelligence...
                </span>
                <span className="text-xs text-cyan-400/80">
                  {analysisStep || 'Detecting edges, hotspots, and vessel tracks'}
                </span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-150" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}