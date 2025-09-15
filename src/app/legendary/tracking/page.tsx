'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import UnifiedCommandBar from '@/components/UnifiedCommandBar';

// Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function TrackingPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [activeTab, setActiveTab] = useState('tracking');

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-79.8, 26.9],
      zoom: 8,
      pitch: 0,
      bearing: 0
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className="w-full h-screen relative">
      {/* Command Bridge (Navigation) */}
      <UnifiedCommandBar 
        map={map.current}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
