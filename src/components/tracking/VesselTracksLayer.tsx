'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useAppState } from '@/lib/store';
import { USER_VESSEL } from '@/config/vessel-style';
import { getInletColor } from '@/lib/style/fleetColors';

interface VesselTracksLayerProps {
  map: mapboxgl.Map | null;
  fleetTracks?: Array<{
    vessel_id: string;
    inlet_id: string;
    track: Array<[number, number]>;
  }>;
  gfwTracks?: Array<{
    id: string;
    gear_type: string;
    track: Array<[number, number]>;
  }>;
}

const GEAR_TYPE_COLORS: Record<string, string> = {
  'longliner': '#FF4444',
  'drifting_longlines': '#00CED1',
  'trawler': '#4169E1',
  'default': '#888888'
};

export default function VesselTracksLayer({ 
  map, 
  fleetTracks = [], 
  gfwTracks = [] 
}: VesselTracksLayerProps) {
  const myTracksEnabled = useAppState(s => s.myTracksEnabled);
  const myTrackCoords = useAppState(s => s.myTrackCoords);
  const fleetTracksEnabled = useAppState(s => s.fleetTracksEnabled);
  const gfwTracksEnabled = useAppState(s => s.gfwTracksEnabled);
  
  const sourcesAdded = useRef(false);

  // Initialize sources and layers
  useEffect(() => {
    if (!map || sourcesAdded.current) return;

    const setupSources = () => {
      // Check if sources already exist to prevent duplicate errors
      if (!map.getSource('user-track-source')) {
        map.addSource('user-track-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      if (!map.getSource('fleet-tracks-source')) {
        map.addSource('fleet-tracks-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      if (!map.getSource('gfw-tracks-source')) {
        map.addSource('gfw-tracks-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      // Add layers with standardized IDs (check if they exist first)
      // User track line (emerald with glow)
      if (!map.getLayer('user-track-line')) {
        map.addLayer({
          id: 'user-track-line',
          type: 'line',
          source: 'user-track-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#00E1A7', // emerald
            'line-width': 2.25,
            'line-opacity': 0.85,
            'line-blur': 0.5 // subtle glow
          }
        });
      }

      // Fleet tracks line (inlet colors)
      if (!map.getLayer('fleet-tracks-line')) {
        map.addLayer({
          id: 'fleet-tracks-line',
          type: 'line',
          source: 'fleet-tracks-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2.5,
            'line-opacity': 0.7
          }
        });
      }

      // GFW tracks line (gear type colors)
      if (!map.getLayer('gfw-tracks-line')) {
        map.addLayer({
          id: 'gfw-tracks-line',
          type: 'line',
          source: 'gfw-tracks-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': [
              'match', ['get', 'color'],
              '#FF6B6B', '#FF6B6B',      // longliner
              '#46E6D4', '#46E6D4',      // drifting_longline
              '#4B9BFF', '#4B9BFF',      // trawler
              '#4B9BFF'                  // fallback
            ],
            'line-width': ['interpolate', ['linear'], ['zoom'],
              5, 1.5,
              9, 2.5,
              12, 3
            ],
            'line-opacity': 0.85
          }
        });
      }

      sourcesAdded.current = true;
    };

    // Wait for map style to load before adding sources and layers
    if (map.isStyleLoaded()) {
      setupSources();
    } else {
      map.once('style.load', setupSources);
    }

    return () => {
      // Check if map exists and has the necessary methods before cleanup
      if (map && typeof map.getLayer === 'function' && typeof map.removeLayer === 'function') {
        try {
          // Remove layers safely
          if (map.getLayer('user-track-line')) map.removeLayer('user-track-line');
          if (map.getLayer('fleet-tracks-line')) map.removeLayer('fleet-tracks-line');
          if (map.getLayer('gfw-tracks-line')) map.removeLayer('gfw-tracks-line');
        } catch (e) {
          console.warn('VesselTracksLayer cleanup error (layers):', e);
        }
      }

      if (map && typeof map.getSource === 'function' && typeof map.removeSource === 'function') {
        try {
          // Remove sources safely
          if (map.getSource('user-track-source')) map.removeSource('user-track-source');
          if (map.getSource('fleet-tracks-source')) map.removeSource('fleet-tracks-source');
          if (map.getSource('gfw-tracks-source')) map.removeSource('gfw-tracks-source');
        } catch (e) {
          console.warn('VesselTracksLayer cleanup error (sources):', e);
        }
      }

      sourcesAdded.current = false;
    };
  }, [map]);

  // Update user track
  useEffect(() => {
    if (!map || !sourcesAdded.current) return;

    try {
      const source = map.getSource('user-track-source') as mapboxgl.GeoJSONSource;
      if (!source) return;

      if (myTracksEnabled && myTrackCoords.length > 1) {
        const coordinates = myTrackCoords.map(([lon, lat]) => [lon, lat]);
        source.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates
            },
            properties: {}
          }]
        });
        if (map.getLayer('user-track-line')) {
          map.setLayoutProperty('user-track-line', 'visibility', 'visible');
        }
      } else {
        if (map.getLayer('user-track-line')) {
          map.setLayoutProperty('user-track-line', 'visibility', 'none');
        }
      }
    } catch (e) {
      console.warn('VesselTracksLayer update user track error:', e);
    }
  }, [map, myTracksEnabled, myTrackCoords]);

  // Update fleet tracks
  useEffect(() => {
    if (!map || !sourcesAdded.current) return;

    try {
      const source = map.getSource('fleet-tracks-source') as mapboxgl.GeoJSONSource;
      if (!source) return;

      if (fleetTracksEnabled && fleetTracks.length > 0) {
        const features = fleetTracks
          .filter(v => v.track && v.track.length > 1)
          .map(vessel => ({
            type: 'Feature' as const,
            geometry: {
              type: 'LineString' as const,
              coordinates: vessel.track
            },
            properties: {
              vessel_id: vessel.vessel_id,
              inlet_id: vessel.inlet_id,
              color: getInletColor(vessel.inlet_id)
            }
          }));

        source.setData({
          type: 'FeatureCollection',
          features
        });
        if (map.getLayer('fleet-tracks-line')) {
          map.setLayoutProperty('fleet-tracks-line', 'visibility', 'visible');
        }
      } else {
        if (map.getLayer('fleet-tracks-line')) {
          map.setLayoutProperty('fleet-tracks-line', 'visibility', 'none');
        }
      }
    } catch (e) {
      console.warn('VesselTracksLayer update fleet tracks error:', e);
    }
  }, [map, fleetTracksEnabled, fleetTracks]);

  // Update GFW tracks
  useEffect(() => {
    if (!map || !sourcesAdded.current) return;

    try {
      const source = map.getSource('gfw-tracks-source') as mapboxgl.GeoJSONSource;
      if (!source) return;

      if (gfwTracksEnabled && gfwTracks.length > 0) {
        const features = gfwTracks
          .filter(v => v.track && v.track.length > 1)
          .map(vessel => ({
            type: 'Feature' as const,
            geometry: {
              type: 'LineString' as const,
              coordinates: vessel.track
            },
            properties: {
              vessel_id: vessel.id,
              gear_type: vessel.gear_type,
              color: GEAR_TYPE_COLORS[vessel.gear_type] || GEAR_TYPE_COLORS.default
            }
          }));

        source.setData({
          type: 'FeatureCollection',
          features
        });
        if (map.getLayer('gfw-tracks-line')) {
          map.setLayoutProperty('gfw-tracks-line', 'visibility', 'visible');
        }
      } else {
        if (map.getLayer('gfw-tracks-line')) {
          map.setLayoutProperty('gfw-tracks-line', 'visibility', 'none');
        }
      }
    } catch (e) {
      console.warn('VesselTracksLayer update GFW tracks error:', e);
    }
  }, [map, gfwTracksEnabled, gfwTracks]);

  return null;
}