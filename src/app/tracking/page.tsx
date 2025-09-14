'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import NavTabs from '@/components/NavTabs';
import TopHUD from '@/components/TopHUD';
import TrackingWidget from '@/components/tracking/TrackingWidget';

// Set Mapbox token
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
      style: 'mapbox://styles/mapbox/dark-v11', // Dark theme for tracking
      center: userLocation ? [userLocation.lng, userLocation.lat] : [-70.0, 42.0], // East Coast default
      zoom: userLocation ? 12 : 8
    });

    // When map loads, add user location if we have it
    map.current.on('load', () => {
      if (userLocation) {
        // Add a marker for user location
        new mapboxgl.Marker({ color: '#00DDEB' }) // ABFI cyan color
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
    <div className="w-full h-screen bg-gray-950 relative">
      {/* Navigation */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <NavTabs />
          <TopHUD includeAbfi={false} />
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Tracking Widget - Positioned over map */}
      <div className="absolute top-20 left-4 z-40 w-80 max-h-[calc(100vh-100px)] overflow-y-auto">
        <TrackingWidget />
      </div>
    </div>
  );
}