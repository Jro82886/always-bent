'use client';

import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface CHLLayerProps {
  map: mapboxgl.Map | null;
  on: boolean;
  selectedDate?: string;
}

export default function CHLLayer({ map, on, selectedDate = 'today' }: CHLLayerProps) {
  // Removed viridis test - now using production viridis via environment variable
  
  useEffect(() => {
    if (!map) return;

    const addCHLLayer = () => {
      // Wait for map to be ready (like SST does)
      if (!map.loaded() || !map.getStyle()) {
        setTimeout(addCHLLayer, 100);
        return;
      }

      // Remove existing layer if present
      if (map.getLayer('chl-lyr')) {
        map.removeLayer('chl-lyr');
      }
      if (map.getSource('chl-src')) {
        map.removeSource('chl-src');
      }

      if (!on) return;

      // Convert selectedDate to proper format for API (same as SST)
      let dateParam = '';
      if (selectedDate === 'today') {
        dateParam = '?time=latest'; // API will use yesterday (most recent available)
      } else if (selectedDate === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dateParam = `?time=${yesterday.toISOString().split('T')[0]}`;
      } else if (selectedDate === '2days') {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        dateParam = `?time=${twoDaysAgo.toISOString().split('T')[0]}`;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        // Already in YYYY-MM-DD format
        dateParam = `?time=${selectedDate}`;
      } else {
        // Default to latest if unknown format
        dateParam = '?time=latest';
      }

      // Add Chlorophyll raster source - Copernicus WMTS
      map.addSource('chl-src', {
        type: 'raster',
        tiles: [
          `/api/tiles/chl/{z}/{x}/{y}${dateParam}`
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
          'raster-opacity': 0.95,
          'raster-opacity-transition': { duration: 0 },
          'raster-resampling': 'linear'
        }
      });

      // Enforce linear (smooth) rendering at runtime
      try {
        map.setPaintProperty('chl-lyr', 'raster-resampling', 'linear');
        const canvas = map.getCanvas?.();
        if (canvas) (canvas as any).style.imageRendering = 'auto';
        if (process.env.NODE_ENV !== 'production') {
          const chl = map.getPaintProperty('chl-lyr', 'raster-resampling');
          if (chl !== 'linear') {
            // eslint-disable-next-line no-console
            console.warn('Smooth rendering OFF: CHL raster-resampling is not linear');
          }
        }
      } catch {}

      // CRITICAL LAYER ORDERING:
      // - Above water/ocean fills
      // - BELOW land/coastline layers (so barrier islands show through)
      // - Below labels and symbols
      const layers = map.getStyle().layers;

      // Find the first land-related layer to position CHL below it
      // Mapbox uses layers like "land", "landcover", "landuse" for land features
      const landLayer = layers.find(layer =>
        layer.id === 'land' ||
        layer.id === 'landcover' ||
        layer.id.includes('landcover') ||
        layer.id.includes('landuse') ||
        (layer.type === 'fill' && layer.id.includes('land'))
      );

      if (landLayer) {
        // Position CHL just before the land layer (so land renders on top)
        map.moveLayer('chl-lyr', landLayer.id);
        console.log(`[CHL] Positioned below land layer: ${landLayer.id}`);
      } else {
        // Fallback: position before labels
        const firstLabelLayer = layers.find(layer =>
          layer.type === 'symbol' ||
          layer.id.includes('label')
        );
        if (firstLabelLayer) {
          map.moveLayer('chl-lyr', firstLabelLayer.id);
          console.log(`[CHL] Positioned below labels: ${firstLabelLayer.id}`);
        }
      }

      // Log final position for debugging
      const newLayers = map.getStyle().layers;
      const finalIndex = newLayers.findIndex(l => l.id === 'chl-lyr');
      const landIndex = newLayers.findIndex(l => l.id === 'land' || l.id === 'landcover');
      console.log(`[CHL] Final position: ${finalIndex}, Land position: ${landIndex}`);

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

  // Separate effect to handle date changes when layer is already on
  useEffect(() => {
    if (!map || !on) return;
    
    const source = map.getSource('chl-src');
    const layer = map.getLayer('chl-lyr');
    
    if (source && layer) {
      console.log('[CHL] Date changed to:', selectedDate);
      
      // Calculate date parameter
      let dateParam = '';
      if (selectedDate === 'today') {
        dateParam = '?time=latest';
      } else if (selectedDate === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dateParam = `?time=${yesterday.toISOString().split('T')[0]}`;
      } else if (selectedDate === '2days') {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        dateParam = `?time=${twoDaysAgo.toISOString().split('T')[0]}`;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        dateParam = `?time=${selectedDate}`;
      } else {
        dateParam = '?time=latest';
      }
      
      // Update tiles and force refresh
      const newTiles = [`/api/tiles/chl/{z}/{x}/{y}${dateParam}`];
      (source as any).tiles = newTiles;
      
      // Clear tile cache and reload
      if ((map.style as any)._sourceCaches && (map.style as any)._sourceCaches['chl-src']) {
        (map.style as any)._sourceCaches['chl-src'].clearTiles();
        (map.style as any)._sourceCaches['chl-src'].reload();
      }
      
      // Force a re-render
      map.triggerRepaint();
      
      console.log('[CHL] Tiles refreshed for date:', dateParam);
    }
  }, [selectedDate]);

  return null;
}
