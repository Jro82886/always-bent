'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { getInletById } from '@/lib/inlets';
import { shouldEnableTracking, getTrackingStatus } from '@/lib/tracking/landDetection';
import { landGuardCheck, oncePerSession } from '@/lib/tracking/landGuard';
import { supabase } from '@/lib/supabaseClient';

interface VesselLayerProps {
  map: mapboxgl.Map | null;
  showYou: boolean;
  showFleet: boolean;
  showCommercial?: boolean;
  showTracks: boolean;
  selectedInletId: string;
  onPositionUpdate?: (position: { lat: number; lng: number; speed: number }) => void;
}

// Mock fleet data for MVP - will be replaced with real API
const MOCK_FLEET = [
  { id: 'vessel-1', lat: 41.15, lng: -71.35, inlet: 'ri-block-island', name: 'Sea Hunter' },
  { id: 'vessel-2', lat: 41.18, lng: -71.38, inlet: 'ri-block-island', name: 'Blue Wave' },
  { id: 'vessel-3', lat: 40.95, lng: -72.10, inlet: 'ny-montauk', name: 'Fish Finder' },
  { id: 'vessel-4', lat: 40.92, lng: -72.05, inlet: 'ny-montauk', name: 'Deep Blue' },
  { id: 'vessel-5', lat: 41.65, lng: -70.60, inlet: 'ma-cape-cod', name: 'Cape Runner' },
  { id: 'vessel-6', lat: 41.70, lng: -70.55, inlet: 'ma-cape-cod', name: 'Cod Father' },
  { id: 'vessel-7', lat: 41.25, lng: -70.05, inlet: 'ma-nantucket', name: 'Island Time' },
  { id: 'vessel-8', lat: 39.35, lng: -74.42, inlet: 'nj-atlantic-city', name: 'Jersey Devil' },
  { id: 'vessel-9', lat: 35.25, lng: -75.52, inlet: 'nc-hatteras', name: 'Outer Banks' },
  { id: 'vessel-10', lat: 32.78, lng: -79.93, inlet: 'sc-charleston', name: 'Palmetto Pride' },
];

// Mock GFW commercial vessels - public data available to all
const MOCK_COMMERCIAL = [
  { id: 'gfw-1', lat: 40.85, lng: -71.95, name: 'Commercial Trawler 1', type: 'Trawler', length: 85 },
  { id: 'gfw-2', lat: 41.05, lng: -71.65, name: 'Long Liner Alpha', type: 'Longliner', length: 120 },
  { id: 'gfw-3', lat: 40.75, lng: -72.25, name: 'Factory Ship Delta', type: 'Factory', length: 200 },
  { id: 'gfw-4', lat: 39.45, lng: -74.15, name: 'Seine Vessel 22', type: 'Purse Seine', length: 95 },
  { id: 'gfw-5', lat: 35.15, lng: -75.35, name: 'Dragger NC-45', type: 'Dragger', length: 75 },
];

// Mock track data (last 4 hours of positions)
const generateTrack = (currentLat: number, currentLng: number, points: number = 20) => {
  const track = [];
  for (let i = 0; i < points; i++) {
    track.push([
      currentLng - (i * 0.01), // Move west over time
      currentLat - (i * 0.005 * Math.sin(i * 0.5)) // Slight wave pattern
    ]);
  }
  return track;
};

export default function VesselLayer({ 
  map, 
  showYou, 
  showFleet, 
  showTracks,
  selectedInletId,
  onPositionUpdate 
}: VesselLayerProps) {
  const [userPosition, setUserPosition] = useState<GeolocationPosition | null>(null);
  const [wasVisibleLastCheck, setWasVisibleLastCheck] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const fleetMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const trackSourceRef = useRef<boolean>(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Show tracking status toast
  const showTrackingToast = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    // Remove existing toast if any
    const existingToast = document.getElementById('tracking-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.id = 'tracking-toast';
    toast.className = `fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] px-4 py-2 rounded-lg shadow-lg animate-slide-down ${
      type === 'success' ? 'bg-green-500/90 text-white' :
      type === 'warning' ? 'bg-orange-500/90 text-white' :
      'bg-blue-500/90 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  // Start GPS tracking ONLY when user explicitly enables it
  useEffect(() => {
    if (!map || !showYou) return; // Don't track unless explicitly shown

    const startTracking = () => {
      // Check if location permission is granted
      const locationPermission = localStorage.getItem('abfi_location_permission');
      if (locationPermission !== 'granted') {
        
        return;
      }
      
      if ('geolocation' in navigator) {
        // Get initial position
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Check if user is offshore
            const trackingDecision = shouldEnableTracking(lat, lng);
            
            if (trackingDecision.enabled) {
              setUserPosition(position);
              
              // Save position to Supabase for user tracks
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const captainName = localStorage.getItem('abfi_captain_name') || 'Captain';
                  const boatName = localStorage.getItem('abfi_boat_name') || 'Vessel';
                  
                  await supabase.from('vessel_tracks').insert({
                    user_id: user.id,
                    captain_name: captainName,
                    boat_name: boatName,
                    lat,
                    lng,
                    speed: position.coords.speed || 0,
                    heading: position.coords.heading || 0,
                    timestamp: new Date().toISOString()
                  });
                }
              } catch (error) {
                console.error('Failed to save track:', error);
              }
              
              if (onPositionUpdate) {
                onPositionUpdate({
                  lat,
                  lng,
                  speed: position.coords.speed || 0
                });
              }
              
              // Show tracking status
              showTrackingToast(getTrackingStatus(lat, lng), 'success');
            } else {
              // User is on land - disable tracking
              console.log(trackingDecision.reason);
              showTrackingToast(trackingDecision.reason, 'warning');
            }
          },
          (error) => {
            
            // Use a default position if geolocation fails (e.g., Montauk)
            const mockPosition = {
              coords: {
                latitude: 40.95,
                longitude: -72.08,
                speed: 0,
                accuracy: 100,
                altitude: null,
                altitudeAccuracy: null,
                heading: null
              },
              timestamp: Date.now()
            } as GeolocationPosition;
            setUserPosition(mockPosition);
          }
        );

        // Watch position for updates
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (position) => {
            setUserPosition(position);
            if (onPositionUpdate) {
              onPositionUpdate({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                speed: position.coords.speed || 0
              });
            }
            
            // Save position to database
            try {
              const captainName = localStorage.getItem('abfi_captain_name') || 'Anonymous';
              const boatName = localStorage.getItem('abfi_boat_name') || 'Unknown Vessel';
              const userId = `${captainName}_${boatName}`.toLowerCase().replace(/\s+/g, '_');
              
              await fetch('/api/tracking/position', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: userId,
                  username: `${captainName} (${boatName})`,
                  inlet_id: selectedInletId || 'md-ocean-city',
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  speed: position.coords.speed ? position.coords.speed * 1.94384 : 0, // Convert m/s to knots
                  heading: position.coords.heading || null,
                  session_id: `session_${Date.now()}`
                })
              });
              
            } catch (error) {
              
            }
          },
          (error) => {
            // Geolocation error handled
          },
          {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
          }
        );
      }
    };

    startTracking();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [map, showYou, onPositionUpdate]); // Added showYou dependency

  // Render user marker - ONLY controlled by showYou
  useEffect(() => {
    if (!map) return;
    
    // Clean up marker if we shouldn't show it
    if (!userPosition || !showYou) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }
    
    // Ensure map is fully loaded before creating markers
    if (!map.loaded()) {
      const handleLoad = () => {
        // Map is now loaded, re-run this effect
      };
      map.once('load', handleLoad);
      return;
    }

    // If marker already exists and position hasn't changed significantly, just update it
    if (userMarkerRef.current) {
      const currentLngLat = userMarkerRef.current.getLngLat();
      const distance = Math.sqrt(
        Math.pow(currentLngLat.lng - userPosition.coords.longitude, 2) +
        Math.pow(currentLngLat.lat - userPosition.coords.latitude, 2)
      );
      
      // Only update if moved more than 0.0001 degrees (about 11 meters)
      if (distance > 0.0001) {
        // Update existing marker position
        userMarkerRef.current.setLngLat([userPosition.coords.longitude, userPosition.coords.latitude]);
      }
      
      // Continue to check visibility even with existing marker
      // Don't return here - we need to check if visibility changed
    }

    // Land Guard implementation per MVP Contract
    const isWithinInletBounds = () => {
      
      const lat = userPosition.coords.latitude;
      const lng = userPosition.coords.longitude;
      
      // Primary check: Must be east of coastline (over water)
      // On East Coast, this is roughly -76 to -75 longitude depending on latitude
      const coastlineLng = lat > 40 ? -75.5 : // Northern states
                          lat > 35 ? -76 :   // Mid-Atlantic
                          -80.5;              // Southern states
      
      if (lng > coastlineLng) {
        // Vessel on land, hiding from map
        return false;
      }
      
      // Secondary check: Must be within inlet glow radius (where the color shows)
      // This matches the visual inlet regions - about 30-40 miles from inlet center
      if (selectedInletId && selectedInletId !== 'overview') {
        const inlet = getInletById(selectedInletId);
        if (inlet) {
          const [inletLng, inletLat] = inlet.center;
          // Calculate distance using haversine formula
          const R = 3959; // Earth radius in miles
          const dLat = (lat - inletLat) * Math.PI / 180;
          const dLon = (lng - inletLng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(inletLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          // Must be within 10 miles of inlet (typical cell service range)
          // Beyond this, users lose cell service and need offline mode anyway
          if (distance > 10) {
            // Vessel too far from inlet, beyond cell range
            return false;
          }
        }
      }
      
      return true;
    };

    // Land Guard implementation per MVP Contract
    const inlet = selectedInletId ? getInletById(selectedInletId) : null;
    const landGuard = landGuardCheck(
      { lat: userPosition.coords.latitude, lng: userPosition.coords.longitude },
      inlet
    );

    const isVisible = showYou && landGuard.showMarker;
    
    // Show once-per-session toast if on land outside inlet
    if (!landGuard.showMarker && landGuard.reason && showYou) {
      oncePerSession('land-guard', () => {
        // Create a small toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2 shadow-lg';
        toast.innerHTML = `
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span class="text-sm text-gray-300">${landGuard.reason}</span>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transition = 'opacity 0.3s';
          setTimeout(() => toast.remove(), 300);
        }, 4000);
      });
    }
    
    // Show notification when entering/leaving inlet bounds
    if (isVisible && !wasVisibleLastCheck) {
      // Just became visible - entered inlet bounds
      setWasVisibleLastCheck(true);
      
      const inlet = getInletById(selectedInletId);
      const toastId = 'vessel-visibility-toast';
      
      // Remove any existing toast first
      const existingToast = document.getElementById(toastId);
      if (existingToast) {
        existingToast.remove();
      }
      
      const toast = document.createElement('div');
      toast.id = toastId;
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-down';
      toast.innerHTML = `
        <div class="bg-slate-900/95 backdrop-blur-xl border border-green-500/30 rounded-lg px-6 py-4 shadow-2xl">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div>
              <div class="text-white font-semibold">Location Now Visible</div>
              <div class="text-gray-400 text-sm mt-1">You're at ${inlet?.name || 'the inlet'} - fleet can see you</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      
      // Clear any existing timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      
      toastTimeoutRef.current = setTimeout(() => {
        // Safely remove toast if it still exists
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
          toastElement.remove();
        }
        toastTimeoutRef.current = null;
      }, 4000);
      
    } else if (!isVisible && wasVisibleLastCheck && showYou) {
      // Just became invisible - left inlet bounds
      setWasVisibleLastCheck(false);
      
      const toastId = 'vessel-visibility-toast';
      
      // Remove any existing toast first
      const existingToast = document.getElementById(toastId);
      if (existingToast) {
        existingToast.remove();
      }
      
      const toast = document.createElement('div');
      toast.id = toastId;
      toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-down';
      toast.innerHTML = `
        <div class="bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 rounded-lg px-6 py-4 shadow-2xl">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
              </svg>
            </div>
            <div>
              <div class="text-white font-semibold">Location Hidden</div>
              <div class="text-gray-400 text-sm mt-1">You're on land - position private</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      
      // Clear any existing timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      
      toastTimeoutRef.current = setTimeout(() => {
        // Safely remove toast if it still exists
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
          toastElement.remove();
        }
        toastTimeoutRef.current = null;
      }, 4000);
    }
    
    if (isVisible && !userMarkerRef.current) {
      // Only create marker if we don't have one already
      // Create custom marker element with enhanced glow
      const el = document.createElement('div');
      el.className = 'user-vessel-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.position = 'relative';
      el.style.overflow = 'visible';  // Ensure glow doesn't get clipped
      el.innerHTML = `
        <div style="
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          box-shadow: 
            0 0 20px rgba(0, 255, 255, 0.8),
            0 0 40px rgba(0, 221, 235, 0.6),
            inset 0 0 10px rgba(0, 255, 255, 0.5);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
        ">
        </div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 30px;
          height: 30px;
          transform: translate(-50%, -50%);
          border: 2px solid rgba(0, 255, 255, 0.5);
          border-radius: 50%;
          animation: pulse-ring 2s infinite;
          pointer-events: none;
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(0, 255, 255, 0.2) 0%, transparent 60%);
          animation: glow-pulse 2s infinite;
          pointer-events: none;
        "></div>
      `;

      // Add enhanced animations
      if (!document.getElementById('user-vessel-animations')) {
        const style = document.createElement('style');
        style.id = 'user-vessel-animations';
        style.textContent = `
          @keyframes pulse-ring {
            0% { 
              transform: translate(-50%, -50%) scale(1); 
              opacity: 1;
              border-color: rgba(0, 255, 255, 0.6);
            }
            50% { 
              transform: translate(-50%, -50%) scale(1.3); 
              opacity: 0.3;
              border-color: rgba(0, 255, 255, 0.8);
            }
            100% { 
              transform: translate(-50%, -50%) scale(1); 
              opacity: 1;
              border-color: rgba(0, 255, 255, 0.6);
            }
          }
          @keyframes glow-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }

      // Create marker with safety check
      try {
        const marker = new mapboxgl.Marker(el)
          .setLngLat([userPosition.coords.longitude, userPosition.coords.latitude])
          .addTo(map);
        
        userMarkerRef.current = marker;
      } catch (error) {
        
        return;
      }
    } else if (!isVisible && userMarkerRef.current) {
      // Remove marker if it should no longer be visible
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      // Clean up any pending toast timeouts
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
      // Remove any lingering toasts
      const toast = document.getElementById('vessel-visibility-toast');
      if (toast) {
        toast.remove();
      }
    };
  }, [map, userPosition, showYou, selectedInletId, wasVisibleLastCheck]);

  // Render fleet markers ONLY when explicitly enabled AND inlet selected
  useEffect(() => {
    if (!map) return;
    
    // Clear existing fleet markers first
    fleetMarkersRef.current.forEach(marker => marker.remove());
    fleetMarkersRef.current.clear();
    
    // Don't proceed unless fleet is explicitly shown
    if (!showFleet) return;
    
    // CRITICAL: Don't fetch fleet if overview mode or no inlet selected
    if (!selectedInletId || selectedInletId === 'overview') {
      
      return;
    }
    
    // Ensure map is fully loaded before creating markers
    if (!map.loaded()) {
      const handleLoad = () => {
        // Map is now loaded, markers can be safely added
      };
      map.once('load', handleLoad);
      return;
    }
    
    // Fetch real fleet positions from database
    const fetchFleetPositions = async () => {
        try {
          const inletParam = selectedInletId || 'md-ocean-city';
          const response = await fetch(`/api/tracking/position?inlet_id=${inletParam}&hours=1`);
          
          // Check if response is ok before parsing
          if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success && data.vessels && Array.isArray(data.vessels)) {
            // Track which vessels we've seen this update
            const seenVesselIds = new Set<string>();
            
            // Get current user ID to avoid showing self
            const captainName = localStorage.getItem('abfi_captain_name') || 'Anonymous';
            const boatName = localStorage.getItem('abfi_boat_name') || 'Unknown Vessel';
            const currentUserId = `${captainName}_${boatName}`.toLowerCase().replace(/\s+/g, '_');
            
            // Render each vessel
            data.vessels.forEach((vessel: any) => {
              // Skip if no vessel data
              if (!vessel) return;
              
              // Skip current user
              if (vessel.user_id === currentUserId) return;
              
              // Only show vessels with recent positions (last 5 minutes)
              if (!vessel.latest) return;
              
              try {
                const lastSeen = new Date(vessel.latest.timestamp);
                const minutesAgo = (Date.now() - lastSeen.getTime()) / 60000;
                if (minutesAgo > 5) return;
                
                const inlet = getInletById(vessel.inlet_id || 'md-ocean-city');
                const color = inlet?.color || '#00DDEB';
                
                // Validate coordinates
                if (!vessel.latest.lng || !vessel.latest.lat) return;
                
                // Create marker element
                const el = document.createElement('div');
                el.className = 'fleet-vessel-marker';
                el.style.cssText = `
                  width: 24px;
                  height: 24px;
                  position: relative;
                  cursor: pointer;
                `;
                
                // Different style if vessel is moving vs stationary
                const isMoving = vessel.latest.speed && vessel.latest.speed > 2;
                
                el.innerHTML = `
                  <div style="
                    width: 12px;
                    height: 12px;
                    background: ${color};
                    border-radius: 50%;
                    box-shadow: 0 0 10px ${color}80;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    ${isMoving ? 'animation: pulse 2s infinite;' : ''}
                  "></div>
                  ${isMoving ? '' : `
                    <div style="
                      position: absolute;
                      top: 50%;
                      left: 50%;
                      width: 20px;
                      height: 20px;
                      transform: translate(-50%, -50%);
                      border: 2px solid ${color}40;
                      border-radius: 50%;
                      animation: pulse-ring 2s infinite;
                    "></div>
                  `}
                `;
                
                // Check if marker already exists
                const existingMarker = fleetMarkersRef.current.get(vessel.user_id);
                
                if (existingMarker) {
                  // Update existing marker position
                  existingMarker.setLngLat([vessel.latest.lng, vessel.latest.lat]);
                  seenVesselIds.add(vessel.user_id);
                } else {
                  // Create new marker
                  const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat([vessel.latest.lng, vessel.latest.lat])
                    .setPopup(
                      new mapboxgl.Popup({ offset: 20 })
                        .setHTML(`
                          <div style="padding: 8px;">
                            <div style="font-weight: bold; color: ${color};">
                              ${vessel.username || 'Unknown Captain'}
                            </div>
                            <div style="font-size: 11px; color: #888; margin-top: 2px;">
                              ${vessel.latest.speed ? `${vessel.latest.speed.toFixed(1)} knots` : 'Stationary'}
                            </div>
                            <div style="font-size: 10px; color: #666; margin-top: 4px;">
                              ${inlet?.name || 'Unknown Inlet'}
                            </div>
                            <div style="font-size: 9px; color: #999; margin-top: 2px;">
                              Last seen: ${minutesAgo < 1 ? 'Just now' : `${Math.round(minutesAgo)} min ago`}
                            </div>
                          </div>
                        `)
                    )
                    .addTo(map);
                  
                  fleetMarkersRef.current.set(vessel.user_id, marker);
                  seenVesselIds.add(vessel.user_id);
                }
              } catch (vesselError) {
                
                // Skip this vessel and continue with others
              }
            });
            
            // Remove markers for vessels no longer in the data
            fleetMarkersRef.current.forEach((marker, vesselId) => {
              if (!seenVesselIds.has(vesselId)) {
                marker.remove();
                fleetMarkersRef.current.delete(vesselId);
              }
            });
            
            
            return; // Successfully loaded real data, exit function
          }
        } catch (error) {
          
          // Fall back to mock data if API fails
          const visibleFleet = selectedInletId && selectedInletId !== 'overview' 
            ? MOCK_FLEET.filter(vessel => vessel.inlet === selectedInletId)
            : MOCK_FLEET;

          visibleFleet.forEach(vessel => {
            const inlet = getInletById(vessel.inlet);
            const color = inlet?.color || '#00DDEB';

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'fleet-vessel-marker';
        el.style.width = '12px';
        el.style.height = '12px';
        el.innerHTML = `
          <div style="
            width: 12px;
            height: 12px;
            background: ${color};
            border-radius: 50%;
            box-shadow: 0 0 10px ${color}66;
            border: 1px solid white;
          "></div>
        `;

        // Create marker with popup
        const marker = new mapboxgl.Marker(el)
          .setLngLat([vessel.lng, vessel.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px;">
                  <div style="font-weight: bold; color: ${color};">${vessel.name}</div>
                  <div style="font-size: 12px; color: #888; margin-top: 4px;">${inlet?.name || 'Unknown'}</div>
                </div>
              `)
          )
          .addTo(map);

            fleetMarkersRef.current.set(vessel.id, marker);
          });
        }
      };
      
    // Fetch immediately and then every 30 seconds
    fetchFleetPositions();
    const interval = setInterval(fetchFleetPositions, 30000);
    
    return () => {
      clearInterval(interval);
      fleetMarkersRef.current.forEach(marker => marker.remove());
      fleetMarkersRef.current.clear();
    };
  }, [map, showFleet, selectedInletId]);

  // Render vessel tracks
  useEffect(() => {
    if (!map) return;

    // Remove existing tracks
    if (map.getSource('vessel-tracks')) {
      // Remove all track layers
      if (map.getLayer('vessel-tracks-layer')) {
        map.removeLayer('vessel-tracks-layer');
      }
      if (map.getLayer('vessel-tracks-glow-mid')) {
        map.removeLayer('vessel-tracks-glow-mid');
      }
      if (map.getLayer('vessel-tracks-glow-outer')) {
        map.removeLayer('vessel-tracks-glow-outer');
      }
      map.removeSource('vessel-tracks');
      trackSourceRef.current = false;
    }

    // ⚠️ PRODUCTION REMINDER: SET TO FALSE BEFORE GOING LIVE! ⚠️
    // TESTING MODE: Always show tracks for testing boat movement
    const TESTING_MODE = true; // 🚨 MUST SET TO false FOR PRODUCTION! 🚨
    
    if ((showTracks || TESTING_MODE) && showFleet) {
      // Filter fleet by selected inlet
      const visibleFleet = selectedInletId && selectedInletId !== 'overview' 
        ? MOCK_FLEET.filter(vessel => vessel.inlet === selectedInletId)
        : MOCK_FLEET;

      // Generate track lines for each vessel
      const features = visibleFleet.map(vessel => {
        const inlet = getInletById(vessel.inlet);
        const color = inlet?.color || '#00DDEB';
        
        return {
          type: 'Feature' as const,
          properties: {
            vessel: vessel.name,
            color: color
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: generateTrack(vessel.lat, vessel.lng)
          }
        };
      });

      // Add user track if available
      if (showYou && userPosition) {
        features.push({
          type: 'Feature' as const,
          properties: {
            vessel: 'You',
            color: '#00DDEB'
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: generateTrack(
              userPosition.coords.latitude,
              userPosition.coords.longitude
            )
          }
        });
      }

      // Add source and layer
      map.addSource('vessel-tracks', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      });

      // Add multiple layers for glowing effect
      // Outer glow
      map.addLayer({
        id: 'vessel-tracks-glow-outer',
        type: 'line',
        source: 'vessel-tracks',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 8,
          'line-opacity': 0.15,
          'line-blur': 4
        }
      });

      // Mid glow
      map.addLayer({
        id: 'vessel-tracks-glow-mid',
        type: 'line',
        source: 'vessel-tracks',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 4,
          'line-opacity': 0.3,
          'line-blur': 2
        }
      });

      // Core track
      map.addLayer({
        id: 'vessel-tracks-layer',
        type: 'line',
        source: 'vessel-tracks',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.8
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        }
      });

      trackSourceRef.current = true;
    }

    return () => {
      if (map && map.getSource('vessel-tracks')) {
        if (map.getLayer('vessel-tracks-layer')) {
          map.removeLayer('vessel-tracks-layer');
        }
        if (map.getLayer('vessel-tracks-glow-mid')) {
          map.removeLayer('vessel-tracks-glow-mid');
        }
        if (map.getLayer('vessel-tracks-glow-outer')) {
          map.removeLayer('vessel-tracks-glow-outer');
        }
        map.removeSource('vessel-tracks');
        trackSourceRef.current = false;
      }
    };
  }, [map, showTracks, showFleet, showYou, userPosition, selectedInletId]);

  return null;
}
