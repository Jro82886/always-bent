'use client';

import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { INLETS } from '@/lib/inlets';

interface InletRegionsProps {
  map: mapboxgl.Map | null;
  enabled?: boolean;
  opacity?: number;
}

export default function InletRegions({ map, enabled = true, opacity = 0.25 }: InletRegionsProps) {
  const [regionsAdded, setRegionsAdded] = useState(false);

  useEffect(() => {
    if (!map) return;

    const setupRegions = () => {
      try {
        // Remove existing layers/sources if they exist
        if (map.getLayer('inlet-regions-glow')) {
          map.removeLayer('inlet-regions-glow');
        }
        if (map.getLayer('inlet-regions-core')) {
          map.removeLayer('inlet-regions-core');
        }
        if (map.getSource('inlet-points')) {
          map.removeSource('inlet-points');
        }

        if (!enabled) {
          setRegionsAdded(false);
          return;
        }

        // Create point features for each inlet
        const features = INLETS.map(inlet => ({
          type: 'Feature' as const,
          properties: {
            color: inlet.color || '#00ffff',
            name: inlet.name
          },
          geometry: {
            type: 'Point' as const,
            coordinates: inlet.center
          }
        }));

        // Add the inlet points source
        map.addSource('inlet-points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features
          }
        });

        // Find a valid layer to insert before
        const layers = map.getStyle()?.layers || [];
        let beforeId = 'settlement-subdivision-label';
        if (!map.getLayer(beforeId)) {
          // Find first symbol layer as fallback
          const symbolLayer = layers.find(layer => layer.type === 'symbol');
          beforeId = symbolLayer?.id || undefined;
        }

        // Add large blurred circles for the gradient effect
        map.addLayer({
          id: 'inlet-regions-glow',
          type: 'circle',
          source: 'inlet-points',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3, 30,
              5, 50,
              7, 80,
              9, 120,
              11, 160,
              13, 200
            ],
            'circle-color': ['get', 'color'],
            'circle-opacity': opacity * 0.3,
            'circle-blur': 1 // Maximum blur for soft edges
          }
        }, beforeId);

        // Add medium circles with less blur
        map.addLayer({
          id: 'inlet-regions-core',
          type: 'circle',
          source: 'inlet-points',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3, 15,
              5, 25,
              7, 40,
              9, 60,
              11, 80,
              13, 100
            ],
            'circle-color': ['get', 'color'],
            'circle-opacity': opacity * 0.5,
            'circle-blur': 0.8
          }
        }, 'inlet-regions-glow');

        setRegionsAdded(true);
      } catch (error) {
        console.error('[InletRegions] Failed to setup regions:', error);
        // Don't throw - just log the error and continue
      }
    };

    if (map.isStyleLoaded()) {
      setupRegions();
    } else {
      map.once('styledata', setupRegions);
    }

    // Cleanup
    return () => {
      if (map && !(map as any)._removed) {
        if (map.getLayer('inlet-regions-glow')) {
          map.removeLayer('inlet-regions-glow');
        }
        if (map.getLayer('inlet-regions-core')) {
          map.removeLayer('inlet-regions-core');
        }
        if (map.getSource('inlet-points')) {
          map.removeSource('inlet-points');
        }
      }
    };
  }, [map, enabled, opacity]);

  // Update opacity when it changes
  useEffect(() => {
    if (!map || !regionsAdded) return;

    if (map.getLayer('inlet-regions-glow')) {
      map.setPaintProperty('inlet-regions-glow', 'circle-opacity', opacity * 0.3);
    }
    if (map.getLayer('inlet-regions-core')) {
      map.setPaintProperty('inlet-regions-core', 'circle-opacity', opacity * 0.5);
    }
  }, [map, opacity, regionsAdded]);

  return null;
}