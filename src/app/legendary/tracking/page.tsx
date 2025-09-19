'use client';

import { useState, useEffect, useRef } from 'react';
import PageWithSuspense from '@/components/PageWithSuspense';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import UnifiedCommandBar from '@/components/UnifiedCommandBar';
import VesselLayer from '@/components/tracking/VesselLayer';
import CommercialVesselLayer from '@/components/tracking/CommercialVesselLayer';
import UnifiedTrackingPanelLeft from '@/components/tracking/UnifiedTrackingPanelLeft';
import CompactLegend from '@/components/tracking/CompactLegend';
import DepartureMonitor from '@/components/tracking/DepartureMonitor';
import InletRegions from '@/components/InletRegions';
import TrackingErrorBoundary from '@/components/tracking/TrackingErrorBoundary';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';

// Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function TrackingModeContent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [activeTab, setActiveTab] = useState('tracking');
  const [mapFullyReady, setMapFullyReady] = useState(false);
  
  // Get selected inlet from global state
  const { selectedInletId } = useAppState();
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;
  
  // Vessel visibility states
  // Enable key tracking features by default for better user experience
  const [showYou, setShowYou] = useState(false); // OFF by default - saves electricity!
  const [showFleet, setShowFleet] = useState(false); // OFF by default - user turns on when needed
  const [showCommercial, setShowCommercial] = useState(false); // OFF by default - conserve resources
  const [showTracks, setShowTracks] = useState(false); // OFF by default - like lights at night
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  
  // User position state
  const [userPosition, setUserPosition] = useState<{lat: number, lng: number} | null>(null);
  const [userSpeed, setUserSpeed] = useState(0);
  const [trackingActive, setTrackingActive] = useState(false);
  const [captainName, setCaptainName] = useState<string>('');
  const [boatName, setBoatName] = useState<string>('');
  
  // Handle position updates from VesselLayer
  const handlePositionUpdate = (position: { lat: number; lng: number; speed: number }) => {
    setUserPosition({ lat: position.lat, lng: position.lng });
    setUserSpeed(position.speed * 1.94384); // Convert m/s to knots
    setTrackingActive(true);
    
    // Inlet Contract vFinal: never auto-select inlet from GPS
  };

  // Get captain and boat names and check location permission
  useEffect(() => {
    const storedCaptainName = localStorage.getItem('abfi_captain_name');
    const storedBoatName = localStorage.getItem('abfi_boat_name');
    if (storedCaptainName) {
      setCaptainName(storedCaptainName);
    }
    if (storedBoatName) {
      setBoatName(storedBoatName);
    }
    
    // Check if location is enabled from welcome screen
    const locationPermission = localStorage.getItem('abfi_location_permission');
    if (locationPermission === 'granted') {
      setLocationPermissionGranted(true);
      // Location is granted but DON'T auto-show anything
      // User must explicitly click to display their location
    } else {
      setLocationPermissionGranted(false);
      // No location = no tracking features available
    }
    
    // Everything stays OFF until user explicitly enables
    // This prevents the map from being overwhelmed on load
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove any lingering toasts
      const toast = document.getElementById('auto-select-toast');
      if (toast) {
        toast.remove();
      }
    };
  }, []);
  
  // Initialize map with cleanup
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Clean up any existing map instances first
    const existingCanvas = mapContainer.current.querySelector('.mapboxgl-canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-74, 38.5],  // East Coast overview center
      zoom: 5.5,  // Wide view of East Coast
      pitch: 0,
      bearing: 0,
      cooperativeGestures: false  // Allow normal scroll zoom
    });
    
    const mapInstance = map.current;
    
    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    
    mapInstance.on('load', () => {
      
      
      // Set East Coast bounds to prevent getting lost
      const EAST_COAST_BOUNDS = [[-85, 23], [-64, 47]];
      mapInstance.setMaxBounds(EAST_COAST_BOUNDS as any);
      
      // Ensure map stays flat
      mapInstance.setPitch(0);
      mapInstance.setBearing(0);
      
      // Disable pitch/rotation controls
      mapInstance.dragRotate.disable();
      mapInstance.touchPitch.disable();
      
      // Mark map as fully ready after a brief delay to ensure all internal setup is complete
      setTimeout(() => {
        setMapFullyReady(true);
        
      }, 500);
    });

    return () => {
      setMapFullyReady(false);
      try {
        if (map.current) {
          // Remove the map (this also removes all event listeners)
          map.current.remove();
          map.current = null;
        }
      } catch (error) {
        console.error('Error cleaning up map:', error);
      }
    };
  }, []);
  
  // Watch for inlet changes and fly to selected inlet with Gulf Stream view
  useEffect(() => {
    if (!map.current || !selectedInletId || !mapFullyReady) return;
    
    const inlet = getInletById(selectedInletId);
    if (inlet) {
      // Only fly to inlet if map is ready and stable
      map.current.once('moveend', () => {
        
      });
      
      // No camera moves on inlet change per spec
      
    }
  }, [selectedInletId, mapFullyReady]);
  
  // Handle ABFI Network view toggle
  useEffect(() => {
    if (!map.current) return;
    
    // No camera moves on inlet change per spec
  }, [selectedInletId]);

  // Check if tracking is ready (inlet selected)
  const isTrackingReady = selectedInletId && selectedInletId !== 'overview';

  return (
    <div className="w-full h-screen relative">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Inlet Selection Prompt */}
      {!isTrackingReady && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-400/30 rounded-lg px-6 py-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-sm font-medium text-yellow-300">
                📍 Select an inlet in Command Bridge to begin tracking
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Unified Command Bar - Navigation + Boat Info + Inlet Selector */}
      <UnifiedCommandBar 
        map={map.current} 
        activeTab="tracking"
        onTabChange={() => {}}
      />
      
      {/* Tracking Panel - Left Side */}
      <UnifiedTrackingPanelLeft 
        map={map.current}
        captainName={captainName}
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
        showTracks={showTracks}
        setShowTracks={setShowTracks}
        trackingActive={trackingActive}
        userSpeed={userSpeed}
        fleetCount={12}
        locationPermissionGranted={locationPermissionGranted}
      />
      
      {/* Compact Legend - Lower Left */}
      <CompactLegend 
        inletColor={inlet?.color || '#06B6D4'}
        inletName={inlet?.name || 'Inlet'}
        showYou={showYou}
        showFleet={showFleet}
        showCommercial={showCommercial}
        showTracks={showTracks}
      />
      
      
      {/* Only render map-dependent components when map is fully ready */}
      {mapFullyReady && (
        <>
          {/* Inlet Regions - Glowing boundaries showing where location becomes visible */}
          {map.current && (
            <InletRegions 
              map={map.current} 
              enabled={true} 
              opacity={0.2}  // Subtle glow for tracking mode
            />
          )}
          
          {/* Departure Monitor - Detects when leaving inlet and asks about internet */}
          <DepartureMonitor 
            userPosition={userPosition}
            selectedInletId={selectedInletId}
            trackingActive={trackingActive}
          />
          
          {/* Vessel Layer - Handles all vessel markers and tracks */}
          {map.current && (
            <VesselLayer
              map={map.current}
              showYou={showYou}
              showFleet={showFleet}
              showCommercial={false} // Commercial vessels now handled separately
              showTracks={showTracks}
              selectedInletId={selectedInletId}
              onPositionUpdate={handlePositionUpdate}
            />
          )}
          
          {/* Commercial Vessel Layer - GFW data with ABFI branding */}
          {map.current && (
            <CommercialVesselLayer
              map={map.current}
              showCommercial={showCommercial}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <PageWithSuspense>
      <TrackingErrorBoundary>
        <TrackingModeContent />
      </TrackingErrorBoundary>
    </PageWithSuspense>
  );
}
