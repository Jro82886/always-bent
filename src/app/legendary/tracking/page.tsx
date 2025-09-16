'use client';

import { useState, useEffect, useRef } from 'react';
import PageWithSuspense from '@/components/PageWithSuspense';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import UnifiedCommandBar from '@/components/UnifiedCommandBar';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import { flyToInlet60nm } from '@/lib/inletBounds';

// Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function TrackingModeContent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [activeTab, setActiveTab] = useState('tracking');
  
  // Get selected inlet from global state
  const { selectedInletId } = useAppState();

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-74, 35],  // Start with East Coast view
      zoom: 5,  // Zoomed out to see Gulf Stream
      pitch: 0,
      bearing: 0,
      cooperativeGestures: false  // Allow normal scroll zoom
    });
    
    const mapInstance = map.current;
    
    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    
    mapInstance.on('load', () => {
      console.log('[TRACKING] Map initialized with East Coast view');
      
      // Set East Coast bounds to prevent getting lost
      const EAST_COAST_BOUNDS = [[-85, 23], [-64, 47]];
      mapInstance.setMaxBounds(EAST_COAST_BOUNDS as any);
      
      // Ensure map stays flat
      mapInstance.setPitch(0);
      mapInstance.setBearing(0);
      
      // Disable pitch/rotation controls
      mapInstance.dragRotate.disable();
      mapInstance.touchPitch.disable();
    });

    return () => {
      map.current?.remove();
    };
  }, []);
  
  // Watch for inlet changes and fly to selected inlet with Gulf Stream view
  useEffect(() => {
    if (!map.current || !selectedInletId) return;
    
    const inlet = getInletById(selectedInletId);
    if (inlet) {
      // Use proper Gulf Stream view for each inlet
      flyToInlet60nm(map.current, inlet);
      console.log(`[TRACKING] Flying to inlet with Gulf Stream view: ${inlet.name}`);
    }
  }, [selectedInletId]);

  return (
    <div className="w-full h-screen relative">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Unified Command Bar - Navigation + Boat Info + Inlet Selector */}
      <UnifiedCommandBar 
        map={map.current} 
        activeTab="tracking"
        onTabChange={() => {}}
      />
      
      {/* Tracking Mode UI - Coming Soon */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-black/80 backdrop-blur-xl px-6 py-3 rounded-full border border-cyan-500/30">
          <p className="text-cyan-400 font-medium">🎣 Real-time vessel tracking coming soon...</p>
        </div>
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
