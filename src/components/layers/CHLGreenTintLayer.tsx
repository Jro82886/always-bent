import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface CHLGreenTintLayerProps {
  map: mapboxgl.Map;
  enabled: boolean;
  intensity: number; // 0-100
}

export default function CHLGreenTintLayer({ map, enabled, intensity }: CHLGreenTintLayerProps) {
  useEffect(() => {
    if (!map || !map.getSource('chl-src')) return;

    const layerId = 'chl-green-tint';
    
    // Remove layer if disabled
    if (!enabled || intensity === 0) {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      return;
    }

    // Add layer if it doesn't exist
    if (!map.getLayer(layerId)) {
      // Find the position to insert (above base CHL layer)
      let beforeLayer: string | undefined;
      const layers = map.getStyle().layers;
      const chlIndex = layers.findIndex(l => l.id === 'chl-lyr');
      
      if (chlIndex !== -1 && chlIndex < layers.length - 1) {
        // Insert right after the base CHL layer
        beforeLayer = layers[chlIndex + 1].id;
      }

      map.addLayer({
        id: layerId,
        type: 'raster',
        source: 'chl-src', // Use same source as base CHL
        paint: {
          'raster-color': ['rgba', 0, 255, 0, 0], // Placeholder, will be set below
          'raster-color-mix': [0, 0, 0, 1],
          'raster-opacity': 0.0
        }
      }, beforeLayer);
    }

    // Update the green tint based on intensity
    const s = intensity / 100; // Normalize slider value
    const gain = 0.6 * s; // Overall strength cap
    const minLog = -2.3; // ~0.005 mg/m³
    const maxLog = 0.3;  // ~2 mg/m³

    // Set the raster-color expression for value-weighted green tint
    map.setPaintProperty(layerId, 'raster-color', [
      'let', 'v',
      ['clamp',
        ['/', ['-', ['ln', ['max', 1e-6, ['to-number', ['raster-value']]]], minLog], maxLog - minLog],
        0, 1
      ],
      // RGB = green; alpha scales with value * gain
      ['rgba', 0, ['round', ['*', 255, ['*', ['var', 'v'], gain]]], 0, ['*', 0.45, s]]
    ]);

    // Set overall opacity
    map.setPaintProperty(layerId, 'raster-opacity', 0.05 + (0.55 * s));

  }, [map, enabled, intensity]);

  return null;
}
