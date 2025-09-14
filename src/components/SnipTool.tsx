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
    
    // Change cursor
    map.getCanvas().style.cursor = 'crosshair';
    
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
    map.getCanvas().style.cursor = '';
    
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
      if (map.getSource('snip-rectangle')) map.removeSource('snip-rectangle');
      
      // Add source
      map.addSource('snip-rectangle', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      
      // Add layers with prominent colors
      map.addLayer({
        id: 'snip-rectangle-fill',
        type: 'fill',
        source: 'snip-rectangle',
        paint: {
          'fill-color': '#475569',
          'fill-opacity': 0.4
        }
      });
      
      map.addLayer({
        id: 'snip-rectangle-outline',
        type: 'line',
        source: 'snip-rectangle',
        paint: {
          'line-color': '#1e293b',
          'line-width': 4,
          'line-opacity': 1.0
        }
      });
      
      // Keep on top
      const moveToTop = () => {
        try {
          if (map.getLayer('snip-rectangle-fill')) map.moveLayer('snip-rectangle-fill');
          if (map.getLayer('snip-rectangle-outline')) map.moveLayer('snip-rectangle-outline');
        } catch (e) {
          // Ignore
        }
      };
      
      map.on('data', moveToTop);
      return () => map.off('data', moveToTop);
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
      
      {/* Status display */}
      {(isDrawing || isAnalyzing) && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 pointer-events-none z-50">
          {isDrawing && !isAnalyzing && (
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
              <Maximize2 size={16} className="text-slate-400" />
              <span className="text-sm text-slate-300">
                Click and drag to select area
              </span>
              {currentArea > 0 && (
                <span className="text-xs text-slate-400 ml-2">
                  ({currentArea.toFixed(1)} km²)
                </span>
              )}
            </div>
          )}
          
          {isAnalyzing && (
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 size={16} className="text-cyan-400 animate-spin" />
              <span className="text-sm text-cyan-300">Analyzing ocean data...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}