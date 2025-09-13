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

      // Convert selectedDate to proper format for API
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
      }

      // Use our proxy endpoint which handles auth and fallback
      const url = `/api/tiles/sst/{z}/{x}/{y}.png${dateParam}`;
      
      console.log('🌡️ SST Layer updating with date:', selectedDate, 'URL pattern:', url);

      try {
        if (map.getLayer(lyrId)) map.removeLayer(lyrId);
        if (map.getSource(srcId)) (map as any).removeSource(srcId);

        (map as any).addSource(srcId, { type: 'raster', tiles: [url], tileSize } as any);
        map.addLayer({
          id: lyrId,
          type: 'raster',
          source: srcId,
          layout: { visibility: 'visible' },
          paint: { 
            'raster-opacity': 1, 
            'raster-resampling': 'linear',
            'raster-fade-duration': 300,
            'raster-contrast': -0.02,  // Subtle contrast reduction to smooth edges
            'raster-saturation': 0.02   // Slight saturation boost for clarity
          },
        } as any);

        const style = map.getStyle();
        if (style && style.layers) {
          const top = style.layers[style.layers.length - 1]?.id;
          if (top && top !== lyrId) map.moveLayer(lyrId, top);
        }
      } catch (error) {
        console.warn('SST Layer update error (non-critical):', error);
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