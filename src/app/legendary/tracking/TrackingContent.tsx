'use client';

import { useState, useEffect, useRef } from 'react';
import PageWithSuspense from '@/components/PageWithSuspense';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import HeaderBar from '@/components/CommandBridge/HeaderBar';
import { useInletFromURL } from '@/hooks/useInletFromURL';
import VesselLayerClean from '@/components/tracking/VesselLayerClean';
import CommercialVesselLayer from '@/components/tracking/CommercialVesselLayer';
import RecBoatsClustering from '@/components/tracking/RecBoatsClustering';
import TrackingToolbar from '@/components/tracking/TrackingToolbar';
import TrackingLegend from '@/components/tracking/TrackingLegend';
import InletRegions from '@/components/InletRegions';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { fitInletOffshore, INLET_VIEWS } from '@/utils/inletZoom';
import { useInletRequired } from '@/components/useInletRequired';
import { useLocationRequired } from '@/components/tracking/useLocationRequired';

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
  const hasInlet = !!inlet && inlet.id !== 'overview';
  
  // Sync inlet from URL on mount
  useInletFromURL();
  
  // Location permission
  const { isGranted: locationGranted } = useLocationPermission();
  
  // Get app mode from store
  const { appMode, setAppMode } = useAppState();
  
  // Auto-switch to browse mode if location disabled in community mode
  useEffect(() => {
    if (appMode === 'community' && !locationGranted) {
      setAppMode('browse');
    } else if (appMode === 'browse' && locationGranted) {
      setAppMode('community');
    }
  }, [locationGranted, appMode, setAppMode]);
  
  // Inlet-required gating
  const { gate, InletRequiredModal } = useInletRequired(hasInlet);
  
  // Location-required gating for non-commercial features
  const { 
    gateNonCommercial, 
    LocationBanner, 
    DisabledBanner 
  } = useLocationRequired(locationGranted);
  
  // Vessel visibility states (all OFF by default per spec)
  const [showYou, setShowYou] = useState(false);
  const [showTracks, setShowTracks] = useState(false);
  const [showFleet, setShowFleet] = useState(false);
  const [showFleetTracks, setShowFleetTracks] = useState(false);
  const [showCommercial, setShowCommercial] = useState(false);
  const [showCommercialTracks, setShowCommercialTracks] = useState(false);
  
  // User position state
  const [userPosition, setUserPosition] = useState<{lat: number, lng: number, speed: number} | null>(null);
  
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
      
      // Add zoom controls (bottom-right corner like Analysis mode)
      map.current!.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
      
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

  // Remove auto-camera movement - inlet selection only updates state
  // Camera movement is now controlled by the Inlet Zoom toggle

  // Handle fly to inlet zoom
  const handleFlyToInlet = () => {
    if (!map.current || !inlet) return;
    
    const knownBbox = (INLET_VIEWS as any)[inlet.id.toUpperCase()];
    fitInletOffshore(map.current, [inlet.lng!, inlet.lat!], knownBbox);
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
        map={map.current}
        selectedInletId={selectedInletId}
        locationGranted={locationGranted}
        showYou={showYou}
        setShowYou={gate(gateNonCommercial(setShowYou))}
        showTracks={showTracks}
        setShowTracks={gate(gateNonCommercial(setShowTracks))}
        showFleet={showFleet}
        setShowFleet={gate(gateNonCommercial(setShowFleet))}
        showFleetTracks={showFleetTracks}
        setShowFleetTracks={gate(gateNonCommercial(setShowFleetTracks))}
        showCommercial={showCommercial}
        setShowCommercial={setShowCommercial} // Commercial not gated by location
        showCommercialTracks={showCommercialTracks}
        setShowCommercialTracks={setShowCommercialTracks} // Commercial not gated by location
        userPosition={userPosition}
        onFlyToInlet={gate(handleFlyToInlet)}
      />
      
      {/* Right Legend - always visible */}
      <TrackingLegend 
        selectedInletId={selectedInletId}
      />
      
      {/* Inlet Regions (glowing boundaries for nice entry visual) */}
      {mapFullyReady && (
        <InletRegions 
          map={map.current} 
          enabled={true}  // Always show for visual appeal
          opacity={0.16}  // Same subtle glow as Analysis page
        />
      )}
      
      {/* Rec Boats Clustering - only show if location enabled */}
      {mapFullyReady && locationGranted && (
        <RecBoatsClustering
          map={map.current}
          showFleet={showFleet}
          selectedInletId={selectedInletId}
        />
      )}
      
      {/* Vessel Layer - only show if location enabled */}
      {mapFullyReady && locationGranted && (
        <VesselLayerClean
          map={map.current}
          showYou={showYou}
          showFleet={showFleet}
          showTracks={showTracks}
          showFleetTracks={showFleetTracks}
          selectedInletId={selectedInletId || ''}
          onPositionUpdate={handlePositionUpdate}
        />
      )}
      
      {/* Commercial Vessel Layer */}
      {mapFullyReady && showCommercial && (
        <CommercialVesselLayer
          map={map.current}
          showCommercial={showCommercial}
          showTracks={showCommercialTracks}
          selectedInletId={selectedInletId || ''}
        />
      )}
      
      {/* Inlet Required Modal */}
      <InletRequiredModal />
      
      {/* Location Banners */}
      <LocationBanner />
      <DisabledBanner />
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
