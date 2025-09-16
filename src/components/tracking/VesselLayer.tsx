'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { getInletById } from '@/lib/inlets';

interface VesselLayerProps {
  map: mapboxgl.Map | null;
  showYou: boolean;
  showFleet: boolean;
  showTracks: boolean;
  selectedInletId: string;
  onPositionUpdate?: (position: { lat: number; lng: number; speed: number }) => void;
}

// Mock fleet data for MVP - will be replaced with real API
const MOCK_FLEET = [
  { id: 'vessel-1', lat: 41.15, lng: -71.35, inlet: 'ri-block-island', name: 'Sea Hunter' },
  { id: 'vessel-2', lat: 41.18, lng: -71.38, inlet: 'ri-block-island', name: 'Blue Wave' },
  { id: 'vessel-3', lat: 40.95, lng: -72.10, inlet: 'ny-montauk', name: 'Fish Finder' },
  { id: 'vessel-4', lat: 40.92, lng: -72.05, inlet: 'ny-montauk', name: 'Deep Blue' },
  { id: 'vessel-5', lat: 41.65, lng: -70.60, inlet: 'ma-cape-cod', name: 'Cape Runner' },
  { id: 'vessel-6', lat: 41.70, lng: -70.55, inlet: 'ma-cape-cod', name: 'Cod Father' },
  { id: 'vessel-7', lat: 41.25, lng: -70.05, inlet: 'ma-nantucket', name: 'Island Time' },
  { id: 'vessel-8', lat: 39.35, lng: -74.42, inlet: 'nj-atlantic-city', name: 'Jersey Devil' },
  { id: 'vessel-9', lat: 35.25, lng: -75.52, inlet: 'nc-hatteras', name: 'Outer Banks' },
  { id: 'vessel-10', lat: 32.78, lng: -79.93, inlet: 'sc-charleston', name: 'Palmetto Pride' },
];

// Mock track data (last 4 hours of positions)
const generateTrack = (currentLat: number, currentLng: number, points: number = 20) => {
  const track = [];
  for (let i = 0; i < points; i++) {
    track.push([
      currentLng - (i * 0.01), // Move west over time
      currentLat - (i * 0.005 * Math.sin(i * 0.5)) // Slight wave pattern
    ]);
  }
  return track;
};

export default function VesselLayer({ 
  map, 
  showYou, 
  showFleet, 
  showTracks,
  selectedInletId,
  onPositionUpdate 
}: VesselLayerProps) {
  const [userPosition, setUserPosition] = useState<GeolocationPosition | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const fleetMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const trackSourceRef = useRef<boolean>(false);

  // Start GPS tracking
  useEffect(() => {
    if (!map) return;

    const startTracking = () => {
      if ('geolocation' in navigator) {
        // Get initial position
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserPosition(position);
            if (onPositionUpdate) {
              onPositionUpdate({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                speed: position.coords.speed || 0
              });
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Use a default position if geolocation fails (e.g., Montauk)
            const mockPosition = {
              coords: {
                latitude: 40.95,
                longitude: -72.08,
                speed: 0,
                accuracy: 100,
                altitude: null,
                altitudeAccuracy: null,
                heading: null
              },
              timestamp: Date.now()
            } as GeolocationPosition;
            setUserPosition(mockPosition);
          }
        );

        // Watch position for updates
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            setUserPosition(position);
            if (onPositionUpdate) {
              onPositionUpdate({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                speed: position.coords.speed || 0
              });
            }
          },
          (error) => console.error('Geolocation watch error:', error),
          {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
          }
        );
      }
    };

    startTracking();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [map, onPositionUpdate]);

  // Render user marker
  useEffect(() => {
    if (!map || !userPosition) return;

    // Remove old marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    if (showYou) {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'user-vessel-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(0, 221, 235, 0.8), 0 0 40px rgba(0, 221, 235, 0.4);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            border: 2px solid rgba(0, 221, 235, 0.5);
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        </div>
      `;

      // Add pulse animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([userPosition.coords.longitude, userPosition.coords.latitude])
        .addTo(map);

      userMarkerRef.current = marker;
    }

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, [map, userPosition, showYou]);

  // Render fleet markers
  useEffect(() => {
    if (!map) return;

    // Clear existing fleet markers
    fleetMarkersRef.current.forEach(marker => marker.remove());
    fleetMarkersRef.current.clear();

    if (showFleet) {
      // Filter fleet by selected inlet (or show all if no inlet selected)
      const visibleFleet = selectedInletId && selectedInletId !== 'overview' 
        ? MOCK_FLEET.filter(vessel => vessel.inlet === selectedInletId)
        : MOCK_FLEET;

      visibleFleet.forEach(vessel => {
        const inlet = getInletById(vessel.inlet);
        const color = inlet?.color || '#00DDEB';

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'fleet-vessel-marker';
        el.style.width = '12px';
        el.style.height = '12px';
        el.innerHTML = `
          <div style="
            width: 12px;
            height: 12px;
            background: ${color};
            border-radius: 50%;
            box-shadow: 0 0 10px ${color}66;
            border: 1px solid white;
          "></div>
        `;

        // Create marker with popup
        const marker = new mapboxgl.Marker(el)
          .setLngLat([vessel.lng, vessel.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px;">
                  <div style="font-weight: bold; color: ${color};">${vessel.name}</div>
                  <div style="font-size: 12px; color: #888; margin-top: 4px;">${inlet?.name || 'Unknown'}</div>
                </div>
              `)
          )
          .addTo(map);

        fleetMarkersRef.current.set(vessel.id, marker);
      });
    }

    return () => {
      fleetMarkersRef.current.forEach(marker => marker.remove());
      fleetMarkersRef.current.clear();
    };
  }, [map, showFleet, selectedInletId]);

  // Render vessel tracks
  useEffect(() => {
    if (!map) return;

    // Remove existing tracks
    if (map.getSource('vessel-tracks')) {
      if (map.getLayer('vessel-tracks-layer')) {
        map.removeLayer('vessel-tracks-layer');
      }
      map.removeSource('vessel-tracks');
      trackSourceRef.current = false;
    }

    if (showTracks && showFleet) {
      // Filter fleet by selected inlet
      const visibleFleet = selectedInletId && selectedInletId !== 'overview' 
        ? MOCK_FLEET.filter(vessel => vessel.inlet === selectedInletId)
        : MOCK_FLEET;

      // Generate track lines for each vessel
      const features = visibleFleet.map(vessel => {
        const inlet = getInletById(vessel.inlet);
        const color = inlet?.color || '#00DDEB';
        
        return {
          type: 'Feature' as const,
          properties: {
            vessel: vessel.name,
            color: color
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: generateTrack(vessel.lat, vessel.lng)
          }
        };
      });

      // Add user track if available
      if (showYou && userPosition) {
        features.push({
          type: 'Feature' as const,
          properties: {
            vessel: 'You',
            color: '#00DDEB'
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: generateTrack(
              userPosition.coords.latitude,
              userPosition.coords.longitude
            )
          }
        });
      }

      // Add source and layer
      map.addSource('vessel-tracks', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      });

      map.addLayer({
        id: 'vessel-tracks-layer',
        type: 'line',
        source: 'vessel-tracks',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.4,
          'line-dasharray': [2, 2]
        }
      });

      trackSourceRef.current = true;
    }

    return () => {
      if (map && map.getSource('vessel-tracks')) {
        if (map.getLayer('vessel-tracks-layer')) {
          map.removeLayer('vessel-tracks-layer');
        }
        map.removeSource('vessel-tracks');
        trackSourceRef.current = false;
      }
    };
  }, [map, showTracks, showFleet, showYou, userPosition, selectedInletId]);

  return null;
}
