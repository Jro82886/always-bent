'use client';

import { useState, useEffect, useRef } from 'react';
import PageWithSuspense from '@/components/PageWithSuspense';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import UnifiedCommandBar from '@/components/UnifiedCommandBar';
import VesselLayer from '@/components/tracking/VesselLayer';
import UnifiedTrackingPanelLeft from '@/components/tracking/UnifiedTrackingPanelLeft';
import CompactLegend from '@/components/tracking/CompactLegend';
import NetworkStatusIndicator from '@/components/NetworkStatusIndicator';
import DepartureMonitor from '@/components/tracking/DepartureMonitor';
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
  
  // Vessel visibility states
  // Default: Show user (if location enabled) and fleet, hide tracks and network
  const [showYou, setShowYou] = useState(true); // Auto-on if location granted
  const [showFleet, setShowFleet] = useState(true); // Show if location enabled (share to see)
  const [showCommercial, setShowCommercial] = useState(false); // GFW vessels - available to all
  const [showABFINetwork, setShowABFINetwork] = useState(false); // User chooses
  const [showTracks, setShowTracks] = useState(false); // Off by default (performance)
  
  // User position state
  const [userPosition, setUserPosition] = useState<{lat: number, lng: number} | null>(null);
  const [userSpeed, setUserSpeed] = useState(0);
  const [trackingActive, setTrackingActive] = useState(false);
  const [boatName, setBoatName] = useState<string>('');
  
  // Handle position updates from VesselLayer
  const handlePositionUpdate = (position: { lat: number; lng: number; speed: number }) => {
    setUserPosition({ lat: position.lat, lng: position.lng });
    setUserSpeed(position.speed * 1.94384); // Convert m/s to knots
    setTrackingActive(true);
  };

  // Get boat name and check location permission
  useEffect(() => {
    const storedBoatName = localStorage.getItem('abfi_boat_name');
    if (storedBoatName) {
      setBoatName(storedBoatName);
    }
    
    // Check if location is enabled
    const locationPermission = localStorage.getItem('abfi_location_permission');
    if (locationPermission !== 'granted') {
      // No location = no sharing = limited features
      setShowYou(false); // Can't track without permission
      setShowFleet(false); // Can't see fleet without sharing
      setShowABFINetwork(false); // Can't see network without sharing
      setTrackingActive(false);
      setShowCommercial(true); // CAN see commercial vessels (public GFW data)
    } else {
      // Location enabled = full features
      setShowCommercial(false); // Default off when you have fleet access
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-71.4, 41.15],  // Start with default inlet (Block Island)
      zoom: 7.5,  // Good zoom for inlet to Gulf Stream view
      pitch: 0,
      bearing: 0,
      cooperativeGestures: false  // Allow normal scroll zoom
    });
    
    const mapInstance = map.current;
    
    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    
    mapInstance.on('load', () => {
      console.log('[TRACKING] Map initialized');
      
      // Set East Coast bounds to prevent getting lost
      const EAST_COAST_BOUNDS = [[-85, 23], [-64, 47]];
      mapInstance.setMaxBounds(EAST_COAST_BOUNDS as any);
      
      // Ensure map stays flat
      mapInstance.setPitch(0);
      mapInstance.setBearing(0);
      
      // Disable pitch/rotation controls
      mapInstance.dragRotate.disable();
      mapInstance.touchPitch.disable();
      
      // Fly to selected inlet with Gulf Stream view after map loads
      if (selectedInletId) {
        const inlet = getInletById(selectedInletId);
        if (inlet) {
          flyToInlet60nm(mapInstance, inlet);
          console.log(`[TRACKING] Initial fly to inlet: ${inlet.name}`);
        }
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [selectedInletId]);
  
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
  
  // Handle ABFI Network view toggle
  useEffect(() => {
    if (!map.current) return;
    
    if (showABFINetwork) {
      // Zoom out to show entire East Coast
      const EAST_COAST_BOUNDS = [[-82, 24], [-66, 45.5]];
      map.current.fitBounds(EAST_COAST_BOUNDS as any, {
        padding: { top: 50, bottom: 50, left: 50, right: 350 }, // Extra right padding for control panel
        duration: 1500
      });
    } else if (selectedInletId) {
      // Return to inlet view
      const inlet = getInletById(selectedInletId);
      if (inlet) {
        flyToInlet60nm(map.current, inlet);
      }
    }
  }, [showABFINetwork, selectedInletId]);

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
      
      {/* Tracking Panel - Left Side */}
      <UnifiedTrackingPanelLeft 
        map={map.current}
        boatName={boatName}
        selectedInletId={selectedInletId}
        setSelectedInletId={(id) => {
          // Update global state through appState
          const { setSelectedInletId } = useAppState.getState();
          setSelectedInletId(id);
        }}
        showYou={showYou}
        setShowYou={setShowYou}
        showFleet={showFleet}
        setShowFleet={setShowFleet}
        showCommercial={showCommercial}
        setShowCommercial={setShowCommercial}
        showABFINetwork={setShowABFINetwork}
        setShowABFINetwork={setShowABFINetwork}
        showTracks={showTracks}
        setShowTracks={setShowTracks}
        trackingActive={trackingActive}
        userSpeed={userSpeed}
        fleetCount={12}
      />
      
      {/* Compact Legend - Lower Left */}
      <CompactLegend inletColor={inlet?.color || '#06B6D4'} />
      
      {/* Network Status Indicator - Shows online/offline status */}
      <NetworkStatusIndicator />
      
      {/* Departure Monitor - Detects when leaving inlet and asks about internet */}
      <DepartureMonitor 
        userPosition={userPosition}
        selectedInletId={selectedInletId}
        trackingActive={trackingActive}
      />
      
      {/* Vessel Layer - Handles all vessel markers and tracks */}
      <VesselLayer
        map={map.current}
        showYou={showYou}
        showFleet={showFleet || showABFINetwork}
        showCommercial={showCommercial}
        showTracks={showTracks}
        selectedInletId={showABFINetwork ? '' : selectedInletId}
        onPositionUpdate={handlePositionUpdate}
      />
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
