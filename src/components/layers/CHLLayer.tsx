'use client';

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface CHLLayerProps {
  map: mapboxgl.Map | null;
  on: boolean;
  selectedDate?: string;
}

export default function CHLLayer({ map, on, selectedDate = 'today' }: CHLLayerProps) {
  
  useEffect(() => {
    if (!map) return;

    const addCHLLayer = () => {
      // Remove existing layer if present
      if (map.getLayer('chl-lyr')) {
        map.removeLayer('chl-lyr');
      }
      if (map.getSource('chl-src')) {
        map.removeSource('chl-src');
      }

      if (!on) return;

      // Add Chlorophyll raster source
      map.addSource('chl-src', {
        type: 'raster',
        tiles: [
          `/api/tiles/chl/{z}/{x}/{y}?date=${selectedDate}`
        ],
        tileSize: 256,
        attribution: 'NASA OceanColor',
        maxzoom: 12
      });

      // Add the layer with proper styling
      map.addLayer({
        id: 'chl-lyr',
        type: 'raster',
        source: 'chl-src',
        paint: {
          'raster-opacity': 0.7,
          'raster-opacity-transition': { duration: 300 },
          'raster-saturation': 0.2,
          'raster-contrast': 0.1
        }
      });

      // Ensure CHL is above ocean and SST layers
      const layers = map.getStyle().layers;
      const firstSymbolLayer = layers.find(layer => layer.type === 'symbol');
      if (firstSymbolLayer) {
        // Move CHL just below the first symbol layer (so it's visible but below labels)
        map.moveLayer('chl-lyr', firstSymbolLayer.id);
      }

      console.log('CHL layer added successfully with proper ordering');
    };

    // Wait for map to be loaded
    if (map.loaded()) {
      addCHLLayer();
    } else {
      map.once('load', addCHLLayer);
    }

    // Cleanup
    return () => {
      if (map && !map._removed) {
        if (map.getLayer('chl-lyr')) {
          map.removeLayer('chl-lyr');
        }
        if (map.getSource('chl-src')) {
          map.removeSource('chl-src');
        }
      }
    };
  }, [map, on, selectedDate]);

  return null;
}
