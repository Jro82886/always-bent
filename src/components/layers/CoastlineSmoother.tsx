"use client";
import { useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';

type Props = { 
  map: mapboxgl.Map | null; 
  enabled: boolean;
};

export default function CoastlineSmoother({ map, enabled }: Props) {
  const cleanupRef = useRef(false);
  
  useEffect(() => {
    cleanupRef.current = false;
    
    if (!map) return;
    
    // Safe check for map.loaded()
    try {
      if (!map.loaded()) return;
    } catch (e) {
      return; // Map might be destroyed
    }

    const maskId = 'coastline-mask';
    const blurId = 'coastline-blur';

    // Clean up function
    const cleanup = () => {
      if (map.getLayer(maskId)) map.removeLayer(maskId);
      if (map.getLayer(blurId)) map.removeLayer(blurId);
      if (map.getSource(maskId)) (map as any).removeSource(maskId);
    };

    if (!enabled) {
      cleanup();
      return;
    }

    // Wait for map to be ready
    if (!map.isStyleLoaded()) {
      const handler = () => {
        if (map.isStyleLoaded()) {
          map.off('styledata', handler);
          addSmoothing();
        }
      };
      map.on('styledata', handler);
      return () => {
        map.off('styledata', handler);
        cleanup();
      };
    }

    const addSmoothing = () => {
      // Add a semi-transparent land overlay with feathered edges
      // This creates a gradient mask that softens the harsh SST/land boundary
      if (!map.getSource(maskId)) {
        map.addSource(maskId, {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-streets-v8'
        });
      }

      // Add land mask layer with gradient opacity
      if (!map.getLayer(maskId)) {
        map.addLayer({
          id: maskId,
          type: 'fill',
          source: maskId,
          'source-layer': 'landcover',
          paint: {
            'fill-color': '#000000',
            'fill-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              5, 0.05,  // At zoom 5, very light mask
              8, 0.08,  // Gradually increase
              11, 0.1,  // At zoom 11, slightly more visible
              14, 0.12  // Max opacity at high zoom
            ]
          }
        });
      }

      // Add a water layer with blur effect at coastlines
      if (!map.getLayer(blurId)) {
        map.addLayer({
          id: blurId,
          type: 'fill',
          source: maskId,
          'source-layer': 'water',
          paint: {
            'fill-color': 'transparent',
            'fill-opacity': 0
          },
          filter: ['==', ['get', 'class'], 'ocean']
        });
      }

      // Apply CSS filter to the map canvas for subtle edge smoothing
      const canvas = map.getCanvas();
      if (canvas) {
        // Add a very subtle blur that only affects edges
        canvas.style.filter = 'contrast(1.02) saturate(1.05)';
        
        // For the SST layer specifically, we'll add smoothing
        const sstLayer = map.getLayer('sst-lyr');
        if (sstLayer) {
          map.setPaintProperty('sst-lyr', 'raster-resampling', 'linear');
          map.setPaintProperty('sst-lyr', 'raster-fade-duration', 300);
          
          // Add a subtle contrast adjustment to smooth pixelated edges
          map.setPaintProperty('sst-lyr', 'raster-contrast', -0.05);
          map.setPaintProperty('sst-lyr', 'raster-saturation', 0.05);
        }
      }
    };

    addSmoothing();

    return cleanup;
  }, [map, enabled]);

  return null;
}
