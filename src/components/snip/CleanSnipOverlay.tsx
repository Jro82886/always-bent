'use client';
import { useEffect, useRef, useState } from 'react';
import type mapboxgl from 'mapbox-gl';

interface Props {
  map: mapboxgl.Map;
  isActive: boolean;
  onComplete: (bbox: [number, number, number, number]) => void;
  onCancel: () => void;
}

export default function CleanSnipOverlay({ map, isActive, onComplete, onCancel }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const rectRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (!isActive || !map) return;
    
    console.log('[CleanSnip] Activating overlay');
    
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Record start position
      startRef.current = { x: e.clientX, y: e.clientY };
      
      // Create visual rectangle
      if (rectRef.current) {
        rectRef.current.remove();
      }
      rectRef.current = document.createElement('div');
      rectRef.current.style.cssText = `
        position: fixed;
        border: 2px solid #00ffc8;
        background: rgba(0, 255, 200, 0.1);
        z-index: 2147483647;
        pointer-events: none;
      `;
      document.body.appendChild(rectRef.current);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!startRef.current || !rectRef.current) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const x = Math.min(e.clientX, startRef.current.x);
      const y = Math.min(e.clientY, startRef.current.y);
      const w = Math.abs(e.clientX - startRef.current.x);
      const h = Math.abs(e.clientY - startRef.current.y);
      
      rectRef.current.style.left = x + 'px';
      rectRef.current.style.top = y + 'px';
      rectRef.current.style.width = w + 'px';
      rectRef.current.style.height = h + 'px';
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!startRef.current) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const x1 = Math.min(e.clientX, startRef.current.x);
      const y1 = Math.min(e.clientY, startRef.current.y);
      const x2 = Math.max(e.clientX, startRef.current.x);
      const y2 = Math.max(e.clientY, startRef.current.y);
      
      // Clean up rectangle
      if (rectRef.current) {
        rectRef.current.remove();
        rectRef.current = null;
      }
      
      // Convert to map coordinates
      const sw = map.unproject([x1, y2]);
      const ne = map.unproject([x2, y1]);
      
      // Check if box is big enough
      if (Math.abs(x2 - x1) < 10 || Math.abs(y2 - y1) < 10) {
        console.log('[CleanSnip] Box too small, canceling');
        startRef.current = null;
        onCancel();
        return;
      }
      
      const bbox: [number, number, number, number] = [
        sw.lng, sw.lat, ne.lng, ne.lat
      ];
      
      console.log('[CleanSnip] Completed with bbox:', bbox);
      startRef.current = null;
      onComplete(bbox);
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[CleanSnip] Canceled via ESC');
        if (rectRef.current) {
          rectRef.current.remove();
          rectRef.current = null;
        }
        startRef.current = null;
        onCancel();
      }
    };
    
    // Freeze map interactions
    map.dragPan.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
    map.doubleClickZoom.disable();
    map.keyboard.disable();
    map.touchZoomRotate.disable();
    
    // Add event listeners
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.addEventListener('mousedown', handleMouseDown);
      overlay.addEventListener('mousemove', handleMouseMove);
      overlay.addEventListener('mouseup', handleMouseUp);
    }
    window.addEventListener('keydown', handleEscape);
    
    // Cleanup
    return () => {
      console.log('[CleanSnip] Cleaning up');
      
      // Re-enable map
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.boxZoom.enable();
      map.dragRotate.enable();
      map.doubleClickZoom.enable();
      map.keyboard.enable();
      map.touchZoomRotate.enable();
      
      // Remove listeners
      if (overlay) {
        overlay.removeEventListener('mousedown', handleMouseDown);
        overlay.removeEventListener('mousemove', handleMouseMove);
        overlay.removeEventListener('mouseup', handleMouseUp);
      }
      window.removeEventListener('keydown', handleEscape);
      
      // Clean up any leftover rectangle
      if (rectRef.current) {
        rectRef.current.remove();
        rectRef.current = null;
      }
    };
  }, [isActive, map, onComplete, onCancel]);
  
  if (!isActive) return null;
  
  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        cursor: 'crosshair',
        backgroundColor: 'transparent',
      }}
      aria-label="Drawing Overlay"
    />
  );
}
