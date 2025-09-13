'use client';

import { useEffect, useRef } from 'react';
import { useAppState } from '@/store/appState';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import CommunityMode from '@/components/community/CommunityMode';
import TopHUD from '@/components/TopHUD';
import RequireUsername from '@/components/RequireUsername';
import NavTabs from '@/components/NavTabs';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function CommunityPage() {
  const { setCommunityBadge } = useAppState();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Initialize blurred map background
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Small delay to ensure previous map is fully cleaned up
    const initTimer = setTimeout(() => {
      if (!mapContainer.current) return;
      
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/satellite-v9',
          center: [-72.0, 40.7], // East Coast center
          zoom: 7,
          interactive: false, // Make map non-interactive for background effect
          trackResize: false, // Disable resize tracking for background map
          preserveDrawingBuffer: false
        });

        // Add blur effect to map container after map loads
        const handleLoad = () => {
          if (mapContainer.current) {
            mapContainer.current.style.filter = 'blur(8px)';
            mapContainer.current.style.opacity = '0.4';
          }
        };
        
        // Handle any errors gracefully
        const handleError = (e: any) => {
          console.warn('Community map error (non-critical):', e);
        };
        
        map.current.on('load', handleLoad);
        map.current.on('error', handleError);
      } catch (error) {
        console.warn('Failed to initialize community background map:', error);
      }
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (map.current) {
        try {
          // Just remove the map - it handles its own cleanup
          map.current.remove();
          map.current = null;
        } catch (error) {
          console.warn('Error cleaning up community map:', error);
        }
      }
    };
  }, []);

  useEffect(() => {
    // Clear badge when page is focused
    const handleFocus = () => setCommunityBadge(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [setCommunityBadge]);

  return (
    <RequireUsername>
      <main className="h-screen w-screen bg-black text-white relative overflow-hidden">
        {/* Blurred Map Background */}
        <div ref={mapContainer} className="absolute inset-0 z-0" />
        
        {/* Navigation */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <NavTabs />
          <TopHUD includeAbfi={false} />
        </div>
        
        {/* Community Interface */}
        <div className="absolute inset-0 z-20 top-16 md:top-20 pointer-events-auto">
          <CommunityMode />
        </div>
      </main>
    </RequireUsername>
  );
}