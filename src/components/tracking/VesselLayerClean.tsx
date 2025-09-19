'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { createClient } from '@/lib/supabase/client';

interface VesselLayerProps {
  map: mapboxgl.Map | null;
  showYou: boolean;
  showFleet: boolean;
  showTracks: boolean;
  showFleetTracks: boolean;
  selectedInletId: string;
  onPositionUpdate?: (position: { lat: number; lng: number; speed: number }) => void;
}

// Constants for position tracking
const MIN_SEND_INTERVAL = 15000; // 15 seconds minimum between sends
const MIN_DISTANCE_METERS = 50; // 50m minimum movement
const MIN_HEADING_CHANGE = 15; // 15 degrees minimum heading change
const MAX_SEND_INTERVAL = 60000; // 60 seconds maximum between sends

export default function VesselLayerClean({ 
  map, 
  showYou, 
  showFleet, 
  showTracks,
  showFleetTracks,
  selectedInletId,
  onPositionUpdate 
}: VesselLayerProps) {
  const [userPosition, setUserPosition] = useState<GeolocationPosition | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const fleetMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const lastSentPositionRef = useRef<{lat: number; lng: number; heading?: number; timestamp: number} | null>(null);
  const supabase = createClient();

  // Calculate distance between two points in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Check if position should be sent based on significant change rules
  const shouldSendPosition = (position: GeolocationPosition): boolean => {
    const now = Date.now();
    const lastSent = lastSentPositionRef.current;
    
    if (!lastSent) return true; // First position
    
    const timeSinceLastSent = now - lastSent.timestamp;
    
    // Always send if max interval exceeded
    if (timeSinceLastSent >= MAX_SEND_INTERVAL) return true;
    
    // Don't send if minimum interval not met
    if (timeSinceLastSent < MIN_SEND_INTERVAL) return false;
    
    // Check for significant movement
    const distance = calculateDistance(
      lastSent.lat, 
      lastSent.lng,
      position.coords.latitude,
      position.coords.longitude
    );
    
    if (distance > MIN_DISTANCE_METERS) return true;
    
    // Check for significant heading change
    if (position.coords.heading !== null && lastSent.heading !== undefined) {
      const headingDelta = Math.abs(position.coords.heading - lastSent.heading);
      if (headingDelta > MIN_HEADING_CHANGE) return true;
    }
    
    return false;
  };

  // Send position to server
  const sendPosition = async (position: GeolocationPosition) => {
    if (!shouldSendPosition(position)) return;
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;
      
      const captainName = localStorage.getItem('abfi_captain_name') || 'Anonymous';
      const boatName = localStorage.getItem('abfi_boat_name') || 'Unknown Vessel';
      
      await fetch('/api/tracking/position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.data.user.id,
          username: `${captainName} (${boatName})`,
          inlet_id: selectedInletId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: position.coords.speed ? position.coords.speed * 1.94384 : 0, // m/s to knots
          heading: position.coords.heading || null,
          session_id: `session_${Date.now()}`,
          ts: new Date().toISOString()
        })
      });
      
      // Update last sent position
      lastSentPositionRef.current = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        heading: position.coords.heading || undefined,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error sending position:', error);
    }
  };

  // Start/stop position tracking based on showYou
  useEffect(() => {
    if (!map || !showYou) {
      // Clean up when hiding
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      setUserPosition(null);
      lastSentPositionRef.current = null;
      return;
    }

    // Check global location permission
    const locationPermission = localStorage.getItem('abfi_location_permission');
    if (locationPermission !== 'granted') {
      console.log('Location permission not granted');
      return;
    }

    // Start tracking
    if ('geolocation' in navigator) {
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setUserPosition(position);
          if (onPositionUpdate) {
            onPositionUpdate({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              speed: position.coords.speed || 0
            });
          }
          await sendPosition(position);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );

      // Watch for updates
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          setUserPosition(position);
          if (onPositionUpdate) {
            onPositionUpdate({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              speed: position.coords.speed || 0
            });
          }
          
          // Only send if page is visible
          if (document.visibilityState === 'visible') {
            await sendPosition(position);
          }
        },
        (error) => {
          console.error('Geolocation watch error:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000, // 30s max cache
          timeout: 27000 // 27s timeout
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [map, showYou, selectedInletId, onPositionUpdate]);

  // Update user marker position
  useEffect(() => {
    if (!map || !userPosition || !showYou) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const lat = userPosition.coords.latitude;
    const lng = userPosition.coords.longitude;

    if (!userMarkerRef.current) {
      // Create glowing orb element
      const el = document.createElement('div');
      el.className = 'user-vessel-marker';
      el.style.cssText = `
        width: 24px;
        height: 24px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.5);
        animation: pulse 2s infinite;
      `;

      // Add pulse animation if not exists
      if (!document.getElementById('user-marker-pulse')) {
        const style = document.createElement('style');
        style.id = 'user-marker-pulse';
        style.textContent = `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([lng, lat]);
    }
  }, [map, userPosition, showYou]);

  // Fetch and display fleet vessels
  useEffect(() => {
    if (!map || !showFleet || !selectedInletId || selectedInletId === 'overview') {
      // Clean up fleet markers
      fleetMarkersRef.current.forEach(marker => marker.remove());
      fleetMarkersRef.current.clear();
      return;
    }

    // Check global location permission
    const locationPermission = localStorage.getItem('abfi_location_permission');
    if (locationPermission !== 'granted') {
      console.log('Cannot show fleet - location permission not granted');
      return;
    }

    const fetchFleetPositions = async () => {
      try {
        const response = await fetch(`/api/tracking/position?inlet_id=${selectedInletId}&hours=96`); // 4 days
        if (!response.ok) throw new Error('Failed to fetch fleet');
        
        const data = await response.json();
        const vessels = data.vessels || [];
        
        // Clear existing markers
        fleetMarkersRef.current.forEach(marker => marker.remove());
        fleetMarkersRef.current.clear();
        
        // Add fleet markers
        vessels.forEach((vessel: any) => {
          // Only show vessels with positions from last 5 minutes
          if (!vessel.latest) return;
          
          const lastSeen = new Date(vessel.latest.timestamp);
          const minutesAgo = (Date.now() - lastSeen.getTime()) / 60000;
          if (minutesAgo > 5) return;
          
          // Skip our own vessel
          const user = supabase.auth.getUser();
          if (vessel.user_id === user.data?.user?.id) return;
          
          // Create fleet marker
          const el = document.createElement('div');
          el.className = 'fleet-vessel-marker';
          el.style.cssText = `
            width: 16px;
            height: 16px;
            background: #00DDEB;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
          `;
          
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([vessel.latest.lng, vessel.latest.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`
              <div style="padding: 8px;">
                <strong>${vessel.username || 'Unknown Captain'}</strong><br/>
                <span style="font-size: 12px; color: #666;">
                  ${vessel.latest.speed?.toFixed(1) || '0'} kts
                </span>
              </div>
            `))
            .addTo(map);
            
          fleetMarkersRef.current.set(vessel.user_id, marker);
        });
      } catch (error) {
        console.error('Error fetching fleet:', error);
      }
    };

    // Fetch immediately and then every 30 seconds
    fetchFleetPositions();
    const interval = setInterval(fetchFleetPositions, 30000);
    
    return () => {
      clearInterval(interval);
      fleetMarkersRef.current.forEach(marker => marker.remove());
      fleetMarkersRef.current.clear();
    };
  }, [map, showFleet, selectedInletId]);

  // Handle track rendering
  useEffect(() => {
    if (!map || (!showTracks && !showFleetTracks)) {
      // Remove track layers if they exist
      if (map.getLayer('user-track')) map.removeLayer('user-track');
      if (map.getSource('user-track')) map.removeSource('user-track');
      if (map.getLayer('fleet-tracks')) map.removeLayer('fleet-tracks');
      if (map.getSource('fleet-tracks')) map.removeSource('fleet-tracks');
      return;
    }

    // TODO: Implement track fetching and rendering
    // This will fetch 4-day track data and render as Mapbox GL line layers
    // with simplification based on zoom level
    
  }, [map, showTracks, showFleetTracks]);

  return null;
}
