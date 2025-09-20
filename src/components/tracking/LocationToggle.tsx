'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { toast } from 'sonner';
import { getInletById } from '@/lib/inlets';

// Dev mode flag - show true GPS anywhere when true
const DEV_MODE = process.env.NODE_ENV === 'development';

interface LocationToggleProps {
  map: mapboxgl.Map | null;
  selectedInletId: string | null;
  showYou: boolean;
  onLocationUpdate?: (coords: { lat: number; lng: number }) => void;
}

// Offline queue for location points
const offlineQueue: Array<{ point: [number, number]; timestamp: number }> = [];

export default function LocationToggle({ 
  map, 
  selectedInletId,
  showYou,
  onLocationUpdate 
}: LocationToggleProps) {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const hasShownOffshoreToast = useRef(false);
  const hasShownDisabledToast = useRef(false);
  const orbMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Sync offline queue when back online
      if (offlineQueue.length > 0) {
        console.log('Syncing', offlineQueue.length, 'offline points');
        // TODO: Send to backend
        offlineQueue.length = 0; // Clear queue
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast('Location saved offline. Your trip will sync once you\'re back online.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Create or update the user orb
  const updateUserOrb = (coords: [number, number]) => {
    if (!map || !showYou) {
      // Remove orb if showYou is false
      if (orbMarkerRef.current) {
        orbMarkerRef.current.remove();
        orbMarkerRef.current = null;
      }
      return;
    }

    // Get inlet color
    const inlet = selectedInletId ? getInletById(selectedInletId) : null;
    const inletColor = inlet?.color || '#00DDEB';

    // Remove existing marker if any
    if (orbMarkerRef.current) {
      orbMarkerRef.current.remove();
    }

    // Create orb element
    const el = document.createElement('div');
    el.className = 'user-location-orb';
    el.innerHTML = `
      <div class="orb-core"></div>
      <div class="orb-glow"></div>
      <div class="orb-pulse"></div>
    `;

    // Update or create dynamic styles for this inlet color
    let styleEl = document.getElementById('user-orb-styles') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'user-orb-styles';
      document.head.appendChild(styleEl);
    }
    
    // Convert hex to RGB for gradients
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 221, b: 235 };
    };
    
    const rgb = hexToRgb(inletColor);
    
    styleEl.textContent = `
      .user-location-orb {
        width: 24px;
        height: 24px;
        position: relative;
      }
      .orb-core {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 0 4px rgba(0,0,0,0.3);
        z-index: 3;
      }
      .orb-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, ${inletColor}88 0%, ${inletColor}00 70%);
        border-radius: 50%;
        z-index: 2;
      }
      .orb-pulse {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
        background: radial-gradient(circle, rgba(${rgb.r},${rgb.g},${rgb.b},0.4) 0%, rgba(${rgb.r},${rgb.g},${rgb.b},0) 70%);
        border-radius: 50%;
        animation: pulse 2s ease-out infinite;
        z-index: 1;
      }
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
      }
    `;

    // Create marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat(coords)
      .addTo(map);

    orbMarkerRef.current = marker;
  };

  // Handle location updates
  const handleLocationUpdate = (coords: GeolocationCoordinates) => {
    const { latitude, longitude } = coords;
    const point: [number, number] = [longitude, latitude];

    // Notify parent
    if (onLocationUpdate) {
      onLocationUpdate({ lat: latitude, lng: longitude });
    }

    if (DEV_MODE) {
      // Testing: show orb anywhere
      updateUserOrb(point);
      return;
    }

    const inlet = selectedInletId ? getInletById(selectedInletId) : null;
    if (!inlet || !inlet.center) return;

    // TODO: Get actual inlet polygon - for now use a simple radius check
    const inletCenter = turf.point(inlet.center);
    const userPoint = turf.point(point);
    const distance = turf.distance(inletCenter, userPoint, { units: 'kilometers' });
    
    // If within ~5km of inlet center, snap to inlet
    const withinInlet = distance < 5;

    if (withinInlet) {
      // Land or near coast → snap to inlet center
      updateUserOrb(inlet.center);
    } else {
      // Offshore → show true GPS
      updateUserOrb(point);
      
      // Show offshore toast once per session
      if (!hasShownOffshoreToast.current) {
        toast('Live tracking enabled. We\'ll follow your position offshore.');
        hasShownOffshoreToast.current = true;
      }
    }

    // Always log offline queue if network absent
    if (!navigator.onLine) {
      offlineQueue.push({ point, timestamp: Date.now() });
    }
  };

  // Start watching location
  const startLocationWatch = () => {
    if (!navigator.geolocation) {
      toast.error('Location services not available');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => handleLocationUpdate(pos.coords),
      (err) => {
        console.error('Location error:', err);
        toast.error('Unable to access your location');
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 10000, 
        timeout: 20000 
      }
    );

    watchIdRef.current = watchId;
  };

  // Stop watching location
  const stopLocationWatch = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    // Remove orb
    if (orbMarkerRef.current) {
      orbMarkerRef.current.remove();
      orbMarkerRef.current = null;
    }

    // Show disabled toast once per session
    if (!hasShownDisabledToast.current) {
      toast('Location tracking disabled. Your position is no longer visible.');
      hasShownDisabledToast.current = true;
    }
  };

  // Toggle location
  const onToggleLocation = () => {
    if (locationEnabled) {
      stopLocationWatch();
      setLocationEnabled(false);
    } else {
      startLocationWatch();
      setLocationEnabled(true);
    }
  };

  // Listen for location permission requests from banners
  useEffect(() => {
    const handleRequestPermission = () => {
      if (!locationEnabled) {
        onToggleLocation();
      }
    };

    window.addEventListener('request-location-permission', handleRequestPermission);
    return () => {
      window.removeEventListener('request-location-permission', handleRequestPermission);
    };
  }, [locationEnabled]);

  // Get inlet name for tooltip
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;

  // Update orb visibility when showYou changes
  useEffect(() => {
    if (locationEnabled && inlet && inlet.center) {
      if (showYou) {
        // Show toast when orb becomes visible
        toast('Your location is live — you\'re visible to your fleet.');
        // Always start at inlet center
        updateUserOrb(inlet.center);
      }
    } else if (!showYou && orbMarkerRef.current) {
      orbMarkerRef.current.remove();
      orbMarkerRef.current = null;
    }
  }, [showYou, inlet, locationEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (orbMarkerRef.current) {
        orbMarkerRef.current.remove();
      }
    };
  }, []);
  const inletName = inlet?.name || 'your selected inlet';

  return (
    <label 
      className={`flex items-center justify-between w-full rounded-md px-3 py-2 text-xs ${
        selectedInletId && selectedInletId !== 'overview' 
          ? 'bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer' 
          : 'opacity-40 cursor-not-allowed'
      }`}
      title={
        locationEnabled 
          ? 'Disable location sharing.'
          : 'Enable your location to show where you are fishing.'
      }
    >
      <span className="flex items-center gap-2">
        <MapPin className="w-3 h-3" />
        <span>Enable Location</span>
      </span>
      <input
        type="checkbox"
        disabled={!selectedInletId || selectedInletId === 'overview'}
        checked={locationEnabled}
        onChange={onToggleLocation}
        className="sr-only"
      />
      <div className={`w-8 h-5 rounded-full relative transition-colors ${
        locationEnabled ? 'bg-cyan-500/30' : 'bg-slate-600/30'
      }`}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
          locationEnabled ? 'translate-x-3 bg-cyan-400' : 'translate-x-0 bg-slate-600'
        }`} />
      </div>
      
      {/* Show offline indicator */}
      {locationEnabled && isOffline && (
        <span 
          className="ml-2 text-amber-400 text-[10px]"
          title="You're logging locations offline. We'll update the map when you reconnect."
        >
          (offline)
        </span>
      )}
    </label>
  );
}
