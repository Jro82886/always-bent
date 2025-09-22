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

    // Add sources with standardized IDs
    map.addSource('user-track-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addSource('fleet-tracks-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addSource('gfw-tracks-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Add layers with standardized IDs
    // User track line (emerald with glow)
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

    // Fleet tracks line (inlet colors)
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

    // GFW tracks line (gear type colors)
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

    sourcesAdded.current = true;

    return () => {
      if (map.getLayer('user-track-line')) map.removeLayer('user-track-line');
      if (map.getLayer('fleet-tracks-line')) map.removeLayer('fleet-tracks-line');
      if (map.getLayer('gfw-tracks-line')) map.removeLayer('gfw-tracks-line');
      
      if (map.getSource('user-track-source')) map.removeSource('user-track-source');
      if (map.getSource('fleet-tracks-source')) map.removeSource('fleet-tracks-source');
      if (map.getSource('gfw-tracks-source')) map.removeSource('gfw-tracks-source');
      
      sourcesAdded.current = false;
    };
  }, [map]);

  // Update user track
  useEffect(() => {
    if (!map || !sourcesAdded.current) return;
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
      map.setLayoutProperty('user-track-line', 'visibility', 'visible');
    } else {
      map.setLayoutProperty('user-track-line', 'visibility', 'none');
    }
  }, [map, myTracksEnabled, myTrackCoords]);

  // Update fleet tracks
  useEffect(() => {
    if (!map || !sourcesAdded.current) return;
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
      map.setLayoutProperty('fleet-tracks-line', 'visibility', 'visible');
    } else {
      map.setLayoutProperty('fleet-tracks-line', 'visibility', 'none');
    }
  }, [map, fleetTracksEnabled, fleetTracks]);

  // Update GFW tracks
  useEffect(() => {
    if (!map || !sourcesAdded.current) return;
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
      map.setLayoutProperty('gfw-tracks-line', 'visibility', 'visible');
    } else {
      map.setLayoutProperty('gfw-tracks-line', 'visibility', 'none');
    }
  }, [map, gfwTracksEnabled, gfwTracks]);

  return null;
}