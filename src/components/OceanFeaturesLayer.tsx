'use client';

import { useEffect, useState } from 'react';
import { useMapContext } from '@/lib/MapCtx';

interface OceanFeaturesProps {
  selectedDate: string;
  showFronts: boolean;
  showEdges: boolean;
  showEddies: boolean;
}

export default function OceanFeaturesLayer({ 
  selectedDate, 
  showFronts, 
  showEdges, 
  showEddies 
}: OceanFeaturesProps) {
  const { map } = useMapContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    const updateOceanFeatures = async () => {
      try {
        setLoading(true);
        setError(null);

        const bounds = map.getBounds();
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

        // Remove existing layers
        ['fronts-layer', 'edges-layer', 'eddies-layer'].forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        });

        ['fronts-source', 'edges-source', 'eddies-source'].forEach(sourceId => {
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        });

        // Add thermal fronts
        if (showFronts) {
          try {
            const frontsResponse = await fetch(
              `/api/ocean-features/fronts?bbox=${bbox}&date=${selectedDate}`
            );
            
            if (frontsResponse.ok) {
              const frontsData = await frontsResponse.json();
              
              map.addSource('fronts-source', {
                type: 'geojson',
                data: frontsData
              });

              map.addLayer({
                id: 'fronts-layer',
                type: 'line',
                source: 'fronts-source',
                paint: {
                  'line-color': '#ff6b6b',
                  'line-width': 2,
                  'line-opacity': 0.8
                },
                layout: {
                  'line-cap': 'round',
                  'line-join': 'round'
                }
              });
            }
          } catch (err) {
            console.warn('Failed to load thermal fronts:', err);
          }
        }

        // Add chlorophyll edges
        if (showEdges) {
          try {
            const edgesResponse = await fetch(
              `/api/ocean-features/edges?bbox=${bbox}&date=${selectedDate}`
            );
            
            if (edgesResponse.ok) {
              const edgesData = await edgesResponse.json();
              
              map.addSource('edges-source', {
                type: 'geojson',
                data: edgesData
              });

              map.addLayer({
                id: 'edges-layer',
                type: 'fill',
                source: 'edges-source',
                paint: {
                  'fill-color': '#4ecdc4',
                  'fill-opacity': 0.3,
                  'fill-outline-color': '#26a69a'
                }
              });
            }
          } catch (err) {
            console.warn('Failed to load chlorophyll edges:', err);
          }
        }

        // Add eddies
        if (showEddies) {
          try {
            const eddiesResponse = await fetch(
              `/api/ocean-features/eddies?bbox=${bbox}&date=${selectedDate}`
            );
            
            if (eddiesResponse.ok) {
              const eddiesData = await eddiesResponse.json();
              
              map.addSource('eddies-source', {
                type: 'geojson',
                data: eddiesData
              });

              // Add eddy fills with different colors for warm/cold core
              map.addLayer({
                id: 'eddies-layer',
                type: 'fill',
                source: 'eddies-source',
                paint: {
                  'fill-color': [
                    'case',
                    ['==', ['get', 'eddy_type'], 'warm_core'],
                    '#ff9800', // Orange for warm core
                    '#2196f3'  // Blue for cold core
                  ],
                  'fill-opacity': 0.4
                }
              });

              // Add eddy outlines
              map.addLayer({
                id: 'eddies-outline-layer',
                type: 'line',
                source: 'eddies-source',
                paint: {
                  'line-color': [
                    'case',
                    ['==', ['get', 'eddy_type'], 'warm_core'],
                    '#f57c00',
                    '#1976d2'
                  ],
                  'line-width': 2,
                  'line-opacity': 0.8
                }
              });
            }
          } catch (err) {
            console.warn('Failed to load eddies:', err);
          }
        }

      } catch (err) {
        console.error('Error updating ocean features:', err);
        setError('Failed to load ocean features');
      } finally {
        setLoading(false);
      }
    };

    updateOceanFeatures();

    // Add click handlers for feature popup
    const handleClick = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['fronts-layer', 'edges-layer', 'eddies-layer']
      });

      if (features.length > 0) {
        const feature = features[0];
        const props = feature.properties;

        let popupContent = '';
        
        if (props.feature_type === 'thermal_front') {
          popupContent = `
            <div class="p-3">
              <h3 class="font-bold text-red-600 mb-2">🌡️ Thermal Front</h3>
              <p><strong>Strength:</strong> ${props.strength?.toFixed(2)}°C/km</p>
              <p><strong>Type:</strong> Temperature gradient</p>
              <p class="text-sm text-gray-600 mt-2">Fish often aggregate along thermal fronts</p>
            </div>
          `;
        } else if (props.feature_type === 'chlorophyll_edge') {
          popupContent = `
            <div class="p-3">
              <h3 class="font-bold text-teal-600 mb-2">🌿 Productivity Edge</h3>
              <p><strong>Area:</strong> ${props.area_pixels} pixels</p>
              <p><strong>Type:</strong> Chlorophyll boundary</p>
              <p class="text-sm text-gray-600 mt-2">Marks transition between productive zones</p>
            </div>
          `;
        } else if (props.feature_type === 'eddy') {
          const color = props.eddy_type === 'warm_core' ? 'orange' : 'blue';
          popupContent = `
            <div class="p-3">
              <h3 class="font-bold text-${color}-600 mb-2">🌀 ${props.eddy_type.replace('_', ' ').toUpperCase()} Eddy</h3>
              <p><strong>Radius:</strong> ${props.radius_km?.toFixed(1)} km</p>
              <p><strong>SST Anomaly:</strong> ${props.sst_anomaly?.toFixed(1)}°C</p>
              <p><strong>Okubo-Weiss:</strong> ${props.okubo_weiss?.toFixed(3)}</p>
              <p class="text-sm text-gray-600 mt-2">Eddies concentrate nutrients and prey</p>
            </div>
          `;
        }

        new (window as any).mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(popupContent)
          .addTo(map);
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };

  }, [map, selectedDate, showFronts, showEdges, showEddies]);

  if (loading) {
    return (
      <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md rounded-lg p-2 text-white text-sm">
        🌊 Loading ocean features...
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute top-4 right-4 bg-red-500/20 backdrop-blur-md rounded-lg p-2 text-red-200 text-sm">
        ⚠️ {error}
      </div>
    );
  }

  return null;
}
