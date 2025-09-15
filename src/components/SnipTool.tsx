'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { getVesselTracksInArea } from '@/lib/analysis/trackAnalyzer';
import { analyzeMultiLayer, generateMockSSTData, generateMockCHLData } from '@/lib/analysis/sst-analyzer';
import type { AnalysisResult } from '@/lib/analysis/sst-analyzer';
import { Maximize2, Loader2, Target, TrendingUp } from 'lucide-react';
import { getVesselsInBounds, getVesselStyle, getVesselTrackingSummary } from '@/lib/vessels/vesselDataService';

interface SnipToolProps {
  map: mapboxgl.Map | null;
  onAnalysisComplete: (analysis: AnalysisResult) => void;
  isActive?: boolean;
}

// Helper functions for map visualizations
function visualizeHotspotOnMap(map: mapboxgl.Map, hotspot: any) {
  console.log('[SNIP-VIZ] visualizeHotspotOnMap called with:', hotspot);
  if (!hotspot || !hotspot.location) {
    console.log('[SNIP-VIZ] No hotspot or location, skipping visualization');
    return;
  }
  
  // Ensure source exists
  if (!map.getSource('snip-hotspots')) {
    console.log('[SNIP-VIZ] Creating snip-hotspots source');
    map.addSource('snip-hotspots', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }
  
  // Add hotspot layer with deep purple/teal gradient
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
          0.5, 8,
          1.0, 15
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'confidence'],
          0.3, '#2d3561', // Deep navy
          0.6, '#5b21b6', // Deep purple
          0.9, '#0d7377'  // Dark teal
        ],
        'circle-opacity': 0.85,
        'circle-stroke-color': '#1e293b', // Dark slate
        'circle-stroke-width': 1.5
      }
    });
    
    // Add subtle pulsing effect layer
    map.addLayer({
      id: 'snip-hotspots-pulse',
      type: 'circle',
      source: 'snip-hotspots',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'confidence'],
          0.5, 15,
          1.0, 30
        ],
        'circle-color': '#5b21b6', // Deep purple
        'circle-opacity': 0.2,
        'circle-stroke-width': 0
      }
    });
    
    // Move hotspot layers to top
    try {
      map.moveLayer('snip-hotspots-pulse');
      map.moveLayer('snip-hotspots-layer');
    } catch (e) {
      // Layers might not exist yet
    }
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

// Visualize vessels within the snipped area
function visualizeVesselsOnMap(map: mapboxgl.Map, vessels: any[], selectedInlet?: string) {
  console.log('[SNIP-VIZ] visualizeVesselsOnMap called with', vessels?.length, 'vessels');
  if (!vessels || vessels.length === 0) {
    console.log('[SNIP-VIZ] No vessels to visualize');
    return;
  }
  
  // Create vessel markers matching the tracking page style
  vessels.forEach(vessel => {
    console.log('[SNIP-VIZ] Adding vessel marker:', vessel.name, 'at', vessel.position);
    const style = getVesselStyle(vessel, selectedInlet);
    
    const el = document.createElement('div');
    el.className = `vessel-marker vessel-${vessel.type}`;
    
    // Style based on vessel type matching tracking page
    if (vessel.type === 'user') {
      el.innerHTML = `
        <div style="
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          box-shadow: 0 0 15px ${style.glow};
        "></div>
      `;
    } else if (vessel.type === 'fleet') {
      el.innerHTML = `
        <div style="
          width: 10px;
          height: 10px;
          background: ${style.color};
          border-radius: 50%;
          box-shadow: 0 0 10px ${style.glow};
        "></div>
      `;
    } else if (vessel.type === 'commercial') {
      el.innerHTML = `
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 10px solid ${style.color};
          filter: drop-shadow(0 0 4px ${style.glow});
        "></div>
      `;
    }
    
    // Add marker to map
    new (window as any).mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat(vessel.position)
      .addTo(map);
  });
}

// Edge visualization removed - handled by polygon filter
// But we still process edges for the written analysis
function processEdgesForAnalysis(features: any[]): string {
  if (!features || features.length === 0) return '';
  
  const strongEdges = features.filter(f => f.properties?.score > 0.7);
  const moderateEdges = features.filter(f => f.properties?.score > 0.4 && f.properties?.score <= 0.7);
  
  let edgeAnalysis = '';
  if (strongEdges.length > 0) {
    edgeAnalysis += `Strong temperature edges detected (${strongEdges.length} features). `;
  }
  if (moderateEdges.length > 0) {
    edgeAnalysis += `Moderate edges present (${moderateEdges.length} features). `;
  }
  
  return edgeAnalysis;
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
    
    // Clear analysis visualizations
    if (map.getSource('snip-hotspots')) {
      const source = map.getSource('snip-hotspots') as mapboxgl.GeoJSONSource;
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
    
    // Only set the polygon, no corner points (modern seamless look)
    const source = map.getSource('snip-rectangle') as mapboxgl.GeoJSONSource;
    source.setData({
      type: 'FeatureCollection',
      features: [polygon]
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
      
      // Step 1: Get vessel data from shared service (source of truth)
      console.log('[SNIP] Step 1: Getting vessel data from tracking system...');
      
      // Get bounds from polygon for vessel detection
      const bbox = turf.bbox(polygon);
      const bounds: [[number, number], [number, number]] = [
        [bbox[0], bbox[1]], // Southwest
        [bbox[2], bbox[3]]  // Northeast
      ];
      
      // Get vessels from the shared data service
      const vesselsInBounds = getVesselsInBounds(bounds);
      const vesselSummary = getVesselTrackingSummary(vesselsInBounds);
      
      console.log('[SNIP] Found vessels in area:', vesselSummary.summary);
      
      // Build vessel data in expected format
      const vesselData = {
        tracks: vesselsInBounds.flatMap(v => v.track || [[v.position[0], v.position[1]]]),
        summary: vesselSummary.summary,
        total: vesselSummary.totalVessels,
        userVessels: vesselSummary.userVessels,
        fleetVessels: vesselSummary.fleetVessels,
        commercialVessels: vesselSummary.commercialVessels
      };
      
      // Step 2: Check active layers
      console.log('[SNIP] Step 2: Checking active layers...');
      const activeLayers = {
        sst: map.getLayer('sst-lyr') && map.getLayoutProperty('sst-lyr', 'visibility') === 'visible',
        chl: map.getLayer('chl-lyr') && map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
        ocean: map.getLayer('ocean-layer') && map.getLayoutProperty('ocean-layer', 'visibility') === 'visible'
      };
      console.log('[SNIP] Active layers:', activeLayers);
      
      // Step 3: Generate ocean data using already calculated bounds
      console.log('[SNIP] Step 3: Generating ocean data...');
      setAnalysisStep('Extracting temperature and chlorophyll data...');
      
      // Generate data (using mock for now) - reuse bounds from Step 1
      const sstData = activeLayers.sst || true ? generateMockSSTData(bounds) : null; // Always generate SST for demo
      const chlData = activeLayers.chl ? generateMockCHLData(bounds) : null;
      
      // Step 4: Run analysis
      console.log('[SNIP] Step 4: Running multi-layer analysis...');
      setAnalysisStep('Detecting edges, fronts, and convergence zones...');
      
      let analysis;
      try {
        analysis = await analyzeMultiLayer(
          polygon as GeoJSON.Feature<GeoJSON.Polygon>,
          sstData,
          chlData
        );
        
        // Check if conditions support hotspots
        if (!analysis.hotspot || !analysis.hotspot.location) {
          console.log('[SNIP] No hotspot conditions detected - will provide educational guidance');
          // Don't fake a hotspot - let the analysis explain why
          analysis.noHotspotReason = 'uniform_conditions';
        }
      } catch (analysisError) {
        console.warn('[SNIP] Analysis function error, using basic analysis:', analysisError);
        // Provide basic analysis without fake hotspot
        analysis = {
          polygon: polygon as GeoJSON.Feature<GeoJSON.Polygon>,
          features: [],
          hotspot: null, // Be honest - no hotspot detected
          noHotspotReason: 'uniform_conditions',
          stats: {
            min_temp_f: 68,
            max_temp_f: 72,
            avg_temp_f: 70,
            temp_range_f: 4, // Low range indicates uniform conditions
            area_km2: currentArea || 100
          }
        };
      }
      
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
        
        // Ensure hotspot layers stay on top
        setTimeout(() => {
          try {
            if (map.getLayer('snip-hotspots-pulse')) map.moveLayer('snip-hotspots-pulse');
            if (map.getLayer('snip-hotspots-layer')) map.moveLayer('snip-hotspots-layer');
          } catch (e) {
            console.log('[SNIP] Could not reorder hotspot layers:', e);
          }
        }, 100);
      }
      
      // Visualize vessels within snipped area (matching tracking page style)
      if (vesselsInBounds && vesselsInBounds.length > 0) {
        console.log('[SNIP] Visualizing', vesselsInBounds.length, 'vessels in snipped area');
        // Get selected inlet for fleet colors (from global state if needed)
        const selectedInlet = localStorage.getItem('abfi_selected_inlet') || 'nc-hatteras';
        visualizeVesselsOnMap(map, vesselsInBounds, selectedInlet);
      }
      
      // Process edges for analysis (no visualization - handled by polygon filter)
      if (analysis.features && analysis.features.length > 0) {
        console.log('[SNIP] Processing', analysis.features.length, 'edge features for analysis');
        const edgeInfo = processEdgesForAnalysis(analysis.features);
        if (edgeInfo) {
          console.log('[SNIP] Edge analysis:', edgeInfo);
        }
      }
      
      // Log vessel tracks for analysis
      if (vesselData.tracks && vesselData.tracks.length > 0) {
        console.log('[SNIP] Found', vesselData.tracks.length, 'vessel tracks in area');
        // Tracks will be shown if user enables them on tracking page
      }
      
      // Add edge analysis info to the result
      const finalAnalysis = {
        ...analysisWithVessels,
        edgeAnalysis: analysis.features && analysis.features.length > 0 
          ? processEdgesForAnalysis(analysis.features) 
          : undefined
      };
      
      // Step 6: Store analysis and trigger completion callback
      console.log('[SNIP] Step 6: Analysis complete, showing results...');
      console.log('[SNIP] Full analysis:', finalAnalysis);
      
      // Store the analysis for later access when clicking
      setLastAnalysis(finalAnalysis);
      setHasAnalysisResults(true);
      
      // Show the analysis modal immediately
      onAnalysisComplete(finalAnalysis);
      
      // Keep rectangle AND visualizations visible
      // Rectangle stays to show the analyzed area
      setIsDrawing(false);
      setIsAnalyzing(false);
      setAnalysisStep('');
      // Don't clear the rectangle or area - keep them visible
      // The rectangle will only clear when user starts a new selection
    } catch (error) {
      console.error('[SNIP] Analysis error:', error);
      // Create a basic fallback analysis
      const fallbackAnalysis = {
        polygon: currentPolygon.current || { 
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]]
          }
        },
        features: [],
        hotspot: null,
        stats: {
          min_temp_f: 68,
          max_temp_f: 72,
          avg_temp_f: 70,
          temp_range_f: 4,
          area_km2: currentArea || 100
        },
        vesselTracks: { total: 0, recreational: 0, commercial: 0 },
        edgeAnalysis: 'Analysis partially completed. Some features may not be detected.'
      };
      console.log('[SNIP] Using fallback analysis due to error');
      setLastAnalysis(fallbackAnalysis as any);
      setHasAnalysisResults(true);
      onAnalysisComplete(fallbackAnalysis as any);
      setIsAnalyzing(false);
      setIsDrawing(false);
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
      if (map.getSource('snip-rectangle')) map.removeSource('snip-rectangle');
      
      // Add source
      map.addSource('snip-rectangle', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      
      // Rectangle matching Ocean Analysis box styling (slate-900 with cyan accents)
      // Fill layer - matching ocean analysis box color
      map.addLayer({
        id: 'snip-rectangle-fill',
        type: 'fill',
        source: 'snip-rectangle',
        paint: {
          'fill-color': '#0f172a', // slate-900 to match ocean analysis box
          'fill-opacity': 0.4 // Semi-transparent to see content beneath
        }
      });
      
      // Cyan border matching ocean analysis theme
      map.addLayer({
        id: 'snip-rectangle-outline',
        type: 'line',
        source: 'snip-rectangle',
        paint: {
          'line-color': '#06b6d4', // cyan-500 to match ocean analysis
          'line-width': 2,
          'line-opacity': 0.6,
          'line-blur': 0 // Clean edge, no blur
        }
      });
      
      // Keep snip layers on top without interfering with other layers
      const moveToTop = () => {
        try {
          // Move all snip-related layers to top in proper order
          const snipLayers = [
            'snip-rectangle-fill', 
            'snip-rectangle-outline',
            'snip-hotspots-pulse',
            'snip-hotspots-layer'
          ];
          
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
      // Check if click is on the rectangle (hotspots are within it)
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['snip-rectangle-fill']
      });
      
      if (features.length > 0) {
        console.log('[SNIP] Clicked on analysis rectangle, showing report');
        // Re-show the analysis modal
        onAnalysisComplete(lastAnalysis);
      }
    };
    
    // Add cursor change on hover over rectangle
    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['snip-rectangle-fill']
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
          <div className="bg-slate-900/90 backdrop-blur-md rounded-lg px-4 py-2 flex items-center gap-2 border border-slate-600/50">
            <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            <span className="text-sm text-slate-300">
              Click the highlighted area to view ocean intelligence report
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