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
import NetworkStatusIndicator from '@/components/NetworkStatusIndicator';
import DepartureMonitor from '@/components/tracking/DepartureMonitor';
import InletRegions from '@/components/InletRegions';
import TrackingErrorBoundary from '@/components/tracking/TrackingErrorBoundary';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import { flyToInlet60nm } from '@/lib/inletBounds';
import { autoSelectInlet } from '@/lib/findClosestInlet';

// Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function TrackingModeContent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [activeTab, setActiveTab] = useState('tracking');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mapFullyReady, setMapFullyReady] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  
  // Get selected inlet from global state
  const { selectedInletId } = useAppState();
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;
  
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
    
    // Only auto-select inlet once, and only if map is ready
    if (!hasAutoSelected && mapFullyReady && !selectedInletId) {
      const autoSelect = autoSelectInlet(
        { lat: position.lat, lng: position.lng },
        selectedInletId
      );
      
      if (autoSelect.shouldAutoSelect && autoSelect.inlet) {
        console.log(`[AUTO-SELECT] Selecting closest inlet: ${autoSelect.inlet.name} (${autoSelect.distance?.toFixed(1)}mi away)`);
      
      // Update global state
      const { setSelectedInletId } = useAppState.getState();
      setSelectedInletId(autoSelect.inlet.id);
      
      // Show notification
      const toastId = 'auto-select-toast';
      // Remove any existing toast first
      const existingToast = document.getElementById(toastId);
      if (existingToast) {
        existingToast.remove();
      }
      
      const toast = document.createElement('div');
      toast.id = toastId;
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-down';
      toast.innerHTML = `
        <div class="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg px-6 py-4 shadow-2xl">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div>
              <div class="text-white font-semibold">Auto-Selected Inlet</div>
              <div class="text-gray-400 text-sm mt-1">Using ${autoSelect.inlet.name} as your home waters (closest to you)</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      
      // Add animation style if needed
      if (!document.getElementById('slide-down-animation')) {
        const style = document.createElement('style');
        style.id = 'slide-down-animation';
        style.textContent = `
          @keyframes slide-down {
            from { transform: translate(-50%, -100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
          }
          .animate-slide-down {
            animation: slide-down 0.3s ease-out;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Clear any existing timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      
      toastTimeoutRef.current =       setTimeout(() => {
        // Safely remove toast if it still exists
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
          toastElement.remove();
        }
        toastTimeoutRef.current = null;
      }, 5000);
      
      // Mark that we've auto-selected
      setHasAutoSelected(true);
      
      // Don't auto-fly anymore - let the inlet change effect handle it
    }
    }
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending toast timeouts
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
      // Remove any lingering toasts
      const toast = document.getElementById('auto-select-toast');
      if (toast) {
        toast.remove();
      }
    };
  }, []);
  
  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

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
      console.log('[TRACKING] Map initialized - East Coast overview');
      
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
        console.log('[TRACKING] Map fully ready for components');
      }, 500);
    });

    return () => {
      setMapFullyReady(false);
      map.current?.remove();
    };
  }, []);
  
  // Watch for inlet changes and fly to selected inlet with Gulf Stream view
  useEffect(() => {
    if (!map.current || !selectedInletId || !mapFullyReady) return;
    
    const inlet = getInletById(selectedInletId);
    if (inlet) {
      // Only fly to inlet if map is ready and stable
      map.current.once('moveend', () => {
        console.log(`[TRACKING] Arrived at inlet: ${inlet.name}`);
      });
      
      // Use proper Gulf Stream view for each inlet
      flyToInlet60nm(map.current, inlet);
      console.log(`[TRACKING] Flying to inlet with Gulf Stream view: ${inlet.name}`);
    }
  }, [selectedInletId, mapFullyReady]);
  
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
        showABFINetwork={showABFINetwork}
        setShowABFINetwork={setShowABFINetwork}
        showTracks={showTracks}
        setShowTracks={setShowTracks}
        trackingActive={trackingActive}
        userSpeed={userSpeed}
        fleetCount={12}
      />
      
      {/* Compact Legend - Lower Left */}
      <CompactLegend 
        inletColor={inlet?.color || '#06B6D4'}
        showYou={showYou}
        showFleet={showFleet}
        showCommercial={showCommercial}
        showABFINetwork={showABFINetwork}
        showTracks={showTracks}
      />
      
      {/* Network Status Indicator - Shows online/offline status */}
      <NetworkStatusIndicator />
      
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
              showFleet={showFleet || showABFINetwork}
              showCommercial={false} // Commercial vessels now handled separately
              showTracks={showTracks}
              selectedInletId={showABFINetwork ? '' : selectedInletId}
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
