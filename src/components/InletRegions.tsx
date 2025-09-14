'use client';

import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { regionsToGeoJSON } from '@/lib/inletRegions';

interface InletRegionsProps {
  map: mapboxgl.Map | null;
  enabled?: boolean;
  opacity?: number;
}

export default function InletRegions({ map, enabled = true, opacity = 0.08 }: InletRegionsProps) {
  const [regionsAdded, setRegionsAdded] = useState(false);

  useEffect(() => {
    if (!map) return;

    const setupRegions = () => {
      // Remove existing layers/sources if they exist
      if (map.getLayer('inlet-regions-fill')) {
        map.removeLayer('inlet-regions-fill');
      }
      if (map.getLayer('inlet-regions-border')) {
        map.removeLayer('inlet-regions-border');
      }
      if (map.getSource('inlet-regions')) {
        map.removeSource('inlet-regions');
      }

      if (!enabled) {
        setRegionsAdded(false);
        return;
      }

      // Add the inlet regions source
      const geoJSON = regionsToGeoJSON();
      
      map.addSource('inlet-regions', {
        type: 'geojson',
        data: geoJSON
      });

      // Add fill layer with inlet colors at low opacity
      map.addLayer({
        id: 'inlet-regions-fill',
        type: 'fill',
        source: 'inlet-regions',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': opacity
        }
      }, 'settlement-subdivision-label'); // Add below place labels

      // Add subtle border lines between regions
      map.addLayer({
        id: 'inlet-regions-border',
        type: 'line',
        source: 'inlet-regions',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1,
          'line-opacity': opacity * 2 // Slightly more visible than fill
        }
      }, 'settlement-subdivision-label');

      setRegionsAdded(true);
    };

    if (map.isStyleLoaded()) {
      setupRegions();
    } else {
      map.once('styledata', setupRegions);
    }

    // Cleanup
    return () => {
      if (map && !(map as any)._removed) {
        if (map.getLayer('inlet-regions-fill')) {
          map.removeLayer('inlet-regions-fill');
        }
        if (map.getLayer('inlet-regions-border')) {
          map.removeLayer('inlet-regions-border');
        }
        if (map.getSource('inlet-regions')) {
          map.removeSource('inlet-regions');
        }
      }
    };
  }, [map, enabled, opacity]);

  // Update opacity when it changes
  useEffect(() => {
    if (!map || !regionsAdded) return;

    if (map.getLayer('inlet-regions-fill')) {
      map.setPaintProperty('inlet-regions-fill', 'fill-opacity', opacity);
    }
    if (map.getLayer('inlet-regions-border')) {
      map.setPaintProperty('inlet-regions-border', 'line-opacity', opacity * 2);
    }
  }, [map, opacity, regionsAdded]);

  return null; // This component doesn't render anything visible
}
