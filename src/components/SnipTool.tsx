"use client";
import { useEffect, useRef, useState } from 'react';
import * as turf from '@turf/turf';
import type mapboxgl from 'mapbox-gl';

interface SnipToolProps {
  map: mapboxgl.Map | null;
  onAnalyze?: (polygon: GeoJSON.Feature) => void;
}

export default function SnipTool({ map, onAnalyze }: SnipToolProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentArea, setCurrentArea] = useState<number>(0);
  const firstCorner = useRef<[number, number] | null>(null);
  const rectangleId = useRef<string>('analysis-rectangle');

  const clearDrawing = () => {
    setIsDrawing(false);
    firstCorner.current = null;
    setCurrentArea(0);
    
    // Clear visualization
    if (map) {
      const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: []
        });
      }
    }
  };

  useEffect(() => {
    if (!map) return;
    
    let initialized = false;

    // Add sources and layers for rectangle visualization
    const setupLayers = () => {
      try {
        // Remove existing if any
        if (map.getLayer('rectangle-fill')) map.removeLayer('rectangle-fill');
        if (map.getLayer('rectangle-outline')) map.removeLayer('rectangle-outline');
        if (map.getSource('rectangle')) map.removeSource('rectangle');

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
        
        // Ensure layers are on top
        const layers = map.getStyle().layers;
        if (layers && layers.length > 0) {
          const topLayerId = layers[layers.length - 1].id;
          if (topLayerId !== 'rectangle-outline') {
            map.moveLayer('rectangle-fill');
            map.moveLayer('rectangle-outline');
          }
        }
        
        console.log('✅ Rectangle layers setup complete');
        
        // TEST: Draw a test rectangle to verify layers work
        const testRectangle: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-75.5, 36.5],
                [-75.5, 36.0],
                [-75.0, 36.0],
                [-75.0, 36.5],
                [-75.5, 36.5]
              ]]
            },
            properties: {}
          }]
        };
        
        // Set test data briefly
        const src = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
        if (src) {
          src.setData(testRectangle);
          console.log('🧪 TEST RECTANGLE DRAWN - you should see a green box!');
          // Clear after 2 seconds
          setTimeout(() => {
            src.setData({ type: 'FeatureCollection', features: [] });
            console.log('🧪 Test rectangle cleared');
          }, 2000);
        }
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
        
        // Create rectangle from two corners
        const rectangle: GeoJSON.Feature<GeoJSON.Polygon> = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              corner1,
              [corner1[0], corner2[1]],
              corner2,
              [corner2[0], corner1[1]],
              corner1
            ]]
          },
          properties: {}
        };

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

        // Trigger analysis
        if (onAnalyze) {
          console.log('🔄 Triggering analysis...');
          onAnalyze(rectangle);
        }

        // Reset for next drawing
        setIsDrawing(false);
        firstCorner.current = null;
      }
    };

    // Handle mouse move for preview
    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawing || !firstCorner.current) return;

      const corner1 = firstCorner.current;
      const corner2: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      // Create preview rectangle
      const rectangle: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            corner1,
            [corner1[0], corner2[1]],
            corner2,
            [corner2[0], corner1[1]],
            corner1
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
      if (initialized) return;
      initialized = true;
      
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
      
      if (map.getLayer('rectangle-fill')) map.removeLayer('rectangle-fill');
      if (map.getLayer('rectangle-outline')) map.removeLayer('rectangle-outline');
      if (map.getSource('rectangle')) map.removeSource('rectangle');
    };
  }, [map, isDrawing, onAnalyze]);

  const startDrawing = () => {
    setIsDrawing(true);
    firstCorner.current = null;
    setCurrentArea(0);
    
    // Clear any existing rectangle
    if (map) {
      const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
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
          disabled={isDrawing}
          className={`w-full px-4 py-2 ${
            isDrawing 
              ? 'bg-yellow-600 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white rounded-lg transition-colors flex items-center justify-center gap-2`}
        >
          <span>▭</span> {isDrawing ? 'Drawing...' : 'Select Area to Analyze'}
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