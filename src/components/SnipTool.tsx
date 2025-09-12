"use client";
import { useEffect, useRef, useState } from 'react';
import * as turf from '@turf/turf';
import type mapboxgl from 'mapbox-gl';

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

  // Clear when parent tells us to
  useEffect(() => {
    if (shouldClear) {
      clearDrawing();
    }
  }, [shouldClear]);

  const clearDrawing = () => {
    setIsDrawing(false);
    setIsAnalyzing(false);
    firstCorner.current = null;
    currentRectangle.current = null;
    setCurrentArea(0);
    
    // Clear visualization
    if (map && map.getSource('rectangle-source')) {
      const source = map.getSource('rectangle-source') as mapboxgl.GeoJSONSource;
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

    // Handle map clicks for rectangle drawing
    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      console.log('🖱️ Map clicked, isDrawing:', isDrawing);
      if (!isDrawing) return;

      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      if (!firstCorner.current) {
        // First click - set first corner
        firstCorner.current = coords;
        console.log('📍 First corner set:', coords);
        
        // Show a point at first corner
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
          console.log('📍 Point data set on source');
        } else {
          console.error('❌ Rectangle source not found!');
        }
      } else {
        // Second click - complete rectangle
        const corner1 = firstCorner.current;
        const corner2 = coords;
        
        console.log('📍 Second corner set:', coords);
        
        // Create rectangle from two corners using turf for proper geodesic shape
        const minX = Math.min(corner1[0], corner2[0]);
        const maxX = Math.max(corner1[0], corner2[0]);
        const minY = Math.min(corner1[1], corner2[1]);
        const maxY = Math.max(corner1[1], corner2[1]);
        
        // Use turf.bboxPolygon to create a proper rectangle
        // This handles projection issues better
        const rectangle = turf.bboxPolygon([minX, minY, maxX, maxY]);
        
        // Ensure it's a Feature not just geometry
        if (rectangle.type !== 'Feature') {
          rectangle.type = 'Feature';
        }
        rectangle.properties = rectangle.properties || {};

        // Calculate area first
        const area = turf.area(rectangle);
        const areaKm2 = area / 1000000;
        setCurrentArea(areaKm2);

        // Update visualization
        const collection: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: [rectangle]
        };
        const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(collection);
          console.log('✅ Rectangle data set, area:', areaKm2.toFixed(2), 'km²');
        } else {
          console.error('❌ Rectangle source not found during completion!');
        }

        console.log('✅ Rectangle completed:', {
          area: `${areaKm2.toFixed(2)} km²`,
          bounds: [corner1, corner2]
        });

        // Store the rectangle for later
        currentRectangle.current = rectangle;

        // Keep rectangle visible and start pulsing animation
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
      }
    };

    // Handle mouse move for preview
    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawing || !firstCorner.current) return;

      const corner1 = firstCorner.current;
      const corner2: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      // Create preview rectangle using turf for proper shape
      const minX = Math.min(corner1[0], corner2[0]);
      const maxX = Math.max(corner1[0], corner2[0]);
      const minY = Math.min(corner1[1], corner2[1]);
      const maxY = Math.max(corner1[1], corner2[1]);
      
      // Use turf.bboxPolygon for consistent rectangle shape
      const rectangle = turf.bboxPolygon([minX, minY, maxX, maxY]);
      rectangle.properties = rectangle.properties || {};

      // Update visualization
      const collection: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [rectangle]
      };
      const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(collection);
        // Log every 10th mouse move to avoid spam
        if (Math.random() < 0.1) {
          console.log('👁️ Preview updating...');
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
      
      // Add event listeners after setup
      map.on('click', handleMapClick);
      map.on('mousemove', handleMouseMove);
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
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
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
    if (map.getSource('rectangle-source')) {
      const source = map.getSource('rectangle-source') as mapboxgl.GeoJSONSource;
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
    setIsDrawing(true);
    firstCorner.current = null;
    setCurrentArea(0);
    
    // Clear any existing rectangle
    if (map) {
      const source = map.getSource('rectangle-source') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: []
        });
      }
    }
    
    console.log('🎯 Rectangle drawing mode activated');
  };

  return (
    <div className="absolute top-20 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <h3 className="text-white font-semibold mb-3">🎯 Analyze Area</h3>
      
      <div className="space-y-2">
        <button
          onClick={startDrawing}
          disabled={isDrawing || isAnalyzing}
          className={`w-full px-4 py-2 ${
            isAnalyzing
              ? 'bg-blue-600 cursor-not-allowed animate-pulse'
              : isDrawing 
              ? 'bg-yellow-600 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white rounded-lg transition-colors flex items-center justify-center gap-2`}
        >
          {isAnalyzing ? (
            <>
              <span className="animate-spin">⚙️</span> Analyzing data...
            </>
          ) : isDrawing ? (
            <>
              <span>▭</span> Drawing...
            </>
          ) : (
            <>
              <span>▭</span> Select Area to Analyze
            </>
          )}
        </button>

        {currentArea > 0 && (
          <>
            <div className="text-white text-sm mt-3 p-2 bg-white/10 rounded">
              <div>Area: <span className="font-bold">{currentArea.toFixed(2)} km²</span></div>
              <div className="text-xs opacity-70">
                ({(currentArea * 0.386102).toFixed(2)} mi²)
              </div>
            </div>

      <button
              onClick={clearDrawing}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
      >
              Clear
      </button>
          </>
        )}
      </div>

      {isDrawing && (
        <div className="text-xs text-green-400 mt-2 animate-pulse">
          {firstCorner.current 
            ? 'Click to set opposite corner' 
            : 'Click to set first corner'}
        </div>
      )}
    </div>
  );
}