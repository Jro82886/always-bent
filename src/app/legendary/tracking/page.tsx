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

// Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

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
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: inlet ? [inlet.lng!, inlet.lat!] : [-73.5, 40.5], // Default to NY area
      zoom: inlet ? inlet.zoom : 7,
      projection: 'globe' as any,
    });

    map.current.on('load', () => {
      // Configure globe
      map.current!.setFog({
        color: 'rgb(0, 0, 0)',
        'high-color': 'rgb(0, 20, 40)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(0, 0, 0)',
        'star-intensity': 0.6
      });

      setMapFullyReady(true);
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
    if (!map.current || !mapFullyReady || !inlet) return;
    
    map.current.flyTo({
      center: [inlet.lng!, inlet.lat!],
      zoom: inlet.zoom,
      duration: 2000
    });
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
      
      {/* Inlet Regions (clickable boundaries) */}
      {mapFullyReady && (
        <InletRegions map={map.current} />
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