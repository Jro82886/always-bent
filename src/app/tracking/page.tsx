'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function TrackingPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Get user's saved location from welcome screen
  useEffect(() => {
    const savedLocation = localStorage.getItem('abfi_last_location');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setUserLocation(location);
        console.log('Found saved location:', location);
      } catch (e) {
        console.log('No saved location found');
      }
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Create map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Simple streets style
      center: userLocation ? [userLocation.lng, userLocation.lat] : [-74.0, 40.7],
      zoom: userLocation ? 12 : 8
    });

    // When map loads, add user location if we have it
    map.current.on('load', () => {
      if (userLocation) {
        // Add a simple marker for user location
        new mapboxgl.Marker({ color: 'red' })
          .setLngLat([userLocation.lng, userLocation.lat])
          .setPopup(new mapboxgl.Popup().setText('Your Location'))
          .addTo(map.current!);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [userLocation]);

  return (
    <div className="w-full h-screen bg-red-500">
      {/* Simple header - BRIGHT COLORS TO SEE IF IT WORKS */}
      <div className="absolute top-4 left-4 z-10 bg-yellow-400 p-6 rounded shadow border-4 border-black">
        <h1 className="text-lg font-bold text-black">User Tracking</h1>
        {userLocation ? (
          <p className="text-sm text-gray-600">
            Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </p>
        ) : (
          <p className="text-sm text-gray-600">No location saved</p>
        )}
      </div>

      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}