'use client';

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface CHLLayerProps {
  map: mapboxgl.Map | null;
  on: boolean;
  selectedDate?: string;
}

export default function CHLLayer({ map, on, selectedDate = 'latest' }: CHLLayerProps) {
  
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
          `/api/tiles/chl/{z}/{x}/{y}?time=${selectedDate}`
        ],
        tileSize: 256,
        attribution: '© Copernicus Marine Service'
        // Removed maxzoom limit - let it work at all zoom levels like SST
      });

      // Add the layer with proper styling for GREEN chlorophyll
      map.addLayer({
        id: 'chl-lyr',
        type: 'raster',
        source: 'chl-src',
        paint: {
          'raster-opacity': 0.9,  // High visibility
          'raster-opacity-transition': { duration: 300 },
          'raster-saturation': 0.3,    // Some color boost
          'raster-contrast': 0.2,      // Slight contrast
          'raster-brightness-min': 0.1, // Compress range for better visibility
          'raster-brightness-max': 0.9,  // Compress range
          'raster-hue-rotate': 15      // Slight green tint
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
      
      // Debug: Check if tiles are loading
      map.on('data', (e: any) => {
        if (e.sourceId === 'chl-src' && e.isSourceLoaded) {
          console.log('CHL tiles loading...', e);
        }
      });
      
      // Debug: Check for tile errors
      map.on('error', (e: any) => {
        if (e.sourceId === 'chl-src') {
          console.error('CHL tile error:', e.error);
        }
      });
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
