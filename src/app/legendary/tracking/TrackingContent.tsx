'use client';

import { useState, useEffect, useRef } from 'react';
import PageWithSuspense from '@/components/PageWithSuspense';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/styles/mapbox-controls.css';
import HeaderBar from '@/components/CommandBridge/HeaderBar';
import { useInletFromURL } from '@/hooks/useInletFromURL';
import CommercialVesselLayer from '@/components/tracking/CommercialVesselLayer';
import RecBoatsClustering from '@/components/tracking/RecBoatsClustering';
import FleetLayer from '@/components/tracking/FleetLayer';
import GFWVesselLayer from '@/components/tracking/GFWVesselLayer';
import VesselTracksLayer from '@/components/tracking/VesselTracksLayer';
import TrackingToolbar from '@/components/tracking/TrackingToolbar';
import EnhancedTrackingLegend from '@/components/tracking/EnhancedTrackingLegend';
import GFWLegend from '@/components/tracking/GFWLegend';
import InletRegions from '@/components/InletRegions';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import dynamic from 'next/dynamic';
import { flags } from '@/lib/flags';

// Dynamic import for ChatDrawer
const ChatDrawer = dynamic(() => import('@/components/chat/ChatDrawer'), {
  ssr: false
});

// Dynamic import for RestrictToggle (dev only)
const RestrictToggle = dynamic(() => import('@/components/dev/RestrictToggle'), {
  ssr: false
});

// Mapbox token will be set in useEffect to avoid SSR issues

// East Coast bounding box for overview
const EAST_COAST_BOUNDS = [
  [-82.0, 24.0], // SW corner (Florida Keys / Gulf side buffer)
  [-65.0, 45.0], // NE corner (Maine + offshore buffer)
] as [[number, number], [number, number]];

// Store map instance outside component to persist across re-renders
let globalMapInstance: mapboxgl.Map | null = null;

function TrackingModeContent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapFullyReady, setMapFullyReady] = useState(false);
  
  // Get selected inlet from global state
  const { selectedInletId } = useAppState();
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;
  
  // Sync inlet from URL on mount
  useInletFromURL();
  
  // Location permission
  const { isGranted: locationGranted } = useLocationPermission();
  
  // Get track states from Zustand
  const myTracksEnabled = useAppState(s => s.myTracksEnabled);
  const setMyTracksEnabled = useAppState(s => s.setMyTracksEnabled);
  const fleetTracksEnabled = useAppState(s => s.fleetTracksEnabled);
  const setFleetTracksEnabled = useAppState(s => s.setFleetTracksEnabled);
  const gfwTracksEnabled = useAppState(s => s.gfwTracksEnabled);
  const setGfwTracksEnabled = useAppState(s => s.setGfwTracksEnabled);
  
  // Vessel visibility states (all OFF by default per spec)
  const [showYou, setShowYou] = useState(false);
  const [showTracks, setShowTracks] = useState(false);
  const [showFleet, setShowFleet] = useState(false);
  const [showFleetTracks, setShowFleetTracks] = useState(false);
  const [showCommercial, setShowCommercial] = useState(false);
  const [showCommercialTracks, setShowCommercialTracks] = useState(false);
  
  // Chat drawer state
  const [showChat, setShowChat] = useState(false);
  
  // User position state
  const [userPosition, setUserPosition] = useState<{lat: number, lng: number, speed: number} | null>(null);
  
  // GFW vessel counts
  const [gfwVesselCounts, setGfwVesselCounts] = useState<{
    longliner: number;
    drifting_longline: number;
    trawler: number;
    fishing_events: number;
  }>({ longliner: 0, drifting_longline: 0, trawler: 0, fishing_events: 0 });
  
  // Fleet vessels state (mapped to match EnhancedTrackingLegend interface)
  const [fleetVessels, setFleetVessels] = useState<Array<{
    id: string;
    inlet?: string;
    inletColor?: string;
    hasReport?: boolean;
  }>>([]);
  
  // Fleet tracks state
  const [fleetTracks, setFleetTracks] = useState<Array<{
    vessel_id: string;
    inlet_id: string;
    track: Array<[number, number]>;
  }>>([]);
  
  // GFW tracks state
  const [gfwTracks, setGfwTracks] = useState<Array<{
    id: string;
    gear_type: string;
    track: Array<[number, number]>;
  }>>([]);
  
  // Handle position updates from VesselLayer
  const handlePositionUpdate = (position: { lat: number; lng: number; speed: number }) => {
    setUserPosition(position);
  };
  
  
  // Initialize map ONCE - no dependencies
  useEffect(() => {
    console.log('Map init effect running');
    console.log('- globalMapInstance exists:', !!globalMapInstance);
    console.log('- mapContainer.current exists:', !!mapContainer.current);
    
    // Check if we already have a global map instance
    if (globalMapInstance) {
      console.log('Reusing existing map instance');
      map.current = globalMapInstance;
      
      // Check if the container changed
      if (mapContainer.current && globalMapInstance.getContainer() !== mapContainer.current) {
        console.log('Container changed, updating map container');
        // Remove from old container and add to new
        globalMapInstance.remove();
        globalMapInstance = null;
      } else {
        // Map already exists and container is same, just mark as ready
        setMapFullyReady(true);
        return;
      }
    }
    
    if (!mapContainer.current) return;

    // Set Mapbox token here to avoid SSR issues
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    console.log('Mapbox token:', token ? `${token.slice(0, 10)}...` : 'MISSING');
    mapboxgl.accessToken = token;

    console.log('Creating new map instance...');
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe' as any,
    });
    
    map.current = newMap;
    globalMapInstance = newMap;

    map.current.on('load', () => {
      console.log('Map Loaded - Tracking Mode (only once!)');
      
      // Expose map for debugging
      (window as any).map = map.current;
      console.log('Map exposed to window.map for debugging');
      
      // Configure globe
      map.current!.setFog({
        color: 'rgb(0, 0, 0)',
        'high-color': 'rgb(0, 20, 40)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(0, 0, 0)',
        'star-intensity': 0.6
      });
      
      // Set initial view based on inlet selection
      if (inlet) {
        console.log('Initial view - Flying to inlet:', inlet.name, [inlet.lng, inlet.lat]);
        map.current!.flyTo({
          center: [inlet.lng!, inlet.lat!],
          zoom: inlet.zoom,
          duration: 1500
        });
      } else {
        console.log('Initial view - Fitting to East Coast bounds');
        map.current!.fitBounds(EAST_COAST_BOUNDS, {
          padding: 40,
          duration: 1500
        });
      }
      
      // Add zoom controls (bottom-right)
      if (!(map.current as any).__navCtl) {
        const nav = new mapboxgl.NavigationControl({ 
          showCompass: false, 
          visualizePitch: false 
        });
        map.current!.addControl(nav, 'bottom-right');
        (map.current as any).__navCtl = nav; // prevent double-add
      }

      setMapFullyReady(true);
      console.log('Map fully ready');
    });
    
    // Error handling
    map.current.on('error', (e: any) => {
      console.error('Map error:', e);
      if (e.error?.status === 401) {
        console.error('Mapbox token invalid - check NEXT_PUBLIC_MAPBOX_TOKEN');
      }
    });

    return () => {
      console.log('Map cleanup - keeping global instance alive');
      // Don't destroy the map on unmount - keep it for reuse
      // This prevents recreation on navigation
    };
  }, []); // Empty dependency array - only run once!

  // Update data when inlet changes (NO camera movement)
  useEffect(() => {
    if (!mapFullyReady) return;
    
    console.log('Inlet changed, updating data only');
    // Data updates happen in other components (weather, fleet, etc.)
    // No camera movement on dropdown change
  }, [inlet, mapFullyReady]);

  // Handle fly to inlet zoom
  const handleFlyToInlet = () => {
    if (!map.current) return;
    
    if (inlet) {
      // Use center and zoom for inlet view
      map.current.flyTo({
        center: inlet.center,
        zoom: inlet.zoom,
        duration: 1200,
        essential: true
      });
    } else {
      // No inlet selected - go to East Coast overview
      map.current.fitBounds(EAST_COAST_BOUNDS, {
        padding: 40,
        duration: 1200
      });
    }
  };

  // Clean up global map when component is truly destroyed (page navigation)
  useEffect(() => {
    return () => {
      // This runs when navigating away from Tracking page entirely
      const pathname = window.location.pathname;
      if (!pathname.includes('/tracking')) {
        console.log('Leaving tracking page - cleaning up global map');
        if (globalMapInstance) {
          globalMapInstance.remove();
          globalMapInstance = null;
        }
      }
    };
  }, []);

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Command Bridge - inlet selector only */}
      <HeaderBar 
        activeMode="tracking"
        showInletSelector={true}
        showWeather={false}
        showChat={false}
      />
      
      {/* Map Container - add explicit height and top offset for header */}
      <div ref={mapContainer} className="absolute inset-0 top-16" style={{ height: 'calc(100vh - 64px)' }} />
      
      {/* Left Toolbar */}
      <TrackingToolbar
        selectedInletId={selectedInletId}
        locationGranted={locationGranted}
        showYou={showYou}
        setShowYou={setShowYou}
        showTracks={myTracksEnabled}
        setShowTracks={setMyTracksEnabled}
        showFleet={showFleet}
        setShowFleet={setShowFleet}
        showFleetTracks={fleetTracksEnabled}
        setShowFleetTracks={setFleetTracksEnabled}
        showCommercial={showCommercial}
        setShowCommercial={setShowCommercial}
        showCommercialTracks={gfwTracksEnabled}
        setShowCommercialTracks={setGfwTracksEnabled}
        userPosition={userPosition}
        onFlyToInlet={handleFlyToInlet}
        onChatToggle={() => setShowChat(!showChat)}
        map={map.current}
      />
      
      {/* Right Legend - always visible */}
      <EnhancedTrackingLegend 
        selectedInletId={selectedInletId}
        showYou={showYou}
        showFleet={showFleet}
        userPosition={userPosition}
        fleetVessels={fleetVessels}
        map={map.current}
      />
      
      {/* GFW Legend - only when commercial vessels are shown */}
      <GFWLegend 
        showCommercial={showCommercial}
        showCommercialTracks={showCommercialTracks}
        vesselCounts={gfwVesselCounts}
      />
      
      {/* Inlet Regions (glowing boundaries for nice entry visual) */}
      {mapFullyReady && (
        <InletRegions 
          map={map.current} 
          enabled={true}  // Always show for visual appeal
          opacity={0.16}  // Same subtle glow as Analysis page
        />
      )}
      
      {/* Fleet Layer - handles live fleet vessel data */}
      {mapFullyReady && (
        <FleetLayer
          map={map.current}
          showFleet={showFleet}
          showFleetTracks={fleetTracksEnabled}
          selectedInletId={selectedInletId || ''}
          onFleetUpdate={setFleetVessels}
          onTracksUpdate={setFleetTracks}
        />
      )}
      
      
      {/* GFW Commercial Vessel Layer */}
      {mapFullyReady && (
        <GFWVesselLayer
          map={map.current}
          showCommercial={showCommercial}
          selectedInletId={selectedInletId}
          onVesselCountUpdate={setGfwVesselCounts}
          onTracksUpdate={setGfwTracks}
        />
      )}
      
      {/* Vessel Tracks Layer - handles all track rendering */}
      {mapFullyReady && (
        <VesselTracksLayer
          map={map.current}
          fleetTracks={fleetTracks}
          gfwTracks={gfwTracks}
        />
      )}
      
      {/* Chat Drawer Overlay */}
      {flags.communityDrawer && (
        <ChatDrawer
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          inletId={selectedInletId}
          userId={undefined} // TODO: Get from auth
          userName={undefined} // TODO: Get from auth
        />
      )}
      
      {/* Dev-only Restrict Toggle */}
      <RestrictToggle />
    </div>
  );
}

export default function TrackingMode() {
  return (
    <PageWithSuspense>
      <TrackingModeContent />
    </PageWithSuspense>
  );
}
