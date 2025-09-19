"use client";

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface CHLHighlightLayerProps {
  map: mapboxgl.Map | null;
  enabled: boolean;
  intensity: number; // 0-100 from slider
}

export default function CHLHighlightLayer({ map, enabled, intensity }: CHLHighlightLayerProps) {
  useEffect(() => {
    if (!map) return;

    const addHighlightLayer = () => {
      // Check if CHL source exists
      if (!map.getSource('chl-src')) {
        console.warn('[CHL-HIGHLIGHT] CHL source not found, waiting...');
        return;
      }

      // Remove existing highlight layer if present
      if (map.getLayer('chl-highlight')) {
        map.removeLayer('chl-highlight');
      }

      if (!enabled || intensity === 0) {
        return;
      }

      // Map slider (0-100) to chlorophyll concentration range
      // Slider 0 = 0.05 mg/m³, Slider 100 = 1.6 mg/m³ (in log space)
      const logCenter = -1.3 + (intensity / 100) * 1.5; // -1.3 to 0.2 in log10
      const halfWidth = 0.25 - 0.15 * (intensity / 100); // Band narrows at higher values
      
      // Band edges in log10 space
      const logLo = logCenter - halfWidth;
      const logHi = logCenter + halfWidth;
      
      // Convert back to linear for display (for debugging)
      const linearLo = Math.pow(10, logLo);
      const linearHi = Math.pow(10, logHi);
      console.log(`[CHL-HIGHLIGHT] Band: ${linearLo.toFixed(3)} - ${linearHi.toFixed(3)} mg/m³`);

      try {
        // Add highlight layer using Mapbox v3 raster expressions
        map.addLayer({
          id: 'chl-highlight',
          type: 'raster',
          source: 'chl-src', // Same source as base CHL
          paint: {
            // Use raster-resampling for crisp edges
            'raster-resampling': 'nearest',
            
            // Main opacity control
            'raster-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3, 0.4,
              7, 0.6,
              10, 0.7
            ],
            
            // Apply green tint and boost to mid-range values
            'raster-hue-rotate': 120, // Shift to green
            'raster-saturation': 1.5, // Boost color
            
            // Use contrast to create the band-pass effect
            // This creates a "highlight" effect for mid-range values
            'raster-contrast': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3, 0.8,
              7, 1.2,
              10, 1.5
            ],
            
            // Adjust brightness to emphasize the band
            'raster-brightness-min': 0.3 + (intensity / 200),
            'raster-brightness-max': 0.7 - (intensity / 200)
          }
        }, 'chl-lyr'); // Place above base CHL layer

        console.log('[CHL-HIGHLIGHT] Highlight layer added successfully');
      } catch (error) {
        console.error('[CHL-HIGHLIGHT] Error adding highlight layer:', error);
      }
    };

    // Add layer when map is ready
    if (map.loaded()) {
      addHighlightLayer();
    } else {
      map.once('load', addHighlightLayer);
    }

    // Update when intensity changes
    const updateHighlight = () => {
      if (map.getLayer('chl-highlight') && enabled && intensity > 0) {
        // Update brightness based on intensity
        map.setPaintProperty('chl-highlight', 'raster-brightness-min', 0.3 + (intensity / 200));
        map.setPaintProperty('chl-highlight', 'raster-brightness-max', 0.7 - (intensity / 200));
      }
    };

    // Listen for style changes
    map.on('style.load', addHighlightLayer);

    return () => {
      if (map.getLayer('chl-highlight')) {
        map.removeLayer('chl-highlight');
      }
      map.off('style.load', addHighlightLayer);
    };
  }, [map, enabled, intensity]);

  return null;
}
