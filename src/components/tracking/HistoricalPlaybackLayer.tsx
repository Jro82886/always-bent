'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { usePlaybackStore } from '@/lib/tracking/playbackStore';
import { getInletColor } from '@/lib/style/fleetColors';

interface HistoricalPlaybackLayerProps {
  map: mapboxgl.Map | null;
}

export default function HistoricalPlaybackLayer({ map }: HistoricalPlaybackLayerProps) {
  const vessels = usePlaybackStore(s => s.vessels);
  const selectedVesselIds = usePlaybackStore(s => s.selectedVesselIds);
  const currentTime = usePlaybackStore(s => s.currentTime);
  const getCurrentPositions = usePlaybackStore(s => s.getCurrentPositions);

  const sourcesAdded = useRef(false);

  // Initialize sources and layers
  useEffect(() => {
    if (!map || sourcesAdded.current) return;

    const setupSources = () => {
      // Historical tracks source (full trails)
      if (!map.getSource('historical-tracks-source')) {
        map.addSource('historical-tracks-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      // Historical positions source (current playback positions)
      if (!map.getSource('historical-positions-source')) {
        map.addSource('historical-positions-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      // Add track lines layer
      if (!map.getLayer('historical-tracks-line')) {
        map.addLayer({
          id: 'historical-tracks-line',
          type: 'line',
          source: 'historical-tracks-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2.5,
            'line-opacity': 0.6
          }
        });
      }

      // Add vessel position dots layer
      if (!map.getLayer('historical-positions-dots')) {
        map.addLayer({
          id: 'historical-positions-dots',
          type: 'circle',
          source: 'historical-positions-source',
          paint: {
            'circle-radius': 8,
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.9,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.8
          }
        });
      }

      sourcesAdded.current = true;
    };

    if (map.isStyleLoaded()) {
      setupSources();
    } else {
      map.once('style.load', setupSources);
    }

    return () => {
      if (map && typeof map.getLayer === 'function') {
        try {
          if (map.getLayer('historical-positions-dots')) map.removeLayer('historical-positions-dots');
          if (map.getLayer('historical-tracks-line')) map.removeLayer('historical-tracks-line');
        } catch (e) {
          console.warn('HistoricalPlaybackLayer cleanup error (layers):', e);
        }
      }

      if (map && typeof map.getSource === 'function') {
        try {
          if (map.getSource('historical-positions-source')) map.removeSource('historical-positions-source');
          if (map.getSource('historical-tracks-source')) map.removeSource('historical-tracks-source');
        } catch (e) {
          console.warn('HistoricalPlaybackLayer cleanup error (sources):', e);
        }
      }

      sourcesAdded.current = false;
    };
  }, [map]);

  // Update track lines when vessels or selection changes
  useEffect(() => {
    if (!map || !sourcesAdded.current) return;

    try {
      const source = map.getSource('historical-tracks-source') as mapboxgl.GeoJSONSource;
      if (!source) return;

      // Filter to selected vessels only
      const selectedVessels = vessels.filter(v => selectedVesselIds.includes(v.vessel_id));

      if (selectedVessels.length > 0) {
        const features = selectedVessels.map(vessel => ({
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: vessel.positions.map(p => [p.lon, p.lat])
          },
          properties: {
            vessel_id: vessel.vessel_id,
            inlet_id: vessel.inlet_id || '',
            color: getInletColor(vessel.inlet_id || '')
          }
        }));

        source.setData({
          type: 'FeatureCollection',
          features
        });

        if (map.getLayer('historical-tracks-line')) {
          map.setLayoutProperty('historical-tracks-line', 'visibility', 'visible');
        }
      } else {
        // Hide layer when no vessels selected
        if (map.getLayer('historical-tracks-line')) {
          map.setLayoutProperty('historical-tracks-line', 'visibility', 'none');
        }
      }
    } catch (e) {
      console.warn('HistoricalPlaybackLayer update tracks error:', e);
    }
  }, [map, vessels, selectedVesselIds]);

  // Update vessel positions based on current playback time
  useEffect(() => {
    if (!map || !sourcesAdded.current || !currentTime) return;

    try {
      const source = map.getSource('historical-positions-source') as mapboxgl.GeoJSONSource;
      if (!source) return;

      const currentPositions = getCurrentPositions();

      if (currentPositions.size > 0) {
        const features = Array.from(currentPositions.entries()).map(([vesselId, position]) => {
          const vessel = vessels.find(v => v.vessel_id === vesselId);

          return {
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [position.lon, position.lat]
            },
            properties: {
              vessel_id: vesselId,
              inlet_id: vessel?.inlet_id || '',
              color: getInletColor(vessel?.inlet_id || ''),
              timestamp: position.timestamp
            }
          };
        });

        source.setData({
          type: 'FeatureCollection',
          features
        });

        if (map.getLayer('historical-positions-dots')) {
          map.setLayoutProperty('historical-positions-dots', 'visibility', 'visible');
        }
      } else {
        // Hide layer when no positions
        if (map.getLayer('historical-positions-dots')) {
          map.setLayoutProperty('historical-positions-dots', 'visibility', 'none');
        }
      }
    } catch (e) {
      console.warn('HistoricalPlaybackLayer update positions error:', e);
    }
  }, [map, currentTime, getCurrentPositions, vessels, selectedVesselIds]);

  return null;
}
