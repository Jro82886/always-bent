"use client";
import { useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import { dailyAtMidnightUTCISO } from '@/lib/imagery/time';
import { buildWMTS } from '@/lib/imagery/url';

type Props = { map: mapboxgl.Map; on: boolean; selectedDate?: string };

export default function SSTLayer({ map, on, selectedDate = 'today' }: Props) {
  useEffect(() => {
    // Defensive check - map should always exist since parent checks it
    if (!map) return;
    
    // Wait for map to be ready
    const setupLayer = () => {
      try {
        if (!map.loaded() || !map.getStyle()) {
          // Try again in a moment
          setTimeout(setupLayer, 100);
          return;
        }
      } catch (e) {
        // Map is gone, stop trying
        return;
      }

      const srcId = 'sst-src';
      const lyrId = 'sst-lyr';
      const tileSize = 512; // High-res tiles

      if (!on) {
        try {
          if (map.getLayer(lyrId)) map.removeLayer(lyrId);
          if (map.getSource(srcId)) (map as any).removeSource(srcId);
        } catch (e) {
          // Ignore errors during cleanup
        }
        return;
      }

      // Use EXACTLY the same approach as CHL (which works!)
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
      
      // Use proxy endpoint EXACTLY like CHL
      const url = `/api/tiles/sst/{z}/{x}/{y}${dateParam}`;
      
      

      try {
        if (map.getLayer(lyrId)) map.removeLayer(lyrId);
        if (map.getSource(srcId)) (map as any).removeSource(srcId);

        map.addSource(srcId, { 
          type: 'raster', 
          tiles: [url], 
          tileSize: 256,  // Match CHL
          attribution: '© Copernicus Marine Service'
        });
        map.addLayer({
          id: lyrId,
          type: 'raster',
          source: srcId,
          layout: { visibility: 'visible' },
          paint: {
            'raster-opacity': 0.95,
            'raster-opacity-transition': { duration: 0 },
            'raster-resampling': 'linear'
          },
        } as any);

        // Position SST layer correctly in the stack:
        // - Above water/ocean fills
        // - BELOW land/coastline layers (so barrier islands show through)
        // - Below labels and symbols
        const style = map.getStyle();
        if (style && style.layers) {
          // Find the first land-related layer to position SST below it
          // Mapbox uses layers like "land", "landcover", "landuse" for land features
          const landLayer = style.layers.find(layer =>
            layer.id === 'land' ||
            layer.id === 'landcover' ||
            layer.id.includes('landcover') ||
            layer.id.includes('landuse') ||
            (layer.type === 'fill' && layer.id.includes('land'))
          );

          if (landLayer) {
            // Position SST just before the land layer (so land renders on top)
            map.moveLayer(lyrId, landLayer.id);
            console.log(`[SST] Positioned below land layer: ${landLayer.id}`);
          } else {
            // Fallback: position before labels (like CHL does)
            const labelLayer = style.layers.find(layer =>
              layer.type === 'symbol' || layer.id.includes('label')
            );
            if (labelLayer) {
              map.moveLayer(lyrId, labelLayer.id);
              console.log(`[SST] Positioned below labels: ${labelLayer.id}`);
            }
          }
        }

        // Enforce linear (smooth) rendering at runtime
        try {
          map.setPaintProperty(lyrId, 'raster-resampling', 'linear');
          const canvas = map.getCanvas?.();
          if (canvas) (canvas as any).style.imageRendering = 'auto';
          if (process.env.NODE_ENV !== 'production') {
            const sst = map.getPaintProperty(lyrId, 'raster-resampling');
            if (sst !== 'linear') {
              // eslint-disable-next-line no-console
              console.warn('Smooth rendering OFF: SST raster-resampling is not linear');
            }
          }
        } catch {}
      } catch (error) {
        // Layer update error handled
      }
    };
    
    setupLayer();
    
    // No cleanup - the map removal in legendary page handles everything
    return () => {
      // Do nothing - map.remove() handles all layer cleanup
    };
  }, [map, on, selectedDate]);

  return null;
}