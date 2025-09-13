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
      console.log('🔄 Parent requested clear');
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
    
    console.log('🧹 Drawing cleared');
  };

  // Setup layers once when component mounts
  useEffect(() => {
    if (!map) return;
    
    const setupLayers = () => {
      console.log('🔧 Setting up rectangle layers...');
      try {
        // Remove existing if any
        if (map.getLayer('rectangle-fill')) {
          console.log('🗑️ Removing existing fill layer');
          map.removeLayer('rectangle-fill');
        }
        if (map.getLayer('rectangle-outline')) {
          console.log('🗑️ Removing existing outline layer');
          map.removeLayer('rectangle-outline');
        }
        if (map.getSource('rectangle')) {
          console.log('🗑️ Removing existing source');
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
            'fill-color': '#00ffff',  // Bright cyan
            'fill-opacity': 0.3  // Semi-transparent
          }
        });

        // Add outline layer with thick bright line
        map.addLayer({
          id: 'rectangle-outline',
          type: 'line',
          source: 'rectangle',
          paint: {
            'line-color': '#00ffff',  // Bright cyan
            'line-width': 4,  // Thick line
            'line-opacity': 1  // Fully opaque
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
        
        console.log('✅ Rectangle layers setup complete');
      } catch (error) {
        console.error('❌ Error setting up rectangle layers:', error);
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
      
      console.log('🖱️ Started dragging from:', coords, 'isDrawing:', isDrawingRef.current);
      
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
      
      console.log('✅ Rectangle completed:', {
        area: `${areaKm2.toFixed(2)} km²`,
        bounds: [corner1, corner2]
      });
      
      // Store the rectangle for analysis
      currentRectangle.current = rectangle;
      
      // Transition to analyzing state
      setIsDrawing(false);
      setIsAnalyzing(true);
      firstCorner.current = null;
      
      console.log('🎯 Analysis state set, isAnalyzing:', true);

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
        console.log('🔄 Triggering analysis with rectangle:', rectangle);
        console.log('📍 Rectangle coordinates:', rectangle.geometry.coordinates);
        console.log('🔍 onAnalyze function exists:', typeof onAnalyze);
        
        // Small delay for visual feedback, then call the parent's analysis
        setTimeout(async () => {
          console.log('📊 Calling onAnalyze callback...');
          console.log('⏱️ About to call onAnalyze at:', new Date().toISOString());
          try {
            const result = await onAnalyze(rectangle);
            console.log('✅ onAnalyze completed successfully, result:', result);
          } catch (error) {
            console.error('❌ onAnalyze failed:', error);
            console.error('Stack trace:', (error as Error).stack);
          } finally {
            // Only reset our local analyzing state after parent completes
            console.log('🏁 Finally block: resetting isAnalyzing state');
            setIsAnalyzing(false);
          }
        }, 1000); // 1 second for visual feedback
      } else {
        console.error('⚠️ No onAnalyze callback provided!');
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
          console.log('👁️ Preview updating, area:', areaKm2.toFixed(2), 'km²');
        }
      } else {
        console.error('❌ Rectangle source not found during preview!');
      }
    };

    // Handle escape key to cancel drawing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawing) {
        clearDrawing();
        console.log('❌ Drawing cancelled');
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
      console.log('🔒 Map interactions disabled for drawing');
    } else {
      map.getCanvas().style.cursor = '';
      map.dragPan.enable();   // Re-enable map dragging
      map.boxZoom.enable();   // Re-enable box zoom
      map.doubleClickZoom.enable();  // Re-enable double click zoom
      console.log('🔓 Map interactions re-enabled');
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
    
    console.log('🧹 Clearing rectangle...');
    
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
      console.log('🧹 Parent requested clear');
      clearRectangle();
    }
  }, [shouldClear]);

  const startDrawing = () => {
    if (!map) {
      console.error('Map not available');
      return;
    }
    
    console.log('🚀 Starting drawing mode...');
    console.log('📍 Current map state:', {
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
      console.log('✅ Cleared existing rectangle');
    } else {
      console.error('⚠️ Rectangle source not found! Layers may not be initialized');
    }
    
    // Set cursor immediately
    map.getCanvas().style.cursor = 'crosshair';
    
    // Force disable map dragging RIGHT NOW
    map.dragPan.disable();
    map.boxZoom.disable();
    map.doubleClickZoom.disable();
    
    // Verify the changes took effect
    setTimeout(() => {
      console.log('🎯 Rectangle drawing mode verification:');
      console.log('📍 isDrawing state:', true);
      console.log('📍 isDrawingRef current value:', isDrawingRef.current);
      console.log('📍 Map drag disabled:', !map.dragPan.isEnabled());
      console.log('📍 Box zoom disabled:', !map.boxZoom.isEnabled());
      console.log('📍 Double click zoom disabled:', !map.doubleClickZoom.isEnabled());
      console.log('📍 Cursor:', map.getCanvas().style.cursor);
      console.log('📍 firstCorner:', firstCorner.current);
      console.log('📍 isDragging:', isDragging.current);
    }, 100);
  };

  return (
    <div className="absolute top-4 right-4 bg-gradient-to-br from-cyan-950/80 via-teal-950/80 to-emerald-950/80 backdrop-blur-md rounded-2xl px-6 py-4 shadow-[0_0_30px_rgba(0,255,136,0.3)] z-50 border border-emerald-400/30">
      <h3 className="text-emerald-300 font-semibold mb-3 text-sm text-center flex items-center justify-center gap-2">
        <Target size={14} className="text-emerald-400" />
        Ocean Analysis
      </h3>
      {/* TODO: REMOVE THIS WARNING WHEN REAL DATA IS CONNECTED */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-yellow-400 text-[10px] mb-1 px-2 py-1 bg-yellow-500/10 rounded-full">
          ⚠️ Using mock data - not real SST
        </div>
      )}
      
      <div className="space-y-2">
        <button
          onClick={startDrawing}
          disabled={isDrawing || isAnalyzing}
          className={`w-full px-4 py-2 ${
            isAnalyzing
              ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 cursor-not-allowed animate-pulse'
              : isDrawing 
              ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400'
          } text-white rounded-full transition-all shadow-lg flex items-center justify-center gap-2 text-sm font-medium`}
          style={{
            boxShadow: isAnalyzing || isDrawing ? '0 0 20px rgba(0, 255, 136, 0.4)' : undefined
          }}
        >
          {isAnalyzing ? (
            <>
              <span className="animate-spin">⚙️</span> Analyzing Ocean Data...
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
            <div className="text-emerald-100 text-xs mt-2 p-2 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 rounded-full border border-emerald-500/20">
              <div className="text-center">
                <span className="font-bold text-sm">{currentArea.toFixed(2)} km²</span>
                <span className="text-emerald-300/60 ml-1">({(currentArea * 0.386102).toFixed(2)} mi²)</span>
              </div>
            </div>

            <button
              onClick={clearDrawing}
              className="w-full px-3 py-1.5 bg-gradient-to-r from-cyan-600/20 to-emerald-600/20 hover:from-cyan-600/30 hover:to-emerald-600/30 text-emerald-300 rounded-full transition-all text-xs font-medium border border-emerald-500/20 shadow-[0_0_10px_rgba(0,255,136,0.2)]"
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