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

  useEffect(() => {
    if (!map) return;
    
    let initialized = false;

    // Add sources and layers for rectangle visualization
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

        // Add fill layer
        map.addLayer({
          id: 'rectangle-fill',
          type: 'fill',
          source: 'rectangle',
          paint: {
            'fill-color': '#00ff00',
            'fill-opacity': 0.5  // More visible
          }
        });

        // Add outline layer
        map.addLayer({
          id: 'rectangle-outline',
          type: 'line',
          source: 'rectangle',
          paint: {
            'line-color': '#00ff00',
            'line-width': 6,  // Thicker line
            'line-dasharray': [0, 0]  // Solid line for now
          }
        });
        
        // FORCE layers to absolute top - run multiple times to ensure
        const ensureOnTop = () => {
          if (map.getLayer('rectangle-fill')) {
            map.moveLayer('rectangle-fill');
          }
          if (map.getLayer('rectangle-outline')) {
            map.moveLayer('rectangle-outline');
          }
        };
        
        // Run immediately and after delays to beat any other layers
        ensureOnTop();
        setTimeout(ensureOnTop, 100);
        setTimeout(ensureOnTop, 500);
        setTimeout(ensureOnTop, 1000);
        
        console.log('✅ Rectangle layers setup complete');
      } catch (error) {
        console.error('❌ Error setting up rectangle layers:', error);
      }
    };

    // Handle mouse down - start drawing
    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawingRef.current) return;
      
      e.preventDefault();
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      firstCorner.current = coords;
      isDragging.current = true;
      
      console.log('🖱️ Started dragging from:', coords, 'isDrawing:', isDrawingRef.current);
      
      // Show initial point
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

    // Setup on map load - ensure layers are ready
    const initializeLayers = () => {
      if (initialized || layersInitialized.current) return;
      initialized = true;
      layersInitialized.current = true;
      
      setupLayers();
      
      // Add drag event listeners
      map.on('mousedown', handleMouseDown);
      map.on('mousemove', handleMouseMove);
      map.on('mouseup', handleMouseUp);
      document.addEventListener('keydown', handleKeyDown);
    };

    if (map.loaded()) {
      // Small delay to ensure map is fully ready
      setTimeout(initializeLayers, 100);
    } else {
      map.once('load', initializeLayers);
    }

    // Change cursor and disable map dragging when drawing
    if (isDrawing) {
      map.getCanvas().style.cursor = 'crosshair';
      map.dragPan.disable();  // Disable map dragging
      map.boxZoom.disable();  // Disable box zoom
    } else {
      map.getCanvas().style.cursor = '';
      map.dragPan.enable();   // Re-enable map dragging
      map.boxZoom.enable();   // Re-enable box zoom
    }

    // Cleanup
    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      map.getCanvas().style.cursor = '';
      map.dragPan.enable();  // Re-enable map dragging on cleanup
      map.boxZoom.enable();  // Re-enable box zoom on cleanup
      
      // Don't remove layers/source on cleanup - they should persist
      // Only remove them when component unmounts completely
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
    }
    
    // Set cursor immediately
    map.getCanvas().style.cursor = 'crosshair';
    
    console.log('🎯 Rectangle drawing mode activated - click and drag to draw');
  };

  return (
    <div className="absolute bottom-32 right-4 bg-black/70 backdrop-blur-md rounded-full px-6 py-4 shadow-lg z-20 border border-cyan-500/20">
      <h3 className="text-cyan-300 font-semibold mb-3 text-sm text-center flex items-center justify-center gap-2">
        <Target size={14} className="text-cyan-400" />
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
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 cursor-not-allowed animate-pulse'
              : isDrawing 
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400'
          } text-white rounded-full transition-all shadow-lg flex items-center justify-center gap-2 text-sm font-medium`}
          style={{
            boxShadow: isAnalyzing || isDrawing ? '0 0 20px rgba(0, 200, 255, 0.4)' : undefined
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
            <div className="text-cyan-100 text-xs mt-2 p-2 bg-cyan-500/10 rounded-full border border-cyan-500/20">
              <div className="text-center">
                <span className="font-bold text-sm">{currentArea.toFixed(2)} km²</span>
                <span className="text-cyan-300/60 ml-1">({(currentArea * 0.386102).toFixed(2)} mi²)</span>
              </div>
            </div>

            <button
              onClick={clearDrawing}
              className="w-full px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-full transition-all text-xs font-medium border border-cyan-500/20"
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