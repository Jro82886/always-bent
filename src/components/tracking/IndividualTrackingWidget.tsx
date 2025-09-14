'use client';

import { useState, useEffect } from 'react';
import { MapPin, Wifi, WifiOff, Battery, Users } from 'lucide-react';

export default function IndividualTrackingWidget() {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isSharing, setIsSharing] = useState(false);

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
            onClick={() => setIsSharing(!isSharing)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              isSharing 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isSharing ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isSharing ? 'Sharing' : 'Share'}
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

      {/* Privacy Notice */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          🔒 Your location is only shared with nearby ABFI users when enabled. 
          Data is encrypted and never stored permanently.
        </p>
      </div>
    </div>
  );
}
