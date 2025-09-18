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

      // Add Chlorophyll raster source - Copernicus WMTS
      map.addSource('chl-src', {
        type: 'raster',
        tiles: [
          `/api/tiles/chl/{z}/{x}/{y}?date=${selectedDate}`
        ],
        tileSize: 256,
        attribution: '© Copernicus Marine Service',
        maxzoom: 12
      });

      // Add the layer with proper styling for GREEN chlorophyll
      map.addLayer({
        id: 'chl-lyr',
        type: 'raster',
        source: 'chl-src',
        paint: {
          'raster-opacity': 0.8,
          'raster-opacity-transition': { duration: 300 },
          'raster-saturation': 0.3,  // Slightly more saturated for vibrant greens
          'raster-contrast': 0.2,
          'raster-brightness-min': 0.05,
          'raster-brightness-max': 0.95
        }
      });

      // CRITICAL LAYER ORDERING - This is what other bots missed!
      // Order from bottom to top: ocean -> SST -> CHL -> land -> labels
      
      // First, find reference layers
      const layers = map.getStyle().layers;
      const landLayer = layers.find(layer => 
        layer.id.includes('land') || 
        layer.id.includes('landcover') ||
        layer.id === 'land'
      );
      
      // If SST layer exists, put CHL above it
      if (map.getLayer('sst-lyr')) {
        map.moveLayer('chl-lyr', 'sst-lyr');
      }
      // If ocean layer exists, ensure we're above it
      else if (map.getLayer('ocean-layer')) {
        map.moveLayer('chl-lyr', 'ocean-layer');
      }
      
      // But always stay below land if it exists
      if (landLayer) {
        map.moveLayer('chl-lyr', landLayer.id);
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
