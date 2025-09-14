'use client';

import { useState, useEffect } from 'react';
import { MapShell } from '@/lib/MapRef';
import { useMapbox } from '@/lib/MapCtx';
import NavTabs from '@/components/NavTabs';
import TopHUD from '@/components/TopHUD';
import TrackingWidget from '@/components/tracking/TrackingWidget';

export default function TrackingPage() {
  const map = useMapbox();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Get user's saved location from welcome screen
  useEffect(() => {
    const savedLocation = localStorage.getItem('abfi_last_location');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setUserLocation(location);
        console.log('Found saved location:', location);
        
        // Fly to user location if map is ready
        if (map) {
          map.flyTo({
            center: [location.lng, location.lat],
            zoom: 12,
            duration: 2000
          });
        }
      } catch (e) {
        console.log('No saved location found');
      }
    }
  }, [map]);

  // Add user location marker when map and location are ready
  useEffect(() => {
    if (!map || !userLocation) return;

    // Add marker for user location
    new (window as any).mapboxgl.Marker({ color: '#00DDEB' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new (window as any).mapboxgl.Popup().setText('Your Location'))
      .addTo(map);
  }, [map, userLocation]);

  return (
    <MapShell>
      <NavTabs />
      <TopHUD includeAbfi={false} />
      
      {/* Tracking Widget - Positioned over map */}
      <div className="absolute top-20 left-4 z-40 w-80 max-h-[calc(100vh-100px)] overflow-y-auto">
        <TrackingWidget />
      </div>
    </MapShell>
  );
}