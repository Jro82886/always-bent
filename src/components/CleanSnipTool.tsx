'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { useAppState } from '@/lib/store';
import { runAnalyzeV2 } from '@/features/analysis/runAnalysisV2';

interface Props {
  map: mapboxgl.Map;
  onAnalysisComplete?: (analysis: any) => void;
}

export default function CleanSnipTool({ map, onAnalysisComplete }: Props) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<GeoJSON.Polygon | null>(null);
  const [showReviewBar, setShowReviewBar] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Drawing state
  const startPoint = useRef<[number, number] | null>(null);
  const currentBox = useRef<mapboxgl.Marker[]>([]);

  // Start drawing
  const startDrawing = useCallback(() => {
    if (!map) return;
    
    setIsDrawing(true);
    setShowReviewBar(false);
    map.getCanvas().style.cursor = 'crosshair';
    
    // Clear any existing drawings
    currentBox.current.forEach(marker => marker.remove());
    currentBox.current = [];
  }, [map]);

  // Handle mouse down
  const onMouseDown = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!isDrawing) return;
    
    startPoint.current = [e.lngLat.lng, e.lngLat.lat];
    map.on('mousemove', onMouseMove);
    map.once('mouseup', onMouseUp);
  }, [isDrawing, map]);

  // Handle mouse move
  const onMouseMove = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!startPoint.current) return;
    
    const endPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    
    // Clear previous box
    currentBox.current.forEach(marker => marker.remove());
    currentBox.current = [];
    
    // Draw new box
    const bounds = [
      [Math.min(startPoint.current[0], endPoint[0]), Math.min(startPoint.current[1], endPoint[1])],
      [Math.max(startPoint.current[0], endPoint[0]), Math.max(startPoint.current[1], endPoint[1])]
    ];
    
    // Create polygon from bounds
    const polygon = turf.bboxPolygon([bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]]);
    
    // Draw corners
    const corners = [
      [bounds[0][0], bounds[0][1]],
      [bounds[1][0], bounds[0][1]],
      [bounds[1][0], bounds[1][1]],
      [bounds[0][0], bounds[1][1]]
    ];
    
    corners.forEach(corner => {
      const el = document.createElement('div');
      el.className = 'w-2 h-2 bg-green-400 rounded-full';
      const marker = new mapboxgl.Marker(el)
        .setLngLat(corner as [number, number])
        .addTo(map);
      currentBox.current.push(marker);
    });
    
    setCurrentPolygon(polygon.geometry);
  }, [map]);

  // Handle mouse up
  const onMouseUp = useCallback(() => {
    if (!currentPolygon) return;
    
    map.off('mousemove', onMouseMove);
    setIsDrawing(false);
    map.getCanvas().style.cursor = '';
    
    // Check minimum area
    const area = turf.area(currentPolygon) / 1000000; // km²
    if (area < 0.5) {
      alert('Area too small. Draw a larger area.');
      currentBox.current.forEach(marker => marker.remove());
      currentBox.current = [];
      setCurrentPolygon(null);
      return;
    }
    
    // Store polygon and show review bar
    setShowReviewBar(true);
    
    // Update store
    const { setAnalysis } = useAppState.getState();
    setAnalysis({
      lastSnipPolygon: currentPolygon,
      lastSnipBBox: turf.bbox(currentPolygon) as [number, number, number, number],
      lastSnipCenter: turf.centroid(currentPolygon).geometry.coordinates
    });
  }, [currentPolygon, map, onMouseMove]);

  // Handle review click
  const handleReview = useCallback(async () => {
    if (!currentPolygon) return;
    
    console.log('[CleanSnip] Starting analysis...');
    setIsAnalyzing(true);
    setShowReviewBar(false);
    
    try {
      // This calls the API and updates the store
      await runAnalyzeV2(currentPolygon);
      console.log('[CleanSnip] Analysis complete!');
      
      // Clean up
      currentBox.current.forEach(marker => marker.remove());
      currentBox.current = [];
      setCurrentPolygon(null);
      
      // Notify parent
      if (onAnalysisComplete) {
        onAnalysisComplete({ success: true });
      }
    } catch (error) {
      console.error('[CleanSnip] Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentPolygon, onAnalysisComplete]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setShowReviewBar(false);
    currentBox.current.forEach(marker => marker.remove());
    currentBox.current = [];
    setCurrentPolygon(null);
  }, []);

  // Set up map listeners
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (isDrawing) {
        onMouseDown(e);
      }
    };
    
    map.on('click', handleClick);
    
    // Expose start function
    (window as any).startSnipping = startDrawing;
    
    return () => {
      map.off('click', handleClick);
      delete (window as any).startSnipping;
    };
  }, [map, isDrawing, onMouseDown, startDrawing]);

  // Render review bar
  if (!showReviewBar) return null;
  
  return createPortal(
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl px-6 py-3 border border-cyan-500/30">
        <div className="flex items-center gap-4">
          <span className="text-cyan-300">
            Area selected • {currentPolygon && `${(turf.area(currentPolygon) / 1000000).toFixed(1)} km²`}
          </span>
          <button
            onClick={handleReview}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Review analysis'}
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-2 text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
