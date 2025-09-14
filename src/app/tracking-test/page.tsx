'use client';

import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function TrackingTestPage() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<string>('checking...');

  useEffect(() => {
    // Check token
    if (mapboxgl.accessToken) {
      setTokenStatus(`Token set: ${mapboxgl.accessToken.substring(0, 10)}...`);
    } else {
      setTokenStatus('NO TOKEN FOUND');
      setError('Mapbox token is missing');
      return;
    }

    // Try to initialize a simple map
    try {
      const container = document.getElementById('test-map');
      if (!container) {
        setError('Map container not found');
        return;
      }

      const map = new mapboxgl.Map({
        container: 'test-map',
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [-74.0, 40.7], // New York
        zoom: 9
      });

      map.on('load', () => {
        setMapLoaded(true);
        console.log('Map loaded successfully!');
      });

      map.on('error', (e) => {
        setError(`Map error: ${e.error?.message || 'Unknown error'}`);
        console.error('Map error:', e);
      });

      return () => {
        map.remove();
      };
    } catch (err) {
      setError(`Failed to initialize map: ${err}`);
      console.error('Map init error:', err);
    }
  }, []);

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-black text-white p-4">
        <h1 className="text-xl font-bold mb-2">Tracking Test Page</h1>
        <div className="text-sm space-y-1">
          <div>Token Status: <span className={tokenStatus.includes('NO TOKEN') ? 'text-red-500' : 'text-green-500'}>{tokenStatus}</span></div>
          <div>Map Status: <span className={mapLoaded ? 'text-green-500' : 'text-yellow-500'}>{mapLoaded ? 'Loaded' : 'Loading...'}</span></div>
          {error && <div className="text-red-500">Error: {error}</div>}
        </div>
      </div>

      {/* Simple Map Container */}
      <div id="test-map" className="w-full h-full" />

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-black/80 text-white p-4">
        <h2 className="font-bold mb-2">Debug Instructions:</h2>
        <ol className="text-sm space-y-1">
          <li>1. Check if this page loads at all</li>
          <li>2. Look for the token status (should show first 10 chars)</li>
          <li>3. Check if map loads (satellite view should appear)</li>
          <li>4. Open browser console (F12) for any errors</li>
          <li>5. If this works, the issue is in the main tracking page complexity</li>
        </ol>
      </div>
    </div>
  );
}
