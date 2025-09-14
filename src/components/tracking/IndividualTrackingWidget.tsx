'use client';

import { useState, useEffect } from 'react';
import { MapPin, Wifi, WifiOff, Battery, Users, Navigation } from 'lucide-react';
import { storePosition, getTrackingTrail, type TrackingTrail } from '@/lib/tracking/positionStore';

export default function IndividualTrackingWidget() {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [trail, setTrail] = useState<TrackingTrail | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Get saved location from welcome screen
  useEffect(() => {
    const savedLocation = localStorage.getItem('abfi_last_location');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setUserLocation(location);
      } catch (e) {
        console.log('No saved location found');
      }
    }
  }, []);

  // Start/stop tracking function
  const toggleTracking = async () => {
    if (!isTracking) {
      // Start tracking
      setIsTracking(true);
      setIsSharing(true);
      
      // Get current position and store it
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const boatName = localStorage.getItem('abfi_boat_name') || 'Unknown';
          const userId = localStorage.getItem('abfi_captain_name') || 'Unknown';
          
          const positionData = {
            user_id: userId,
            boat_name: boatName,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            accuracy: position.coords.accuracy || undefined
          };

          await storePosition(positionData);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });

          // Load existing trail
          const existingTrail = await getTrackingTrail(userId, 24);
          setTrail(existingTrail);
        });
      }
    } else {
      // Stop tracking
      setIsTracking(false);
      setIsSharing(false);
    }
  };

  // Load tracking trail
  const loadTrail = async () => {
    const userId = localStorage.getItem('abfi_captain_name') || 'Unknown';
    const trackingTrail = await getTrackingTrail(userId, 24);
    setTrail(trackingTrail);
  };

  return (
    <div className="space-y-4">
      {/* Location Status */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Your Location</h3>
          </div>
          <button
            onClick={toggleTracking}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              isTracking 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
            }`}
          >
            {isTracking ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isTracking ? 'Tracking ON' : 'Start Tracking'}
          </button>
        </div>

        {userLocation ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Latitude: <span className="text-white font-mono">{userLocation.lat.toFixed(6)}</span>
            </p>
            <p className="text-sm text-gray-400">
              Longitude: <span className="text-white font-mono">{userLocation.lng.toFixed(6)}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No location data available</p>
        )}
      </div>

      {/* Nearby Vessels */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Nearby Vessels</h3>
        </div>
        
        <div className="text-center py-4">
          <div className="text-2xl font-bold text-blue-400">
            {isSharing ? '3' : '0'}
          </div>
          <p className="text-xs text-gray-500">
            {isSharing ? 'vessels within 5nm' : 'Enable sharing to see nearby vessels'}
          </p>
        </div>
      </div>

      {/* Device Status */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Battery className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold text-white">Device Status</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-400">GPS</p>
            <p className="text-green-400 font-medium">Active</p>
          </div>
          <div>
            <p className="text-gray-400">Battery</p>
            <p className="text-green-400 font-medium">87%</p>
          </div>
        </div>
      </div>

      {/* Tracking Trail */}
      {trail && (
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">24hr Trail</h3>
            </div>
            <button
              onClick={loadTrail}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Refresh
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-400">Positions</p>
              <p className="text-white font-semibold">{trail.positions.length}</p>
            </div>
            <div>
              <p className="text-gray-400">Distance</p>
              <p className="text-white font-semibold">{trail.totalDistance} nm</p>
            </div>
          </div>
          
          <div className="mt-3">
            <p className="text-xs text-gray-500">
              Trail: {new Date(trail.startTime).toLocaleTimeString()} - {new Date(trail.endTime).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          🔒 Position data stored securely in Supabase. 
          Only shared when tracking is enabled.
        </p>
      </div>
    </div>
  );
}
