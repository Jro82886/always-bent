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
    
    // Clear visualization and re-enable map dragging
    if (map) {
      if (map.getSource('rectangle')) {
        const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
        source.setData({
          type: 'FeatureCollection',
          features: []
        });
      }
      map.getCanvas().style.cursor = '';
      map.dragPan.enable();
      map.dragRotate.enable();
    }
  };

  const startDrawing = () => {
    if (isDrawing || isAnalyzing || !map) {
      console.log('[SKIP] Cannot start:', { isDrawing, isAnalyzing, hasMap: !!map });
      return;
    }
    
    console.log('[START] Starting drawing mode');
    setIsDrawing(true);
    firstCorner.current = null;
    
    // Change cursor
    map.getCanvas().style.cursor = 'crosshair';
    
    // Disable map dragging while drawing
    map.dragPan.disable();
    map.dragRotate.disable();
  };

  const calculateArea = (polygon: GeoJSON.Feature<GeoJSON.Polygon>): number => {
    // Calculate area in square meters
    const areaM2 = turf.area(polygon);
    // Convert to square kilometers
    return areaM2 / 1000000;
  };

  const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
    console.log('[CLICK] Map clicked, isDrawing:', isDrawingRef.current, 'isDragging:', isDragging.current);
    
    // Ignore clicks while dragging
    if (isDragging.current) {
      console.log('[SKIP] Ignoring click during drag');
      isDragging.current = false;
      return;
    }

    if (!isDrawingRef.current) {
      console.log('[SKIP] Not in drawing mode');
      return;
    }

    const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];

    if (!firstCorner.current) {
      // First click - set first corner
      console.log('[CORNER1] First corner set:', coords);
      firstCorner.current = coords;
      
      // Add a temporary point marker
      if (map && map.getSource('rectangle')) {
        const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coords
          },
          properties: {}
        });
      }
    } else {
      // Second click - complete rectangle
      console.log('[CORNER2] Second corner set:', coords);
      const bounds = [
        firstCorner.current,
        [coords[0], firstCorner.current[1]],
        coords,
        [firstCorner.current[0], coords[1]],
        firstCorner.current
      ];

      const polygon: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [bounds]
        },
        properties: {}
      };

      // Calculate and display area
      const areaKm2 = calculateArea(polygon);
      setCurrentArea(areaKm2);
      console.log(`[AREA] Selected area: ${areaKm2.toFixed(2)} km²`);

      // Store the rectangle
      currentRectangle.current = polygon;

      // Update visualization
      if (map && map.getSource('rectangle')) {
        const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
        source.setData(polygon);
      }

      // Reset cursor and re-enable map dragging
      if (map) {
        map.getCanvas().style.cursor = '';
        map.dragPan.enable();
        map.dragRotate.enable();
      }
      
      // End drawing mode
      setIsDrawing(false);
      console.log('[COMPLETE] Rectangle drawn, ready for analysis');
      
      // Trigger analysis if callback provided
      if (onAnalyze && polygon) {
        console.log('[ANALYZE] Triggering analysis callback');
        setIsAnalyzing(true);
        try {
          await onAnalyze(polygon);
        } finally {
          setIsAnalyzing(false);
        }
      }
    }
  };

  const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
    if (!isDrawingRef.current || !firstCorner.current || !map) return;

    const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    
    // Create preview rectangle
    const bounds = [
      firstCorner.current,
      [coords[0], firstCorner.current[1]],
      coords,
      [firstCorner.current[0], coords[1]],
      firstCorner.current
    ];

    const previewPolygon: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [bounds]
      },
      properties: { preview: true }
    };

    // Calculate and display area
    const areaKm2 = calculateArea(previewPolygon);
    setCurrentArea(areaKm2);

    // Update visualization
    if (map.getSource('rectangle')) {
      const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
      source.setData(previewPolygon);
    }
  };

  // Handle escape key to cancel drawing
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawing) {
        console.log('[ESCAPE] Cancelling drawing');
        clearDrawing();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isDrawing]);

  // Set up map layers and interactions
  useEffect(() => {
    if (!map || layersInitialized.current) return;

    console.log('[INIT] Setting up snip tool layers');

    // Wait for map to be ready
    const setupLayers = () => {
      // Add source for rectangle
      if (!map.getSource('rectangle')) {
        map.addSource('rectangle', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      // Add fill layer - slate blue
      if (!map.getLayer('rectangle-fill')) {
        map.addLayer({
          id: 'rectangle-fill',
          type: 'fill',
          source: 'rectangle',
          paint: {
            'fill-color': '#64748b',  // slate-500
            'fill-opacity': 0.1
          }
        });
      }

      // Add outline layer - slate blue
      if (!map.getLayer('rectangle-outline')) {
        map.addLayer({
          id: 'rectangle-outline',
          type: 'line',
          source: 'rectangle',
          paint: {
            'line-color': '#64748b',  // slate-500
            'line-width': 2,
            'line-dasharray': [2, 2]
          }
        });
      }

      // Add corner points layer - slate blue
      if (!map.getLayer('rectangle-corners')) {
        map.addLayer({
          id: 'rectangle-corners',
          type: 'circle',
          source: 'rectangle',
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-radius': 5,
            'circle-color': '#64748b',  // slate-500
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
          }
        });
      }

      layersInitialized.current = true;
      console.log('[INIT] Layers initialized');
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once('style.load', setupLayers);
    }

    // Add click handler
    const clickHandler = (e: mapboxgl.MapMouseEvent) => {
      // Use setTimeout to ensure drag detection works
      setTimeout(() => {
        handleMapClick(e);
      }, 10);
    };
    
    // Add mouse move handler for preview
    const moveHandler = (e: mapboxgl.MapMouseEvent) => {
      handleMouseMove(e);
    };
    
    // Track dragging
    const dragStartHandler = () => {
      isDragging.current = true;
      console.log('[DRAG] Started');
    };
    
    const dragEndHandler = () => {
      setTimeout(() => {
        isDragging.current = false;
        console.log('[DRAG] Ended');
      }, 50);
    };

    map.on('click', clickHandler);
    map.on('mousemove', moveHandler);
    map.on('dragstart', dragStartHandler);
    map.on('dragend', dragEndHandler);

    return () => {
      map.off('click', clickHandler);
      map.off('mousemove', moveHandler);
      map.off('dragstart', dragStartHandler);
      map.off('dragend', dragEndHandler);
      
      // Clean up layers
      if (map.getLayer('rectangle-corners')) map.removeLayer('rectangle-corners');
      if (map.getLayer('rectangle-outline')) map.removeLayer('rectangle-outline');
      if (map.getLayer('rectangle-fill')) map.removeLayer('rectangle-fill');
      if (map.getSource('rectangle')) map.removeSource('rectangle');
      
      layersInitialized.current = false;
    };
  }, [map]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (map) {
        map.getCanvas().style.cursor = '';
      }
    };
  }, [map]);

  // Debug helper
  const debugState = () => {
    console.log('[DEBUG] Current state:');
    console.log('[STATE] isDrawing:', isDrawing);
    console.log('[STATE] isAnalyzing:', isAnalyzing);
    console.log('[STATE] firstCorner:', firstCorner.current);
    console.log('[STATE] currentArea:', currentArea);
    console.log('[STATE] currentRectangle:', currentRectangle.current);
    console.log('[STATE] isDragging:', isDragging.current);
  };

  // Add debug function to window
  useEffect(() => {
    (window as any).debugSnipTool = debugState;
    
    // Also add keyboard shortcut for debugging
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' && e.ctrlKey) {
        debugState();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDrawing, isAnalyzing, currentArea]);

  // Test function
  const testDraw = () => {
    console.log('[TEST] Starting test draw');
    startDrawing();
    setTimeout(() => {
      console.log('[STATE] isDrawing:', isDrawing);
      console.log('[STATE] isDrawingRef:', isDrawingRef.current);
      console.log('[STATE] isDragging:', isDragging.current);
    }, 100);
  };

  return (
    <>
      {/* Hidden button that can be triggered programmatically */}
      <button
        data-snip-button
        onClick={startDrawing}
        className="hidden"
        aria-label="Start Analysis Area Selection"
      >
        Start Analysis
      </button>
      
      {/* Status indicators - will be shown as overlays when active */}
      {(isDrawing || isAnalyzing) && (
        <div className="absolute top-24 right-4 z-50">
          <div className="bg-slate-900/90 backdrop-blur-md rounded-lg px-4 py-2 border border-slate-500/30 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              {isAnalyzing ? (
                <>
                  <svg className="inline-block w-4 h-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing Ocean Data...</span>
                </>
              ) : (
                <>
                  <span>▭</span>
                  <span>Click two corners to draw area</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Area display - shown as floating indicator when drawing */}
      {currentArea > 0 && !isAnalyzing && (
        <div className="absolute top-36 right-4 z-50">
          <div className="bg-slate-900/90 backdrop-blur-md rounded-lg px-4 py-2 border border-slate-500/30 shadow-lg">
            <div className="text-center">
              <span className="font-bold text-sm text-slate-300">{currentArea.toFixed(2)} km²</span>
              <span className="text-slate-300/60 ml-1 text-xs">({(currentArea * 0.386102).toFixed(2)} mi²)</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}