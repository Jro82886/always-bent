"use client";
import { useEffect, useRef, useState } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import * as turf from '@turf/turf';
import type mapboxgl from 'mapbox-gl';

interface SnipToolProps {
  map: mapboxgl.Map | null;
  onAnalyze?: (polygon: GeoJSON.Feature) => void;
}

export default function SnipTool({ map, onAnalyze }: SnipToolProps) {
  const drawRef = useRef<MapboxDraw | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentArea, setCurrentArea] = useState<number>(0);

  useEffect(() => {
    if (!map) return;

    // Initialize Mapbox Draw
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'simple_select',
      styles: [
        // Active polygon fill
        {
          id: 'gl-draw-polygon-fill-active',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': '#00ff00',
            'fill-opacity': 0.1
          }
        },
        // Active polygon outline
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': '#00ff00',
            'line-dasharray': [2, 2],
            'line-width': 3
          }
        },
        // Vertex points
        {
          id: 'gl-draw-polygon-midpoint',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
          paint: {
            'circle-radius': 4,
            'circle-color': '#00ff00'
          }
        },
        // Vertex points
        {
          id: 'gl-draw-polygon-and-line-vertex-active',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex'], ['!=', 'mode', 'static']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#00ff00',
          }
        }
      ]
    });

    map.addControl(draw as any, 'top-right');
    drawRef.current = draw;

    // Event handlers
    const handleCreate = (e: any) => {
      const feature = e.features[0];
      if (feature) {
        // Calculate area
        const area = turf.area(feature);
        const areaKm2 = area / 1000000;
        setCurrentArea(areaKm2);
        
        console.log('📐 Polygon created:', {
          area: `${areaKm2.toFixed(2)} km²`,
          coordinates: feature.geometry.coordinates
        });

        // Trigger analysis
        if (onAnalyze) {
          onAnalyze(feature);
        }
      }
    };

    const handleUpdate = (e: any) => {
      const feature = e.features[0];
      if (feature) {
        const area = turf.area(feature);
        const areaKm2 = area / 1000000;
        setCurrentArea(areaKm2);
      }
    };

    const handleDelete = () => {
      setCurrentArea(0);
      setIsDrawing(false);
    };

    const handleModeChange = (e: any) => {
      setIsDrawing(e.mode.includes('draw'));
    };

    map.on('draw.create', handleCreate);
    map.on('draw.update', handleUpdate);
    map.on('draw.delete', handleDelete);
    map.on('draw.modechange', handleModeChange);

    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', handleUpdate);
      map.off('draw.delete', handleDelete);
      map.off('draw.modechange', handleModeChange);
      
      if (drawRef.current) {
        map.removeControl(drawRef.current as any);
        drawRef.current = null;
      }
    };
  }, [map, onAnalyze]);

  const startDrawing = (mode: 'polygon' | 'rectangle') => {
    if (drawRef.current) {
      // Clear existing drawings
      drawRef.current.deleteAll();
      setCurrentArea(0);
      
      // Start drawing
      if (mode === 'rectangle') {
        drawRef.current.changeMode('draw_rectangle' as any);
      } else {
        drawRef.current.changeMode('draw_polygon');
      }
      setIsDrawing(true);
    }
  };

  const clearDrawing = () => {
    if (drawRef.current) {
      drawRef.current.deleteAll();
      setCurrentArea(0);
      setIsDrawing(false);
    }
  };

  return (
    <div className="absolute top-20 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <h3 className="text-white font-semibold mb-3">📐 Snip-It Tool</h3>
      
      <div className="space-y-2">
        <button
          onClick={() => startDrawing('rectangle')}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>▭</span> Draw Rectangle
        </button>
        
        <button
          onClick={() => startDrawing('polygon')}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>⬟</span> Draw Polygon
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
          Click points to draw, double-click to finish
        </div>
      )}
    </div>
  );
}