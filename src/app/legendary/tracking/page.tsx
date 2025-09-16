'use client';

import { useState, useEffect, useRef } from 'react';
import PageWithSuspense from '@/components/PageWithSuspense';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import UnifiedCommandBar from '@/components/UnifiedCommandBar';

// Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function TrackingModeContent() {
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
      {/* Map Container - No toolbar, just the map */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* TEST INDICATOR - Remove this after confirming deployment! */}
      <div className="absolute top-20 right-4 z-50 bg-red-600/90 px-4 py-2 rounded-lg animate-pulse">
        <p className="text-white font-bold">🚨 TRACKING IS LIVE! 🚨</p>
        <p className="text-xs text-white/80">Deploy confirmed at {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <PageWithSuspense>
      <TrackingModeContent />
    </PageWithSuspense>
  );
}
