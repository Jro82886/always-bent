'use client';

import { useEffect, useRef, useState } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import type mapboxgl from 'mapbox-gl';
import { runAnalyze } from '@/analysis/analyzeClient';
import { openWithVM } from '@/analysis/modalControl';
import { kickAI } from '@/analysis/aiBridge';
import { useLayerFlags, useSelectedDateISO } from '@/analysis/selectors';
import { useAppState } from '@/lib/store';

interface Props {
  map: mapboxgl.Map | null;
  onAnalysisComplete?: (analysis: any) => void;
}

export default function SimpleSnipTool({ map, onAnalysisComplete }: Props) {
  const polyRef = useRef<GeoJSON.Polygon | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const dateISO = useSelectedDateISO();
  const { sstOn, chlOn } = useLayerFlags();
  const selectedInletId = useAppState(s => s.selectedInletId);

  useEffect(() => {
    if (!map) return;
    
    const draw = new MapboxDraw({ 
      displayControlsDefault: false, 
      controls: {}, // No default controls - we handle everything
      styles: [
        // Slate grey polygon for better visibility
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          paint: {
            'line-color': '#64748b', // slate-500
            'line-width': 3,
            'line-dasharray': [2, 2]
          }
        },
        {
          id: 'gl-draw-polygon-stroke-inactive',
          type: 'line',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
          paint: {
            'line-color': '#64748b', // slate-500
            'line-width': 3
          }
        },
        {
          id: 'gl-draw-polygon-fill-inactive',
          type: 'fill',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#64748b',
            'fill-opacity': 0.1
          }
        },
        {
          id: 'gl-draw-vertex',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#475569', // slate-600
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
          }
        }
      ]
    });
    
    map.addControl(draw, 'top-left');
    drawRef.current = draw;

    const onCreate = (e: any) => {
      console.log('[SimpleSnip] Draw create event:', e);
      const g = e.features?.[0]?.geometry;
      if (g?.type === 'Polygon') { 
        polyRef.current = g;
        setDrawing(false);
        setReviewing(true);
        // Reset cursor and re-enable map interactions
        map.getCanvas().style.cursor = '';
        map.dragPan.enable();
        map.scrollZoom.enable();
        map.boxZoom.enable();
        map.dragRotate.enable();
        map.doubleClickZoom.enable();
        map.touchZoomRotate.enable();
        console.log('[SimpleSnip] Polygon created, reviewing:', true);
        console.log('[SimpleSnip] Polygon geometry:', g);
      } else {
        console.log('[SimpleSnip] Not a polygon:', g);
      }
    };
    
    const onDelete = () => {
      polyRef.current = null;
      setReviewing(false);
      map.getCanvas().style.cursor = '';
    };
    
    // Handle mode changes to update cursor
    const onModeChange = (e: any) => {
      if (e.mode === 'draw_polygon') {
        map.getCanvas().style.cursor = 'crosshair';
      } else {
        map.getCanvas().style.cursor = '';
      }
    };
    
    map.on('draw.create', onCreate);
    map.on('draw.delete', onDelete);
    map.on('draw.modechange', onModeChange);
    
    // Expose global function for compatibility
    (window as any).startSnipping = () => {
      // Disable map interactions
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.dragRotate.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
      
      draw.changeMode('draw_polygon');
      map.getCanvas().style.cursor = 'crosshair';
      setDrawing(true);
    };
    
    return () => {
      // Safely remove event listeners
      if (map) {
        map.off('draw.create', onCreate);
        map.off('draw.delete', onDelete);
        map.off('draw.modechange', onModeChange);

        // Only remove control if both map and draw exist
        if (draw && map.hasControl && map.hasControl(draw)) {
          try {
            map.removeControl(draw);
          } catch (e) {
            console.warn('Failed to remove draw control:', e);
          }
        }
      }

      delete (window as any).startSnipping;
    };
  }, [map]);

  async function review() {
    console.log('[SimpleSnip] Review clicked, polygon:', polyRef.current);
    if (!polyRef.current) {
      console.error('[SimpleSnip] No polygon to analyze!');
      return;
    }

    console.log('[SimpleSnip] Starting analysis...');
    setReviewing(false);
    setAnalyzing(true);

    try {
      const vm = await runAnalyze(polyRef.current, dateISO); // real /api/analyze
      console.log('[SimpleSnip] Analysis VM:', vm);

      // Add oceanographic features to map if available
      if (vm.enhanced?.oceanographicFeatures && map) {
        const features = vm.enhanced.oceanographicFeatures;

        // Remove old feature layers if they exist
        ['edges', 'filaments', 'eddies'].forEach(type => {
          const sourceId = `snip-${type}`;
          if (map.getSource(sourceId)) {
            if (map.getLayer(`${sourceId}-fill`)) {
              map.removeLayer(`${sourceId}-fill`);
            }
            if (map.getLayer(`${sourceId}-outline`)) {
              map.removeLayer(`${sourceId}-outline`);
            }
            map.removeSource(sourceId);
          }
        });

        // Add new features to map
        const featuresByType = {
          edges: features.features.filter((f: any) => f.properties?.type === 'edge'),
          filaments: features.features.filter((f: any) => f.properties?.type === 'filament'),
          eddies: features.features.filter((f: any) => f.properties?.type === 'eddy')
        };

        Object.entries(featuresByType).forEach(([type, typeFeatures]) => {
          if (typeFeatures.length === 0) return;

          const sourceId = `snip-${type}`;
          const color = type === 'edges' ? '#FF0000' : type === 'filaments' ? '#FFFF00' : '#00FF00';

          map.addSource(sourceId, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: typeFeatures }
          });

          map.addLayer({
            id: `${sourceId}-fill`,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': color,
              'fill-opacity': 0.2
            }
          });

          map.addLayer({
            id: `${sourceId}-outline`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': color,
              'line-width': 2
            }
          });
        });
      }

      openWithVM(vm); // set VM → open modal (order locked)

      // Fire AI in parallel (non-blocking UI)
      const inlet = { id: selectedInletId || 'default', name: 'Default' };
      kickAI(vm, { sstOn, chlOn }, inlet, dateISO);

      // Clear the drawing
      if (drawRef.current) {
        drawRef.current.deleteAll();
      }
      polyRef.current = null;
      setAnalyzing(false);

      // Notify parent if needed
      if (onAnalysisComplete) {
        onAnalysisComplete({ success: true });
      }
    } catch (error: any) {
      console.error('[SimpleSnip] Analysis failed:', error);
      setAnalyzing(false);

      // Better error message based on error type
      if (error.message?.includes('timed out')) {
        alert('Analysis is taking longer than expected. The Copernicus API may be slow. Please try again with a smaller area or at a different time.');
      } else {
        alert(`Analysis failed: ${error.message || 'Unknown error'}. Please try again.`);
      }
    }
  }
  
  function startDrawing() {
    if (!drawRef.current || !map) return;
    
    console.log('[SimpleSnip] Starting draw mode');
    
    // Disable map interactions during drawing
    map.dragPan.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();
    
    // Change to draw mode
    drawRef.current.changeMode('draw_polygon');
    
    // Set cursor to crosshair
    map.getCanvas().style.cursor = 'crosshair';
    
    setDrawing(true);
    setReviewing(false);
  }
  
  function cancel() {
    if (drawRef.current) {
      drawRef.current.deleteAll();
    }
    polyRef.current = null;
    setReviewing(false);
    setDrawing(false);

    // Clean up oceanographic feature layers
    if (map) {
      ['edges', 'filaments', 'eddies'].forEach(type => {
        const sourceId = `snip-${type}`;
        if (map.getSource(sourceId)) {
          if (map.getLayer(`${sourceId}-fill`)) {
            map.removeLayer(`${sourceId}-fill`);
          }
          if (map.getLayer(`${sourceId}-outline`)) {
            map.removeLayer(`${sourceId}-outline`);
          }
          map.removeSource(sourceId);
        }
      });

      // Re-enable map interactions
      map.getCanvas().style.cursor = '';
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.boxZoom.enable();
      map.dragRotate.enable();
      map.doubleClickZoom.enable();
      map.touchZoomRotate.enable();
    }
  }


  return (
    <>
      {/* Drawing Instructions - Minimal */}
      {drawing && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100]">
          <div className="bg-black/75 text-white px-4 py-2 rounded-lg text-sm">
            Click to draw • Double-click to finish
          </div>
        </div>
      )}

      {/* Review Bar - Clean and Functional */}
      {reviewing && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
          <div className="bg-white rounded-full shadow-xl px-6 py-3 flex items-center gap-4">
            <span className="text-gray-700 font-medium">Area selected</span>
            <button
              onClick={review}
              className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-full transition-colors"
            >
              Analyze
            </button>
            <button
              onClick={cancel}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Analyzing Indicator */}
      {analyzing && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]">
          <div className="bg-black/80 text-white px-8 py-6 rounded-lg shadow-2xl flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/20 border-t-white"></div>
            <div className="text-center">
              <div className="font-medium">Analyzing Area...</div>
              <div className="text-sm text-white/70 mt-1">
                This may take up to 2 minutes for Copernicus data
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
