'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { getVesselTracksInArea } from '@/lib/analysis/trackAnalyzer';
import { analyzeMultiLayer, generateMockSSTData, generateMockCHLData } from '@/lib/analysis/sst-analyzer';
import type { AnalysisResult } from '@/lib/analysis/sst-analyzer';
import { Maximize2, Loader2 } from 'lucide-react';

interface SnipToolProps {
  map: mapboxgl.Map | null;
  onAnalysisComplete: (analysis: AnalysisResult) => void;
  isActive?: boolean;
}

export default function SnipTool({ map, onAnalysisComplete, isActive = false }: SnipToolProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentArea, setCurrentArea] = useState<number>(0);
  
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
      
      // Get vessel tracks
      const vesselData = await getVesselTracksInArea(polygon, map);
      console.log('[SNIP] Found vessel tracks:', vesselData.tracks.length);
      
      // Check active layers
      const activeLayers = {
        sst: map.getLayer('sst-lyr') && map.getLayoutProperty('sst-lyr', 'visibility') === 'visible',
        chl: map.getLayer('chl-lyr') && map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
        ocean: map.getLayer('ocean-layer') && map.getLayoutProperty('ocean-layer', 'visibility') === 'visible'
      };
      
      // Get bounds
      const bbox = turf.bbox(polygon);
      const bounds: [[number, number], [number, number]] = [[bbox[0], bbox[1]], [bbox[2], bbox[3]]];
      
      // Generate data
      const sstData = activeLayers.sst ? generateMockSSTData(bounds) : null;
      const chlData = activeLayers.chl ? generateMockCHLData(bounds) : null;
      
      // Analyze
      const analysis = await analyzeMultiLayer(
        polygon as GeoJSON.Feature<GeoJSON.Polygon>,
        sstData,
        chlData
      );
      
      // Add vessel info
      const analysisWithVessels = {
        ...analysis,
        vesselTracks: vesselData.summary
      };
      
      console.log('[SNIP] Analysis complete:', analysisWithVessels);
      onAnalysisComplete(analysisWithVessels);
      
      // Clear after delay
      setTimeout(() => {
        clearDrawing();
      }, 500);
    } catch (error) {
      console.error('[SNIP] Analysis error:', error);
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
      
      // Add layers with clear but non-intrusive styling
      // Fill layer - subtle
      map.addLayer({
        id: 'snip-rectangle-fill',
        type: 'fill',
        source: 'snip-rectangle',
        paint: {
          'fill-color': '#00d4ff',
          'fill-opacity': 0.15
        }
      });
      
      // Outline - clear but not overwhelming
      map.addLayer({
        id: 'snip-rectangle-outline',
        type: 'line',
        source: 'snip-rectangle',
        paint: {
          'line-color': '#00d4ff',
          'line-width': 3,
          'line-opacity': 0.9,
          'line-dasharray': [2, 1]
        }
      });
      
      // Corner markers - subtle
      map.addLayer({
        id: 'snip-rectangle-corners',
        type: 'circle',
        source: 'snip-rectangle',
        paint: {
          'circle-radius': 5,
          'circle-color': '#00d4ff',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.8
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

  // Mouse event handlers
  useEffect(() => {
    if (!map || !isDrawing) return;

    console.log('[SNIP] Setting up mouse handlers, isDrawing:', isDrawing);

    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      console.log('[SNIP] Mouse down');
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
        updateRectangle(startPoint.current, endPoint);
        completeDrawing();
      } else {
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
                  Detecting edges, hotspots, and vessel tracks
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}