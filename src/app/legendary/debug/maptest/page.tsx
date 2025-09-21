'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function MapTestPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Set token
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        setError('No Mapbox token found');
        return;
      }
      
      mapboxgl.accessToken = token;
      setStatus('Token set, creating map...');

      // Create map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-74.5, 40],
        zoom: 9
      });

      map.current.on('load', () => {
        setStatus('✅ Map loaded successfully!');
      });

      map.current.on('error', (e) => {
        setError(`Map error: ${e.error.message}`);
      });

    } catch (err) {
      setError(`Failed to initialize: ${err}`);
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className="h-screen w-full bg-gray-900">
      <div className="absolute top-4 left-4 z-10 bg-black/80 p-4 rounded">
        <h1 className="text-white text-lg font-bold">Map Test</h1>
        <p className="text-sm text-gray-300">Status: {status}</p>
        {error && <p className="text-sm text-red-400">Error: {error}</p>}
      </div>
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
