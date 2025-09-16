'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { getInletById } from '@/lib/inlets';

interface VesselLayerProps {
  map: mapboxgl.Map | null;
  showYou: boolean;
  showFleet: boolean;
  showCommercial?: boolean;
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

// Mock GFW commercial vessels - public data available to all
const MOCK_COMMERCIAL = [
  { id: 'gfw-1', lat: 40.85, lng: -71.95, name: 'Commercial Trawler 1', type: 'Trawler', length: 85 },
  { id: 'gfw-2', lat: 41.05, lng: -71.65, name: 'Long Liner Alpha', type: 'Longliner', length: 120 },
  { id: 'gfw-3', lat: 40.75, lng: -72.25, name: 'Factory Ship Delta', type: 'Factory', length: 200 },
  { id: 'gfw-4', lat: 39.45, lng: -74.15, name: 'Seine Vessel 22', type: 'Purse Seine', length: 95 },
  { id: 'gfw-5', lat: 35.15, lng: -75.35, name: 'Dragger NC-45', type: 'Dragger', length: 75 },
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
  const [wasVisibleLastCheck, setWasVisibleLastCheck] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const fleetMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const trackSourceRef = useRef<boolean>(false);

  // Start GPS tracking
  useEffect(() => {
    if (!map) return;

    const startTracking = () => {
      // Check if location permission is granted
      const locationPermission = localStorage.getItem('abfi_location_permission');
      if (locationPermission !== 'granted') {
        console.log('Location permission not granted, skipping GPS tracking');
        return;
      }
      
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

    // PRIVACY CHECK: Only show location if user is within inlet bounds
    // This prevents showing home/land locations to other users
    const isWithinInletBounds = () => {
      const lat = userPosition.coords.latitude;
      const lng = userPosition.coords.longitude;
      
      // Check if user is near water (basic check - east of -76 longitude on East Coast)
      // This is a rough check - in production we'd use actual inlet polygons
      if (lng > -76) {
        console.log('[PRIVACY] User position on land, hiding from map');
        return false;
      }
      
      // Additional check: Must be within reasonable distance of selected inlet
      if (selectedInletId && selectedInletId !== 'overview') {
        const inlet = getInletById(selectedInletId);
        if (inlet) {
          const [inletLng, inletLat] = inlet.center;
          // Calculate rough distance (simplified)
          const latDiff = Math.abs(lat - inletLat);
          const lngDiff = Math.abs(lng - inletLng);
          // Must be within ~50 miles of inlet center (roughly 0.7 degrees)
          if (latDiff > 0.7 || lngDiff > 0.7) {
            console.log('[PRIVACY] User too far from selected inlet, hiding from map');
            return false;
          }
        }
      }
      
      return true;
    };

    const isVisible = showYou && isWithinInletBounds();
    
    // Show notification when entering/leaving inlet bounds
    if (isVisible && !wasVisibleLastCheck) {
      // Just became visible - entered inlet bounds
      setWasVisibleLastCheck(true);
      
      const inlet = getInletById(selectedInletId);
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-down';
      toast.innerHTML = `
        <div class="bg-slate-900/95 backdrop-blur-xl border border-green-500/30 rounded-lg px-6 py-4 shadow-2xl">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div>
              <div class="text-white font-semibold">Location Now Visible</div>
              <div class="text-gray-400 text-sm mt-1">You're at ${inlet?.name || 'the inlet'} - fleet can see you</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
      
    } else if (!isVisible && wasVisibleLastCheck && showYou) {
      // Just became invisible - left inlet bounds
      setWasVisibleLastCheck(false);
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-down';
      toast.innerHTML = `
        <div class="bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 rounded-lg px-6 py-4 shadow-2xl">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
              </svg>
            </div>
            <div>
              <div class="text-white font-semibold">Location Hidden</div>
              <div class="text-gray-400 text-sm mt-1">You're on land - position private</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
    
    if (isVisible) {
      // Create custom marker element with enhanced glow
      const el = document.createElement('div');
      el.className = 'user-vessel-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.position = 'relative';
      el.innerHTML = `
        <div style="
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          box-shadow: 
            0 0 30px rgba(0, 255, 255, 1),
            0 0 60px rgba(0, 221, 235, 0.8),
            0 0 90px rgba(0, 221, 235, 0.6),
            inset 0 0 15px rgba(0, 255, 255, 0.5);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
        ">
        </div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          transform: translate(-50%, -50%);
          border: 2px solid rgba(0, 255, 255, 0.6);
          border-radius: 50%;
          animation: pulse-ring 2s infinite;
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 60px;
          height: 60px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(0, 255, 255, 0.3) 0%, transparent 70%);
          animation: glow-pulse 2s infinite;
        "></div>
      `;

      // Add enhanced animations
      if (!document.getElementById('user-vessel-animations')) {
        const style = document.createElement('style');
        style.id = 'user-vessel-animations';
        style.textContent = `
          @keyframes pulse-ring {
            0% { 
              transform: translate(-50%, -50%) scale(1); 
              opacity: 1;
              border-color: rgba(0, 255, 255, 0.6);
            }
            50% { 
              transform: translate(-50%, -50%) scale(1.3); 
              opacity: 0.3;
              border-color: rgba(0, 255, 255, 0.8);
            }
            100% { 
              transform: translate(-50%, -50%) scale(1); 
              opacity: 1;
              border-color: rgba(0, 255, 255, 0.6);
            }
          }
          @keyframes glow-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }

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
  }, [map, userPosition, showYou, selectedInletId, wasVisibleLastCheck]);

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
      // Remove all track layers
      if (map.getLayer('vessel-tracks-layer')) {
        map.removeLayer('vessel-tracks-layer');
      }
      if (map.getLayer('vessel-tracks-glow-mid')) {
        map.removeLayer('vessel-tracks-glow-mid');
      }
      if (map.getLayer('vessel-tracks-glow-outer')) {
        map.removeLayer('vessel-tracks-glow-outer');
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

      // Add multiple layers for glowing effect
      // Outer glow
      map.addLayer({
        id: 'vessel-tracks-glow-outer',
        type: 'line',
        source: 'vessel-tracks',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 8,
          'line-opacity': 0.15,
          'line-blur': 4
        }
      });

      // Mid glow
      map.addLayer({
        id: 'vessel-tracks-glow-mid',
        type: 'line',
        source: 'vessel-tracks',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 4,
          'line-opacity': 0.3,
          'line-blur': 2
        }
      });

      // Core track
      map.addLayer({
        id: 'vessel-tracks-layer',
        type: 'line',
        source: 'vessel-tracks',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.8
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        }
      });

      trackSourceRef.current = true;
    }

    return () => {
      if (map && map.getSource('vessel-tracks')) {
        if (map.getLayer('vessel-tracks-layer')) {
          map.removeLayer('vessel-tracks-layer');
        }
        if (map.getLayer('vessel-tracks-glow-mid')) {
          map.removeLayer('vessel-tracks-glow-mid');
        }
        if (map.getLayer('vessel-tracks-glow-outer')) {
          map.removeLayer('vessel-tracks-glow-outer');
        }
        map.removeSource('vessel-tracks');
        trackSourceRef.current = false;
      }
    };
  }, [map, showTracks, showFleet, showYou, userPosition, selectedInletId]);

  return null;
}
