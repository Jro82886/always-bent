"use client";
import { useEffect, useRef, useState } from 'react';
import * as turf from '@turf/turf';
import type mapboxgl from 'mapbox-gl';
import { Target } from 'lucide-react';

interface SnipToolProps {
  map: mapboxgl.Map | null;
  onAnalyze?: (polygon: GeoJSON.Feature) => Promise<void> | void;
  shouldClear?: boolean;
}

export default function SnipTool({ map, onAnalyze, shouldClear }: SnipToolProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentArea, setCurrentArea] = useState<number>(0);
  const firstCorner = useRef<[number, number] | null>(null);
  const rectangleId = useRef<string>('analysis-rectangle');
  const currentRectangle = useRef<GeoJSON.Feature<GeoJSON.Polygon> | null>(null);
  const layersInitialized = useRef<boolean>(false);
  const isDragging = useRef<boolean>(false);
  const isDrawingRef = useRef<boolean>(false);

  // Keep ref in sync with state
  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  // Clear when parent tells us to
  useEffect(() => {
    if (shouldClear) {
      console.log('[CLEAR] Parent requested clear');
      clearDrawing();
      // Ensure we're ready for new drawing
      setIsDrawing(false);
      setIsAnalyzing(false);
    }
  }, [shouldClear]);

  const clearDrawing = () => {
    setIsDrawing(false);
    setIsAnalyzing(false);
    firstCorner.current = null;
    currentRectangle.current = null;
    setCurrentArea(0);
    
    // Clear visualization
    if (map && map.getSource('rectangle')) {
      const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    
    console.log('[CLEARED] Drawing cleared');
  };

  // Setup layers once when component mounts
  useEffect(() => {
    if (!map) return;
    
    const setupLayers = () => {
      console.log('[SETUP] Setting up rectangle layers...');
      try {
        // Remove existing if any
        if (map.getLayer('rectangle-fill')) {
          console.log('[REMOVE] Removing existing fill layer');
          map.removeLayer('rectangle-fill');
        }
        if (map.getLayer('rectangle-outline')) {
          console.log('[REMOVE] Removing existing outline layer');
          map.removeLayer('rectangle-outline');
        }
        if (map.getSource('rectangle')) {
          console.log('[REMOVE] Removing existing source');
          map.removeSource('rectangle');
        }

        // Add source for rectangle
        map.addSource('rectangle', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        // Add fill layer with bright cyan color
        map.addLayer({
          id: 'rectangle-fill',
          type: 'fill',
          source: 'rectangle',
          paint: {
            'fill-color': '#475569',  // Slate-600 to match ocean analysis
            'fill-opacity': 0.2  // More subtle transparency
          }
        });

        // Add outline layer with thick bright line
        map.addLayer({
          id: 'rectangle-outline',
          type: 'line',
          source: 'rectangle',
          paint: {
            'line-color': '#3b82f6',  // Blue-500 to match ocean analysis gradient
            'line-width': 3,  // Slightly thinner
            'line-opacity': 0.9  // Slightly transparent
          }
        });
        
        // FORCE layers to absolute top - run multiple times to ensure
        const ensureOnTop = () => {
          try {
            // Move to top, above all other layers including polygons
            if (map.getLayer('rectangle-fill')) {
              map.moveLayer('rectangle-fill');
            }
            if (map.getLayer('rectangle-outline')) {
              map.moveLayer('rectangle-outline');
            }
          } catch (error) {
            console.log('Layer ordering update:', error);
          }
        };
        
        // Run immediately and after delays to beat any other layers
        ensureOnTop();
        setTimeout(ensureOnTop, 100);
        setTimeout(ensureOnTop, 500);
        setTimeout(ensureOnTop, 1000);
        setTimeout(ensureOnTop, 2000);
        setTimeout(ensureOnTop, 3000);
        
        // Also ensure visibility on every map move/zoom
        map.on('moveend', ensureOnTop);
        map.on('zoomend', ensureOnTop);
        map.on('sourcedata', ensureOnTop);
        
        console.log('[COMPLETE] Rectangle layers setup complete');
      } catch (error) {
        console.error('[ERROR] Setting up rectangle layers:', error);
      }
    };

    if (map.loaded()) {
      setupLayers();
    } else {
      map.once('load', setupLayers);
    }

    return () => {
      // Cleanup layers on unmount
      if (map.getLayer('rectangle-fill')) map.removeLayer('rectangle-fill');
      if (map.getLayer('rectangle-outline')) map.removeLayer('rectangle-outline');
      if (map.getSource('rectangle')) map.removeSource('rectangle');
    };
  }, [map]);

  // Separate effect for event handlers that need current state
  useEffect(() => {
    if (!map) return;

    // Handle mouse down - start drawing
    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawingRef.current) return;
      
      e.preventDefault();
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      firstCorner.current = coords;
      isDragging.current = true;
      
      console.log('[DRAG] Started dragging from:', coords, 'isDrawing:', isDrawingRef.current);
      
      // Show initial point with bright color
      const point: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coords
          },
          properties: {}
        }]
      };
      
      const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(point);
      }
    };
    
    
    // Handle mouse up - complete rectangle
    const handleMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (!isDragging.current || !firstCorner.current) return;
      
      isDragging.current = false;
      
      const corner1 = firstCorner.current;
      const corner2: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      
      // Create final rectangle
      const minLng = Math.min(corner1[0], corner2[0]);
      const maxLng = Math.max(corner1[0], corner2[0]);
      const minLat = Math.min(corner1[1], corner2[1]);
      const maxLat = Math.max(corner1[1], corner2[1]);
      
      const rectangle: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [minLng, minLat],
            [maxLng, minLat],
            [maxLng, maxLat],
            [minLng, maxLat],
            [minLng, minLat]
          ]]
        },
        properties: {}
      };
      
      // Calculate area
      const area = turf.area(rectangle);
      const areaKm2 = area / 1000000;
      
      console.log('[COMPLETE] Rectangle completed:', {
        area: `${areaKm2.toFixed(2)} km²`,
        bounds: [corner1, corner2]
      });
      
      // Store the rectangle for analysis
      currentRectangle.current = rectangle;
      
      // Transition to analyzing state
      setIsDrawing(false);
      setIsAnalyzing(true);
      firstCorner.current = null;
      
      console.log('[ANALYZE] State set, isAnalyzing:', true);

      // Add pulsing animation to the rectangle
      if (map.getLayer('rectangle-fill')) {
        // Animate opacity for pulsing effect
        let opacity = 0.3;
        let increasing = true;
        let animationActive = true;
        
        const pulseInterval = setInterval(() => {
          if (!animationActive || !map.getLayer('rectangle-fill')) {
            clearInterval(pulseInterval);
            return;
          }
          
          if (increasing) {
            opacity += 0.02;
            if (opacity >= 0.6) increasing = false;
          } else {
            opacity -= 0.02;
            if (opacity <= 0.3) increasing = true;
          }
          
          try {
            map.setPaintProperty('rectangle-fill', 'fill-opacity', opacity);
          } catch (e) {
            clearInterval(pulseInterval);
          }
        }, 50);
        
        // Store interval reference for cleanup
        currentRectangle.current = rectangle;
        
        // Clear interval after 10 seconds max
        setTimeout(() => {
          animationActive = false;
        }, 10000);
      }

      // Trigger analysis
      if (onAnalyze) {
        console.log('[TRIGGER] Analysis with rectangle:', rectangle);
        console.log('[COORDS] Rectangle coordinates:', rectangle.geometry.coordinates);
        console.log('[CHECK] onAnalyze function exists:', typeof onAnalyze);
        
        // Small delay for visual feedback, then call the parent's analysis
        setTimeout(async () => {
          console.log('[CALL] onAnalyze callback...');
          console.log('⏱️ About to call onAnalyze at:', new Date().toISOString());
          try {
            const result = await onAnalyze(rectangle);
            console.log('[SUCCESS] onAnalyze completed, result:', result);
          } catch (error) {
            console.error('[FAILED] onAnalyze error:', error);
            console.error('Stack trace:', (error as Error).stack);
          } finally {
            // Only reset our local analyzing state after parent completes
            console.log('[FINALLY] Resetting isAnalyzing state');
            setIsAnalyzing(false);
          }
        }, 1000); // 1 second for visual feedback
      } else {
        console.error('[WARNING] No onAnalyze callback provided!');
        setIsAnalyzing(false);
        clearRectangle();
      }
    };

    // Handle mouse move for preview
    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!isDragging.current || !firstCorner.current) return;

      const corner1 = firstCorner.current;
      const corner2: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      // Create preview rectangle with same approach as final rectangle
      const minLng = Math.min(corner1[0], corner2[0]);
      const maxLng = Math.max(corner1[0], corner2[0]);
      const minLat = Math.min(corner1[1], corner2[1]);
      const maxLat = Math.max(corner1[1], corner2[1]);
      
      // Create consistent rectangle shape
      const rectangle: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [minLng, minLat],
            [maxLng, minLat],
            [maxLng, maxLat],
            [minLng, maxLat],
            [minLng, minLat]
          ]]
        },
        properties: {}
      };

      // Update visualization
      const collection: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [rectangle]
      };
      const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(collection);
        
        // Calculate and update area
        const area = turf.area(rectangle);
        const areaKm2 = area / 1000000;
        setCurrentArea(areaKm2);
        
        // Log every 10th mouse move to avoid spam
        if (Math.random() < 0.1) {
          console.log('[PREVIEW] Updating area:', areaKm2.toFixed(2), 'km²');
        }
      } else {
        console.error('[ERROR] Rectangle source not found during preview!');
      }
    };

    // Handle escape key to cancel drawing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawing) {
        clearDrawing();
        console.log('[CANCEL] Drawing cancelled');
      }
    };

    // Add event listeners with immediate binding
    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    
    // Also add to window for backup (convert regular mouse event)
    const windowMouseUp = () => {
      if (isDragging.current) {
        handleMouseUp({} as mapboxgl.MapMouseEvent);
      }
    };
    window.addEventListener('mouseup', windowMouseUp);

    // Change cursor and disable map dragging when drawing
    if (isDrawing) {
      map.getCanvas().style.cursor = 'crosshair';
      map.dragPan.disable();  // Disable map dragging
      map.boxZoom.disable();  // Disable box zoom
      map.doubleClickZoom.disable();  // Disable double click zoom
      console.log('[LOCK] Map interactions disabled for drawing');
    } else {
      map.getCanvas().style.cursor = '';
      map.dragPan.enable();   // Re-enable map dragging
      map.boxZoom.enable();   // Re-enable box zoom
      map.doubleClickZoom.enable();  // Re-enable double click zoom
      console.log('[UNLOCK] Map interactions re-enabled');
    }

    // Cleanup
    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', windowMouseUp);
      map.getCanvas().style.cursor = '';
      map.dragPan.enable();  // Re-enable map dragging on cleanup
      map.boxZoom.enable();  // Re-enable box zoom on cleanup
      map.doubleClickZoom.enable();  // Re-enable double click zoom on cleanup
    };
  }, [map, isDrawing, onAnalyze]);

  const clearRectangle = () => {
    if (!map) return;
    
    console.log('[CLEAR] Clearing rectangle...');
    
    // Clear the rectangle data
    if (map.getSource('rectangle')) {
      const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    
    // Reset all state
    setCurrentArea(0);
    setIsAnalyzing(false);
    setIsDrawing(false);
    firstCorner.current = null;
    currentRectangle.current = null;
  };
  
  // Handle shouldClear prop from parent
  useEffect(() => {
    if (shouldClear) {
      console.log('[CLEAR] Parent requested clear');
      clearRectangle();
    }
  }, [shouldClear]);

  const startDrawing = () => {
    if (!map) {
      console.error('Map not available');
      return;
    }
    
    console.log('[START] Drawing mode...');
    console.log('[STATE] Current map:', {
      loaded: map.loaded(),
      hasRectangleSource: !!map.getSource('rectangle'),
      hasRectangleLayers: !!map.getLayer('rectangle-fill')
    });
    
    setIsDrawing(true);
    firstCorner.current = null;
    setCurrentArea(0);
    
    // Clear any existing rectangle
    const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
      console.log('[CLEARED] Existing rectangle');
    } else {
      console.error('[WARNING] Rectangle source not found! Layers may not be initialized');
    }
    
    // Set cursor immediately
    map.getCanvas().style.cursor = 'crosshair';
    
    // Force disable map dragging RIGHT NOW
    map.dragPan.disable();
    map.boxZoom.disable();
    map.doubleClickZoom.disable();
    
    // Verify the changes took effect
    setTimeout(() => {
      console.log('[VERIFY] Rectangle drawing mode:');
      console.log('[STATE] isDrawing:', true);
      console.log('[STATE] isDrawingRef:', isDrawingRef.current);
      console.log('[STATE] Map drag disabled:', !map.dragPan.isEnabled());
      console.log('[STATE] Box zoom disabled:', !map.boxZoom.isEnabled());
      console.log('[STATE] Double click zoom disabled:', !map.doubleClickZoom.isEnabled());
      console.log('[STATE] Cursor:', map.getCanvas().style.cursor);
      console.log('[STATE] firstCorner:', firstCorner.current);
      console.log('[STATE] isDragging:', isDragging.current);
    }, 100);
  };

  return (
    <div className="absolute top-4 right-4 bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-blue-900/80 backdrop-blur-md rounded-2xl px-6 py-4 shadow-[0_0_30px_rgba(71,85,105,0.3)] z-50 border border-slate-500/30">
      <div className="relative">
        <h3 className="text-slate-300 font-semibold mb-3 text-sm text-center flex items-center justify-center gap-2">
          <Target size={14} className="text-slate-400" />
          Ocean Analysis
          {/* Sleek BETA Badge */}
          <div className="group relative">
            <span className="px-2 py-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 text-[10px] font-bold rounded-full border border-cyan-500/30 cursor-help animate-pulse">
              BETA
            </span>
            {/* Modern Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-xl border border-cyan-500/20 min-w-[200px]">
                <div className="text-cyan-400 text-xs font-semibold mb-1">Demo Mode Active</div>
                <div className="text-slate-300 text-[10px] leading-relaxed">
                  Currently using simulated ocean data for demonstration. Real-time SST integration coming soon.
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900 border-r border-b border-cyan-500/20"></div>
              </div>
            </div>
          </div>
        </h3>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={startDrawing}
          disabled={isDrawing || isAnalyzing}
          className={`w-full px-4 py-2 ${
            isAnalyzing
              ? 'bg-gradient-to-r from-slate-600 to-blue-700 cursor-not-allowed animate-pulse'
              : isDrawing 
              ? 'bg-gradient-to-r from-slate-700 to-blue-700 cursor-not-allowed' 
              : 'bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-500 hover:to-blue-500'
          } text-white rounded-full transition-all shadow-lg flex items-center justify-center gap-2 text-sm font-medium`}
          style={{
            boxShadow: isAnalyzing || isDrawing ? '0 0 20px rgba(6, 182, 212, 0.4)' : undefined
          }}
        >
          {isAnalyzing ? (
            <>
              <svg className="inline-block w-4 h-4 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analyzing Ocean Data...
            </>
          ) : isDrawing ? (
            <>
              <span>▭</span> Drawing Area...
            </>
          ) : (
            <>
              <span>▭</span> Select Analysis Area
            </>
          )}
        </button>

        {currentArea > 0 && (
          <>
            <div className="text-slate-100 text-xs mt-2 p-2 bg-gradient-to-r from-slate-500/10 to-blue-500/10 rounded-full border border-slate-500/20">
              <div className="text-center">
                <span className="font-bold text-sm">{currentArea.toFixed(2)} km²</span>
                <span className="text-cyan-300/60 ml-1">({(currentArea * 0.386102).toFixed(2)} mi²)</span>
              </div>
            </div>

            <button
              onClick={clearDrawing}
              className="w-full px-3 py-1.5 bg-gradient-to-r from-slate-600/20 to-blue-600/20 hover:from-slate-600/30 hover:to-blue-600/30 text-slate-300 rounded-full transition-all text-xs font-medium border border-slate-500/20 shadow-[0_0_10px_rgba(71,85,105,0.2)]"
            >
              Clear Selection
            </button>
          </>
        )}
      </div>

      {isDrawing && (
        <div className="text-xs text-cyan-400 mt-2 animate-pulse text-center">
          Click and drag to draw rectangle
        </div>
      )}
    </div>
  );
}