'use client';

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface CHLEdgesLayerProps {
  map: mapboxgl.Map | null;
  enabled: boolean;
}

export default function CHLEdgesLayer({ map, enabled }: CHLEdgesLayerProps) {
  useEffect(() => {
    if (!map || !enabled) {
      // Remove layer if disabled
      if (map?.getLayer('chl-edges')) {
        map.removeLayer('chl-edges');
      }
      if (map?.getSource('chl-edges')) {
        map.removeSource('chl-edges');
      }
      return;
    }

    const addEdgesLayer = () => {
      if (!map.loaded()) {
        setTimeout(addEdgesLayer, 100);
        return;
      }

      // Remove existing if present
      if (map.getLayer('chl-edges')) {
        map.removeLayer('chl-edges');
      }
      if (map.getSource('chl-edges')) {
        map.removeSource('chl-edges');
      }

      // For now, let's create some sample edge lines
      // In production, this would analyze CHL tile data to find concentration breaks
      const mockEdges = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: { concentration_change: 'high' },
            geometry: {
              type: 'LineString' as const,
              coordinates: [
                [-75.5, 36.5],
                [-74.8, 36.8],
                [-74.2, 37.2],
                [-73.5, 37.8]
              ]
            }
          },
          {
            type: 'Feature' as const,
            properties: { concentration_change: 'medium' },
            geometry: {
              type: 'LineString' as const,
              coordinates: [
                [-76.0, 35.5],
                [-75.2, 35.8],
                [-74.5, 36.0],
                [-73.8, 36.3]
              ]
            }
          }
        ]
      };

      // Add source
      map.addSource('chl-edges', {
        type: 'geojson',
        data: mockEdges
      });

      // Add layer with green styling
      map.addLayer({
        id: 'chl-edges',
        type: 'line',
        source: 'chl-edges',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'concentration_change'], 'high'],
            '#10b981', // Bright green for strong edges
            '#22d3ee'  // Cyan for medium edges
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 2,
            10, 3,
            15, 4
          ],
          'line-opacity': 0.8,
          'line-blur': 1
        }
      });

      // Add a glow effect
      map.addLayer({
        id: 'chl-edges-glow',
        type: 'line',
        source: 'chl-edges',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#10b981',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 6,
            10, 10,
            15, 14
          ],
          'line-opacity': 0.2,
          'line-blur': 3
        }
      }, 'chl-edges'); // Place glow below main line

      console.log('CHL edges layer added');
    };

    addEdgesLayer();

    return () => {
      if (map && !map._removed) {
        if (map.getLayer('chl-edges')) map.removeLayer('chl-edges');
        if (map.getLayer('chl-edges-glow')) map.removeLayer('chl-edges-glow');
        if (map.getSource('chl-edges')) map.removeSource('chl-edges');
      }
    };
  }, [map, enabled]);

  return null;
}

// TODO: Future enhancement - actual edge detection algorithm
// This would:
// 1. Read CHL raster tile data
// 2. Apply edge detection (Sobel filter or similar)
// 3. Convert edges to vector contours
// 4. Generate GeoJSON lines where concentration changes rapidly
