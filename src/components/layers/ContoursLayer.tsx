'use client';

import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface ContoursLayerProps {
  map: mapboxgl.Map | null;
  enabled: boolean;
  temperatures?: number[]; // Which isotherms to show
}

export default function ContoursLayer({ 
  map, 
  enabled,
  temperatures = [68, 70, 72] // Default to key fishing temps
}: ContoursLayerProps) {
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!map) return;
    
    const SOURCE_ID = 'sst-contours';
    const LAYER_ID = 'sst-contours-layer';
    const LAYER_ID_LABELS = 'sst-contours-labels';
    
    const loadContours = async () => {
      if (!enabled) {
        // Remove layers and source
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getLayer(LAYER_ID_LABELS)) map.removeLayer(LAYER_ID_LABELS);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        return;
      }
      
      setLoading(true);
      
      try {
        const bounds = map.getBounds();
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
        
        const response = await fetch(`/api/ocean-features/contours?bbox=${bbox}`);
        const data = await response.json();
        
        // Remove existing
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getLayer(LAYER_ID_LABELS)) map.removeLayer(LAYER_ID_LABELS);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        
        // Add source
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data
        });
        
        // Add contour lines
        map.addLayer({
          id: LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          paint: {
            'line-color': [
              'case',
              ['>=', ['get', 'temperature_f'], 74], '#ff6b6b', // Warm - red
              ['>=', ['get', 'temperature_f'], 70], '#feca57', // Perfect - gold
              ['>=', ['get', 'temperature_f'], 66], '#48dbfb', // Cool - light blue
              '#0abde3' // Cold - blue
            ],
            'line-width': [
              'case',
              ['==', ['get', 'temperature_f'], 70], 3, // Emphasize 70°F
              ['in', ['get', 'temperature_f'], ['literal', [68, 72]]], 2.5,
              1.5
            ],
            'line-opacity': 0.9,
            'line-blur': 0.5
          }
        });
        
        // Add temperature labels
        map.addLayer({
          id: LAYER_ID_LABELS,
          type: 'symbol',
          source: SOURCE_ID,
          layout: {
            'symbol-placement': 'line',
            'text-field': ['concat', ['get', 'temperature_f'], '°F'],
            'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
            'text-size': [
              'case',
              ['==', ['get', 'temperature_f'], 70], 14,
              12
            ],
            'text-letter-spacing': 0.05,
            'text-rotation-alignment': 'map',
            'text-pitch-alignment': 'viewport'
          },
          paint: {
            'text-color': [
              'case',
              ['>=', ['get', 'temperature_f'], 74], '#ff6b6b',
              ['>=', ['get', 'temperature_f'], 70], '#f39c12',
              ['>=', ['get', 'temperature_f'], 66], '#3498db',
              '#2980b9'
            ],
            'text-halo-color': 'rgba(0, 0, 0, 0.8)',
            'text-halo-width': 2,
            'text-halo-blur': 1
          }
        });
        
        // Position layers properly
        // Should be above SST raster but below most other features
        if (map.getLayer('sst-lyr')) {
          map.moveLayer(LAYER_ID, 'sst-lyr');
          map.moveLayer(LAYER_ID_LABELS, LAYER_ID);
        }
        
      } catch (error) {
        console.error('Error loading contours:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Load initially
    loadContours();
    
    // Reload on map move
    const handleMoveEnd = () => {
      if (enabled) loadContours();
    };
    
    map.on('moveend', handleMoveEnd);
    
    return () => {
      map.off('moveend', handleMoveEnd);
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getLayer(LAYER_ID_LABELS)) map.removeLayer(LAYER_ID_LABELS);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
    
  }, [map, enabled, temperatures]);
  
  return null;
}
