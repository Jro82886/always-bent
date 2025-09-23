'use client';
import { useState } from 'react';
import SnipOverlay from './SnipOverlay';
import type mapboxgl from 'mapbox-gl';

type Props = {
  map: mapboxgl.Map | null;
};

export default function TestSnipButton({ map }: Props) {
  const [isDrawing, setIsDrawing] = useState(false);
  
  const handleStart = () => {
    if (!map) return;
    console.log('[TestSnip] Starting overlay draw mode');
    setIsDrawing(true);
  };
  
  const handleComplete = (polygon: GeoJSON.Polygon) => {
    console.log('[TestSnip] Draw complete:', polygon);
    setIsDrawing(false);
    
    // Zoom to polygon
    const coords = polygon.coordinates[0];
    const bounds = coords.reduce((bounds, coord) => {
      return bounds.extend(coord as [number, number]);
    }, new (window as any).mapboxgl.LngLatBounds(coords[0], coords[0]));
    
    map?.fitBounds(bounds, {
      padding: 50,
      duration: 850
    });
  };
  
  const handleCancel = () => {
    console.log('[TestSnip] Draw canceled');
    setIsDrawing(false);
  };
  
  // Also expose to window for testing
  if (typeof window !== 'undefined') {
    (window as any).testSnipOverlay = handleStart;
  }
  
  return (
    <>
      {!isDrawing && (
        <button
          onClick={handleStart}
          className="fixed bottom-32 right-4 z-[99999] px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg shadow-xl"
          style={{ pointerEvents: 'auto' }}
        >
          TEST OVERLAY SNIP
        </button>
      )}
      
      {isDrawing && map && (
        <SnipOverlay 
          map={map} 
          onComplete={handleComplete} 
          onCancel={handleCancel} 
        />
      )}
    </>
  );
}
