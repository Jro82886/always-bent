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
  const dateISO = useSelectedDateISO();
  const { sstOn, chlOn } = useLayerFlags();
  const selectedInletId = useAppState(s => s.selectedInletId);

  useEffect(() => {
    if (!map) return;
    
    const draw = new MapboxDraw({ 
      displayControlsDefault: false, 
      controls: { polygon: true, trash: true },
      styles: [
        {
          id: 'gl-draw-polygon-fill-inactive',
          type: 'fill',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#3bb2d0',
            'fill-outline-color': '#3bb2d0',
            'fill-opacity': 0.1
          }
        },
        {
          id: 'gl-draw-polygon-stroke-inactive',
          type: 'line',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': '#3bb2d0',
            'line-width': 2
          }
        }
      ]
    });
    
    map.addControl(draw, 'top-left');
    drawRef.current = draw;

    const onCreate = (e: any) => {
      const g = e.features?.[0]?.geometry;
      if (g?.type === 'Polygon') { 
        polyRef.current = g;
        setDrawing(false);
        setReviewing(true);
        console.log('[SimpleSnip] Polygon created:', g);
      }
    };
    
    const onDelete = () => {
      polyRef.current = null;
      setReviewing(false);
    };
    
    map.on('draw.create', onCreate);
    map.on('draw.delete', onDelete);
    
    // Expose global function for compatibility
    (window as any).startSnipping = () => {
      draw.changeMode('draw_polygon');
      setDrawing(true);
    };
    
    return () => { 
      map.off('draw.create', onCreate);
      map.off('draw.delete', onDelete);
      map.removeControl(draw);
      delete (window as any).startSnipping;
    };
  }, [map]);

  async function review() {
    if (!polyRef.current) return;
    
    console.log('[SimpleSnip] Starting analysis...');
    setReviewing(false);
    
    try {
      const vm = await runAnalyze(polyRef.current, dateISO); // real /api/analyze
      console.log('[SimpleSnip] Analysis VM:', vm);
      
      openWithVM(vm); // set VM → open modal (order locked)
      
      // Fire AI in parallel (non-blocking UI)
      const inlet = { id: selectedInletId || 'default', name: 'Default' };
      kickAI(vm, { sstOn, chlOn }, inlet, dateISO);
      
      // Clear the drawing
      if (drawRef.current) {
        drawRef.current.deleteAll();
      }
      polyRef.current = null;
      
      // Notify parent if needed
      if (onAnalysisComplete) {
        onAnalysisComplete({ success: true });
      }
    } catch (error) {
      console.error('[SimpleSnip] Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    }
  }
  
  function startDrawing() {
    if (!drawRef.current) return;
    drawRef.current.changeMode('draw_polygon');
    setDrawing(true);
    setReviewing(false);
  }
  
  function cancel() {
    if (drawRef.current) {
      drawRef.current.deleteAll();
    }
    polyRef.current = null;
    setReviewing(false);
  }

  // Add debug logging
  useEffect(() => {
    console.log('[SimpleSnipTool] Mounted, map:', !!map);
  }, [map]);

  return (
    <>
      {/* Draw Button - Always visible for now */}
      {!drawing && !reviewing && (
        <div className="fixed top-20 right-4 z-[100]">
          <button
            onClick={startDrawing}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg shadow-lg"
          >
            🎯 Draw Analysis Area
          </button>
        </div>
      )}

      {/* Drawing Instructions */}
      {drawing && (
        <div className="fixed top-20 right-4 z-[100] bg-slate-900/95 p-4 rounded-lg">
          <p className="text-cyan-300">Click points to draw polygon, double-click to finish</p>
        </div>
      )}

      {/* Review Bar */}
      {reviewing && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl px-6 py-3 border border-cyan-500/30">
            <div className="flex items-center gap-4">
              <span className="text-cyan-300">Area selected • Ready to analyze</span>
              <button 
                onClick={review}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg"
              >
                Review analysis
              </button>
              <button 
                onClick={cancel}
                className="px-3 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
