'use client';

import MapRoot from '@/components/MapRoot';
import AnalysisBar from '@/components/AnalysisBar';
import { useMVPState } from '@/lib/mvpState';
import { useEffect, useRef } from 'react';

export default function MVPPage() {
  const { snipOn, setSnipBox, setSnipOn } = useMVPState();
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Get map instance
  useEffect(() => {
    const interval = setInterval(() => {
      const map = (window as any).abfiMap;
      if (map) {
        mapRef.current = map;
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Handle snip tool
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !snipOn) return;

    let startPoint: { x: number; y: number } | null = null;
    let boxElement: HTMLDivElement | null = null;

    const onMouseDown = (e: MouseEvent) => {
      startPoint = { x: e.clientX, y: e.clientY };
      
      // Create visual rectangle
      boxElement = document.createElement('div');
      boxElement.style.cssText = `
        position: absolute;
        border: 2px solid #00DDEB;
        background: rgba(0,221,235,0.1);
        pointer-events: none;
        z-index: 1000;
      `;
      document.body.appendChild(boxElement);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!startPoint || !boxElement) return;
      
      const left = Math.min(startPoint.x, e.clientX);
      const top = Math.min(startPoint.y, e.clientY);
      const width = Math.abs(e.clientX - startPoint.x);
      const height = Math.abs(e.clientY - startPoint.y);
      
      boxElement.style.left = `${left}px`;
      boxElement.style.top = `${top}px`;
      boxElement.style.width = `${width}px`;
      boxElement.style.height = `${height}px`;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!startPoint || !boxElement) return;
      
      // Convert screen coordinates to map coordinates
      const sw = map.unproject([
        Math.min(startPoint.x, e.clientX),
        Math.max(startPoint.y, e.clientY)
      ]);
      const ne = map.unproject([
        Math.max(startPoint.x, e.clientX),
        Math.min(startPoint.y, e.clientY)
      ]);

      setSnipBox({
        west: sw.lng,
        south: sw.lat,
        east: ne.lng,
        north: ne.lat
      });

      // Cleanup
      boxElement.remove();
      boxElement = null;
      startPoint = null;
      setSnipOn(false);
    };

    // Set crosshair cursor and disable map interactions
    const canvas = map.getCanvas();
    const originalCursor = canvas.style.cursor;
    canvas.style.cursor = 'crosshair';
    
    map.boxZoom.disable();
    map.dragPan.disable();

    canvas.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.style.cursor = originalCursor;
      map.boxZoom.enable();
      map.dragPan.enable();
      
      canvas.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      if (boxElement) {
        boxElement.remove();
      }
    };
  }, [snipOn, setSnipBox, setSnipOn]);

  return (
    <div className="w-full h-screen relative">
      <MapRoot>
        <AnalysisBar />
        
        {/* Mode indicator */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm pointer-events-none">
          Analysis Mode
        </div>
        
        {/* Snip instruction */}
        {snipOn && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm pointer-events-none">
            Drag to select area for analysis
          </div>
        )}
      </MapRoot>
    </div>
  );
}
