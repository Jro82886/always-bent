'use client';

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface CHLLayerProps {
  map: mapboxgl.Map | null;
  on: boolean;
  selectedDate?: string;
}

export default function CHLLayer({ map, on, selectedDate = 'latest' }: CHLLayerProps) {
  console.log('CHLLayer render - on:', on, 'map:', !!map, 'selectedDate:', selectedDate);
  
  useEffect(() => {
    if (!map) return;

    const addCHLLayer = () => {
      console.log('addCHLLayer called - on:', on, 'map.loaded:', map.loaded());
      
      // Wait for map to be ready (like SST does)
      if (!map.loaded() || !map.getStyle()) {
        console.log('Map not ready, retrying...');
        setTimeout(addCHLLayer, 100);
        return;
      }

      // Remove existing layer if present
      if (map.getLayer('chl-lyr')) {
        console.log('Removing existing CHL layer');
        map.removeLayer('chl-lyr');
      }
      if (map.getSource('chl-src')) {
        console.log('Removing existing CHL source');
        map.removeSource('chl-src');
      }

      if (!on) {
        console.log('CHL toggled OFF, not adding layer');
        return;
      }

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

      // CRITICAL LAYER ORDERING - CHL needs to be visible!
      // The issue was CHL was at the BOTTOM (position 0)
      
      // First, find key reference layers
      const layers = map.getStyle().layers;
      const landLayer = layers.find(layer => 
        layer.id.includes('land') || 
        layer.id.includes('landcover') ||
        layer.id === 'land'
      );
      
      // Find the water layer (usually near bottom)
      const waterLayer = layers.find(layer =>
        layer.id.includes('water') ||
        layer.id === 'water'
      );
      
      // Position CHL properly:
      // If SST exists, put CHL right above it
      if (map.getLayer('sst-lyr')) {
        const sstIndex = layers.findIndex(l => l.id === 'sst-lyr');
        const afterSST = layers[sstIndex + 1];
        if (afterSST) {
          map.moveLayer('chl-lyr', afterSST.id);
        }
      }
      // Otherwise, put it above water but below land
      else if (waterLayer) {
        // Find the layer right after water
        const waterIndex = layers.findIndex(l => l.id === waterLayer.id);
        const afterWater = layers[waterIndex + 1];
        if (afterWater) {
          map.moveLayer('chl-lyr', afterWater.id);
        }
      }
      // As a fallback, just make sure we're not at the very bottom
      else {
        // Move above the first layer (position 0)
        if (layers.length > 1) {
          map.moveLayer('chl-lyr', layers[1].id);
        }
      }

      console.log('✅ CHL layer added successfully with proper ordering');
      console.log('Layer exists:', !!map.getLayer('chl-lyr'));
      console.log('Source exists:', !!map.getSource('chl-src'));
      
      // Debug: Check if tiles are loading (use once to avoid multiple listeners)
      const handleData = (e: any) => {
        if (e.sourceId === 'chl-src' && e.isSourceLoaded) {
          console.log('CHL tiles loading...', e);
        }
      };
      
      // Debug: Check for tile errors
      const handleError = (e: any) => {
        if (e.sourceId === 'chl-src') {
          console.error('CHL tile error:', e.error);
        }
      };
      
      // Remove old listeners first
      map.off('data', handleData);
      map.off('error', handleError);
      
      // Add new listeners
      map.on('data', handleData);
      map.on('error', handleError);
    };

    // Start the process
    addCHLLayer();

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
