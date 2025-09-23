'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';

type Props = {
  map: mapboxgl.Map;
  onComplete: (polygon: GeoJSON.Polygon) => void;
  onCancel: () => void;
};

export default function SnipOverlay({ map, onComplete, onCancel }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const startPoint = useRef<[number, number] | null>(null);
  const [drawing, setDrawing] = useState(false);
  
  useEffect(() => {
    if (!map) return;
    
    // Create overlay div that covers the entire map
    const mapContainer = map.getContainer();
    const overlay = document.createElement('div');
    overlay.id = 'snip-overlay-capture';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999999;
      cursor: crosshair;
      pointer-events: auto;
      background: transparent;
    `;
    mapContainer.appendChild(overlay);
    
    console.log('[SnipOverlay] Created blocking overlay');
    
    // Freeze ALL map interactions
    const freezeMap = () => {
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.dragRotate.disable();
      map.doubleClickZoom.disable();
      map.keyboard.disable();
      map.touchZoomRotate.disable();
      (map as any)._interactive = false;
      console.log('[SnipOverlay] Map frozen');
    };
    
    const unfreezeMap = () => {
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.boxZoom.enable();
      map.dragRotate.enable();
      map.doubleClickZoom.enable();
      map.keyboard.enable();
      map.touchZoomRotate.enable();
      (map as any)._interactive = true;
      console.log('[SnipOverlay] Map unfrozen');
    };
    
    freezeMap();
    
    // Drawing functions
    const projectToLngLat = (clientX: number, clientY: number) => {
      const rect = mapContainer.getBoundingClientRect();
      const point = new (window as any).mapboxgl.Point(
        clientX - rect.left,
        clientY - rect.top
      );
      return map.unproject(point);
    };
    
    const drawRect = (start: [number, number], end: [number, number]) => {
      const srcId = 'snip-overlay-rect';
      const lyrId = 'snip-overlay-rect-layer';
      
      const minX = Math.min(start[0], end[0]);
      const maxX = Math.max(start[0], end[0]);
      const minY = Math.min(start[1], end[1]);
      const maxY = Math.max(start[1], end[1]);
      
      const polygon: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [[
          [minX, minY],
          [maxX, minY],
          [maxX, maxY],
          [minX, maxY],
          [minX, minY]
        ]]
      };
      
      const data: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: polygon,
          properties: {}
        }]
      };
      
      if (!map.getSource(srcId)) {
        map.addSource(srcId, { type: 'geojson', data });
        map.addLayer({
          id: lyrId,
          type: 'line',
          source: srcId,
          paint: {
            'line-color': '#22e1a7',
            'line-width': 2
          }
        });
        map.addLayer({
          id: lyrId + '-fill',
          type: 'fill',
          source: srcId,
          paint: {
            'fill-color': '#22e1a7',
            'fill-opacity': 0.15
          }
        }, lyrId);
      } else {
        (map.getSource(srcId) as mapboxgl.GeoJSONSource).setData(data);
      }
      
      return polygon;
    };
    
    const clearRect = () => {
      const srcId = 'snip-overlay-rect';
      const lyrId = 'snip-overlay-rect-layer';
      try {
        if (map.getLayer(lyrId + '-fill')) map.removeLayer(lyrId + '-fill');
        if (map.getLayer(lyrId)) map.removeLayer(lyrId);
        if (map.getSource(srcId)) map.removeSource(srcId);
      } catch (e) {
        // Ignore
      }
    };
    
    // Event handlers - on the OVERLAY, not the map!
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const lngLat = projectToLngLat(e.clientX, e.clientY);
      startPoint.current = [lngLat.lng, lngLat.lat];
      setDrawing(true);
      console.log('[SnipOverlay] Started drawing at', startPoint.current);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!drawing || !startPoint.current) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const lngLat = projectToLngLat(e.clientX, e.clientY);
      const endPoint: [number, number] = [lngLat.lng, lngLat.lat];
      drawRect(startPoint.current, endPoint);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!drawing || !startPoint.current) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const lngLat = projectToLngLat(e.clientX, e.clientY);
      const endPoint: [number, number] = [lngLat.lng, lngLat.lat];
      
      // Check if big enough
      const dx = Math.abs(endPoint[0] - startPoint.current[0]);
      const dy = Math.abs(endPoint[1] - startPoint.current[1]);
      
      if (dx < 0.0001 || dy < 0.0001) {
        console.log('[SnipOverlay] Too small, canceling');
        clearRect();
        overlay.remove();
        unfreezeMap();
        onCancel();
        return;
      }
      
      const polygon = drawRect(startPoint.current, endPoint);
      console.log('[SnipOverlay] Completed polygon', polygon);
      
      // Clean up and complete
      setTimeout(() => {
        clearRect();
        overlay.remove();
        unfreezeMap();
        onComplete(polygon);
      }, 100);
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[SnipOverlay] Canceled via ESC');
        clearRect();
        overlay.remove();
        unfreezeMap();
        onCancel();
      }
    };
    
    // Prevent ALL default behaviors
    const blockEvent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };
    
    // Attach listeners to OVERLAY
    overlay.addEventListener('mousedown', handleMouseDown);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);
    overlay.addEventListener('click', blockEvent);
    overlay.addEventListener('dblclick', blockEvent);
    overlay.addEventListener('contextmenu', blockEvent);
    overlay.addEventListener('wheel', blockEvent);
    overlay.addEventListener('touchstart', blockEvent);
    overlay.addEventListener('touchmove', blockEvent);
    window.addEventListener('keydown', handleEscape);
    
    return () => {
      const existingOverlay = document.getElementById('snip-overlay-capture');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      clearRect();
      unfreezeMap();
      window.removeEventListener('keydown', handleEscape);
    };
  }, [map, onComplete, onCancel]);
  
  return null;
}
