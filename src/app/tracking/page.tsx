'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import NavTabs from '@/components/NavTabs';
import TopHUD from '@/components/TopHUD';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function TrackingPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('[Tracking] Initializing map...');
    console.log('[Tracking] Token present:', !!mapboxgl.accessToken);

    const timer = setTimeout(() => {
      try {
        if (!mapboxgl.accessToken) {
          console.error('[Tracking] No token!');
          return;
        }

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-74.0, 40.7],
          zoom: 9
        });

        map.current.on('load', () => {
          console.log('[Tracking] Map loaded!');
          setMapLoaded(true);
        });

        map.current.on('error', (e) => {
          console.error('[Tracking] Map error:', e);
        });

      } catch (error) {
        console.error('[Tracking] Init failed:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-screen bg-gray-950 relative">
      {/* Map container - FIRST, no absolute positioning issues */}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ backgroundColor: '#1f2937' }}
      />
      
      {/* UI overlay - simple and clean */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <NavTabs />
          <TopHUD includeAbfi={false} />
        </div>
      </div>

      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-40">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-cyan-400 text-sm">Loading tracking map...</p>
          </div>
        </div>
      )}

      {/* Simple UI when loaded */}
      {mapLoaded && (
        <div className="absolute bottom-6 left-6 z-40 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/30">
            <h3 className="text-white font-semibold mb-2">Tracking Active</h3>
            <p className="text-cyan-400 text-sm">Map loaded successfully</p>
            <p className="text-gray-400 text-xs mt-1">Ready for vessel tracking</p>
          </div>
        </div>
      )}
    </div>
  );
}