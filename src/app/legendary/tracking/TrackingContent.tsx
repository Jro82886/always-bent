'use client';

import { useState, useEffect, useRef } from 'react';
import PageWithSuspense from '@/components/PageWithSuspense';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import HeaderBar from '@/components/CommandBridge/HeaderBar';
import { useInletFromURL } from '@/hooks/useInletFromURL';
import VesselLayerClean from '@/components/tracking/VesselLayerClean';
import CommercialVesselLayer from '@/components/tracking/CommercialVesselLayer';
import TrackingToolbar from '@/components/tracking/TrackingToolbar';
import TrackingLegend from '@/components/tracking/TrackingLegend';
import InletRegions from '@/components/InletRegions';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import { useLocationPermission } from '@/hooks/useLocationPermission';

// Mapbox token will be set in useEffect to avoid SSR issues

// East Coast bounding box for overview
const EAST_COAST_BOUNDS = [
  [-82.0, 24.0], // SW corner (Florida Keys / Gulf side buffer)
  [-65.0, 45.0], // NE corner (Maine + offshore buffer)
] as [[number, number], [number, number]];

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
  
  // Initialize map
  useEffect(() => {
    console.log('Map init effect running');
    console.log('- map.current exists:', !!map.current);
    console.log('- mapContainer.current exists:', !!mapContainer.current);
    
    if (map.current || !mapContainer.current) return;

    // Set Mapbox token here to avoid SSR issues
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    console.log('Mapbox token:', token ? `${token.slice(0, 10)}...` : 'MISSING');
    mapboxgl.accessToken = token;

    console.log('Creating new map instance...');
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe' as any,
    });

    map.current.on('load', () => {
      console.log('Map Loaded - Tracking Mode');
      
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
        console.log('Flying to inlet:', inlet.name, [inlet.lng, inlet.lat]);
        // Zoom to specific inlet
        map.current!.flyTo({
          center: [inlet.lng!, inlet.lat!],
          zoom: inlet.zoom,
          duration: 1500
        });
      } else {
        console.log('Fitting to East Coast bounds');
        // Show East Coast overview
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
      // Don't break the UI - map should still be interactive
      if (e.error?.status === 401) {
        console.error('Mapbox token invalid - check NEXT_PUBLIC_MAPBOX_TOKEN');
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapFullyReady(false);
      }
    };
  }, [inlet]);

  // Update map view when inlet changes
  useEffect(() => {
    if (!map.current || !mapFullyReady) return;
    
    if (inlet) {
      // Zoom to specific inlet
      map.current.flyTo({
        center: [inlet.lng!, inlet.lat!],
        zoom: inlet.zoom,
        duration: 2000
      });
    } else {
      // Return to East Coast overview
      map.current.fitBounds(EAST_COAST_BOUNDS, {
        padding: 40,
        duration: 2000
      });
    }
  }, [inlet, mapFullyReady]);

  // Handle fly to inlet zoom
  const handleFlyToInlet = () => {
    if (!map.current || !inlet) return;
    
    map.current.flyTo({
      center: [inlet.lng!, inlet.lat!],
      zoom: inlet.zoom,
      duration: 2000
    });
  };

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Command Bridge - inlet selector only */}
      <HeaderBar 
        showInletSelector={true}
        showWeather={false}
        showChat={false}
      />
      
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Left Toolbar */}
      <TrackingToolbar
        selectedInletId={selectedInletId}
        locationGranted={locationGranted}
        showYou={showYou}
        setShowYou={setShowYou}
        showTracks={showTracks}
        setShowTracks={setShowTracks}
        showFleet={showFleet}
        setShowFleet={setShowFleet}
        showFleetTracks={showFleetTracks}
        setShowFleetTracks={setShowFleetTracks}
        showCommercial={showCommercial}
        setShowCommercial={setShowCommercial}
        showCommercialTracks={showCommercialTracks}
        setShowCommercialTracks={setShowCommercialTracks}
        userPosition={userPosition}
        onFlyToInlet={handleFlyToInlet}
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
      
      {/* Vessel Layer */}
      {mapFullyReady && (
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
