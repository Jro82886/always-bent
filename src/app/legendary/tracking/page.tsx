'use client';

import { useState, useEffect, useRef } from 'react';
import PageWithSuspense from '@/components/PageWithSuspense';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import UnifiedCommandBar from '@/components/UnifiedCommandBar';
import VesselLayer from '@/components/tracking/VesselLayer';
import TrackingLegend from '@/components/tracking/TrackingLegend';
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
      
      {/* Tracking Mode UI */}
      
      {/* Modern Tracking Legend */}
      <TrackingLegend
        boatName={boatName}
        selectedInletId={selectedInletId}
        showYou={showYou}
        showFleet={showFleet}
        showABFINetwork={showABFINetwork}
        showTracks={showTracks}
        trackingActive={trackingActive}
        fleetCount={12}
      />
      
      {/* Right Side - Compact Control Panel */}
      <div className="absolute right-4 bottom-20 z-10 w-56">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-lg border border-cyan-500/20 p-3">
          <h3 className="text-cyan-400 font-semibold text-xs mb-3 uppercase tracking-wider">Quick Controls</h3>
          
          {/* Toggle Controls */}
          <div className="space-y-3">
            {/* You Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(0,221,235,0.8)]" />
                <span className="text-cyan-100 text-sm">Your Position</span>
              </div>
              <button 
                onClick={() => setShowYou(!showYou)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  showYou ? 'bg-cyan-600' : 'bg-slate-700'
                } hover:bg-slate-600`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  showYou ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            {/* Fleet Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-cyan-100 text-sm">ABFI Fleet</span>
              </div>
              <button 
                onClick={() => setShowFleet(!showFleet)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  showFleet ? 'bg-cyan-600' : 'bg-slate-700'
                } hover:bg-slate-600`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  showFleet ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            {/* ABFI Network Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400" />
                <span className="text-cyan-100 text-sm">ABFI Network</span>
              </div>
              <button 
                onClick={() => setShowABFINetwork(!showABFINetwork)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  showABFINetwork ? 'bg-cyan-600' : 'bg-slate-700'
                } hover:bg-slate-600`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  showABFINetwork ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-cyan-500/20 my-4" />
          
          {/* Status Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-400/70">Tracking Status</span>
              <span className={trackingActive ? 'text-green-400' : 'text-yellow-400'}>
                {trackingActive ? 'ACTIVE' : 'WAITING FOR GPS'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-400/70">Fleet Visible</span>
              <span className="text-cyan-300">12 vessels</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-400/70">Your Speed</span>
              <span className="text-cyan-300">{userSpeed.toFixed(1)} kts</span>
            </div>
          </div>
          
          {/* Advanced Options */}
          <div className="mt-4 pt-4 border-t border-cyan-500/20">
            <button className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-colors">
              Show Vessel Tracks (4hr)
            </button>
          </div>
        </div>
      </div>
      
      
      {/* Vessel Layer - Handles all vessel markers and tracks */}
      <VesselLayer
        map={map.current}
        showYou={showYou}
        showFleet={showFleet || showABFINetwork}
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
