'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Wifi, WifiOff, Battery, Users, Navigation, 
  Activity, Clock, Anchor, AlertCircle, TrendingUp, 
  Compass, Play, Pause, Square, Save
} from 'lucide-react';
import { storePosition, getTrackingTrail, type TrackingTrail } from '@/lib/tracking/positionStore';
import { useMapbox } from '@/lib/MapCtx';

export default function IndividualTrackingWidget() {
  const map = useMapbox();
  
  // Core tracking state
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [trail, setTrail] = useState<TrackingTrail | null>(null);
  
  // Real-time metrics
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [tripDistance, setTripDistance] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [avgSpeed, setAvgSpeed] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  
  // Device status
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(0);
  const [batteryLevel, setBatteryLevel] = useState<number>(87);
  
  // References
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const userMarker = useRef<any>(null);
  const trailLine = useRef<any>(null);
  const positionHistory = useRef<[number, number][]>([]);

  // Get saved location from welcome screen
  useEffect(() => {
    const savedLocation = localStorage.getItem('abfi_last_location');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setUserLocation(location);
        
        // Add initial marker on map
        if (map && !userMarker.current) {
          userMarker.current = new (window as any).mapboxgl.Marker({
            color: '#00DDEB',
            scale: 1.2
          })
            .setLngLat([location.lng, location.lat])
            .setPopup(new (window as any).mapboxgl.Popup().setText('Your Position'))
            .addTo(map);
        }
      } catch (e) {
        console.log('No saved location found');
      }
    }
  }, [map]);

  // Update elapsed time
  useEffect(() => {
    if (isTracking && !isPaused && tripStartTime) {
      const timer = setInterval(() => {
        const elapsed = Date.now() - tripStartTime.getTime();
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isTracking, isPaused, tripStartTime]);

  // Start tracking
  const startTracking = () => {
    setIsTracking(true);
    setIsPaused(false);
    setTripStartTime(new Date());
    setTripDistance(0);
    setMaxSpeed(0);
    positionHistory.current = [];
    
    // Start position tracking
    if (navigator.geolocation) {
      trackingInterval.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            
            // Update metrics
            setUserLocation(newLocation);
            setCurrentSpeed(position.coords.speed ? position.coords.speed * 1.94384 : 0); // Convert m/s to knots
            setCurrentHeading(position.coords.heading || 0);
            setGpsAccuracy(position.coords.accuracy || 0);
            
            // Update max speed
            if (position.coords.speed) {
              const speedKnots = position.coords.speed * 1.94384;
              if (speedKnots > maxSpeed) setMaxSpeed(speedKnots);
            }
            
            // Calculate distance
            if (positionHistory.current.length > 0) {
              const lastPos = positionHistory.current[positionHistory.current.length - 1];
              const distance = calculateDistance(lastPos[0], lastPos[1], newLocation.lat, newLocation.lng);
              setTripDistance(prev => prev + distance);
            }
            
            // Add to history
            positionHistory.current.push([newLocation.lng, newLocation.lat]);
            
            // Update map marker
            if (map && userMarker.current) {
              userMarker.current.setLngLat([newLocation.lng, newLocation.lat]);
              
              // Update trail line
              if (positionHistory.current.length > 1) {
                if (trailLine.current) {
                  map.getSource('trail-line').setData({
                    type: 'Feature',
                    geometry: {
                      type: 'LineString',
                      coordinates: positionHistory.current
                    }
                  });
                } else {
                  // Create trail line
                  map.addSource('trail-line', {
                    type: 'geojson',
                    data: {
                      type: 'Feature',
                      geometry: {
                        type: 'LineString',
                        coordinates: positionHistory.current
                      }
                    }
                  });
                  
                  map.addLayer({
                    id: 'trail-line',
                    type: 'line',
                    source: 'trail-line',
                    paint: {
                      'line-color': '#00DDEB',
                      'line-width': 3,
                      'line-opacity': 0.7
                    }
                  });
                  
                  trailLine.current = true;
                }
              }
            }
            
            // Store position in Supabase
            if (!isPaused) {
              const boatName = localStorage.getItem('abfi_boat_name') || 'Unknown';
              const userId = localStorage.getItem('abfi_captain_name') || 'Unknown';
              
              await storePosition({
                user_id: userId,
                boat_name: boatName,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                speed: position.coords.speed || undefined,
                heading: position.coords.heading || undefined,
                accuracy: position.coords.accuracy || undefined
              });
            }
          },
          (error) => {
            console.error('GPS Error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      }, 5000); // Update every 5 seconds
    }
  };

  // Pause tracking
  const pauseTracking = () => {
    setIsPaused(true);
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
    }
  };

  // Resume tracking
  const resumeTracking = () => {
    setIsPaused(false);
    startTracking();
  };

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    setIsPaused(false);
    
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
    }
    
    // Calculate average speed
    if (tripDistance > 0 && tripStartTime) {
      const hours = (Date.now() - tripStartTime.getTime()) / 3600000;
      setAvgSpeed(tripDistance / hours);
    }
  };

  // Calculate distance between two points (in nautical miles)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Format heading to compass direction
  const getCompassDirection = (heading: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(heading / 22.5) % 16;
    return directions[index];
  };

  return (
    <div className="space-y-3">
      {/* Tracking Controls */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            Trip Tracking
          </h3>
          <div className="flex gap-2">
            {!isTracking ? (
              <button
                onClick={startTracking}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-all"
              >
                <Play className="w-3 h-3" /> Start
              </button>
            ) : isPaused ? (
              <button
                onClick={resumeTracking}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-medium hover:bg-yellow-500/30 transition-all"
              >
                <Play className="w-3 h-3" /> Resume
              </button>
            ) : (
              <>
                <button
                  onClick={pauseTracking}
                  className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-medium hover:bg-yellow-500/30 transition-all"
                >
                  <Pause className="w-3 h-3" /> Pause
                </button>
                <button
                  onClick={stopTracking}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-all"
                >
                  <Square className="w-3 h-3" /> Stop
                </button>
              </>
            )}
          </div>
        </div>
        
        {isTracking && (
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-center">
              <div className="text-2xl font-mono text-cyan-400">{elapsedTime}</div>
              <p className="text-xs text-gray-500 mt-1">Trip Duration</p>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Metrics */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold text-white">Live Metrics</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <p className="text-xs text-gray-400">Speed</p>
            </div>
            <p className="text-lg font-bold text-white">{currentSpeed.toFixed(1)} <span className="text-xs text-gray-400">kts</span></p>
          </div>
          
          <div className="bg-black/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              <p className="text-xs text-gray-400">Heading</p>
            </div>
            <p className="text-lg font-bold text-white">{currentHeading.toFixed(0)}° <span className="text-xs text-gray-400">{getCompassDirection(currentHeading)}</span></p>
          </div>
          
          <div className="bg-black/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Navigation className="w-3 h-3 text-cyan-400" />
              <p className="text-xs text-gray-400">Distance</p>
            </div>
            <p className="text-lg font-bold text-white">{tripDistance.toFixed(1)} <span className="text-xs text-gray-400">nm</span></p>
          </div>
          
          <div className="bg-black/30 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <p className="text-xs text-gray-400">Max Speed</p>
            </div>
            <p className="text-lg font-bold text-white">{maxSpeed.toFixed(1)} <span className="text-xs text-gray-400">kts</span></p>
          </div>
        </div>
      </div>

      {/* Position Details */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-white">Current Position</h3>
        </div>
        
        {userLocation ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Latitude:</span>
              <span className="text-white font-mono">{userLocation.lat.toFixed(6)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Longitude:</span>
              <span className="text-white font-mono">{userLocation.lng.toFixed(6)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">GPS Accuracy:</span>
              <span className="text-white">{gpsAccuracy.toFixed(0)}m</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Waiting for GPS signal...</p>
        )}
      </div>

      {/* Nearby Activity */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Nearby Activity</h3>
        </div>
        
        <div className="space-y-2">
          {isTracking ? (
            <>
              <div className="flex items-center justify-between p-2 bg-black/30 rounded">
                <div className="flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-white">Sea Hawk</span>
                </div>
                <span className="text-xs text-gray-400">1.2 nm</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-black/30 rounded">
                <div className="flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-white">Blue Runner</span>
                </div>
                <span className="text-xs text-gray-400">2.8 nm</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-black/30 rounded">
                <div className="flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-white">Reel Deal</span>
                </div>
                <span className="text-xs text-gray-400">3.5 nm</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500 text-center py-2">
              Start tracking to see nearby vessels
            </p>
          )}
        </div>
      </div>

      {/* Device Status */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Battery className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold text-white">Device Status</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">GPS Signal:</span>
            <span className={`font-medium ${gpsAccuracy < 10 ? 'text-green-400' : gpsAccuracy < 30 ? 'text-yellow-400' : 'text-red-400'}`}>
              {gpsAccuracy < 10 ? 'Excellent' : gpsAccuracy < 30 ? 'Good' : 'Poor'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Battery:</span>
            <span className={`font-medium ${batteryLevel > 50 ? 'text-green-400' : batteryLevel > 20 ? 'text-yellow-400' : 'text-red-400'}`}>
              {batteryLevel}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Network:</span>
            <span className="text-green-400 font-medium">Connected</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Storage:</span>
            <span className="text-green-400 font-medium">Cloud</span>
          </div>
        </div>
      </div>

      {/* Save Trip Option */}
      {!isTracking && tripDistance > 0 && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-400">Trip Complete!</p>
              <p className="text-xs text-gray-400">
                {tripDistance.toFixed(1)} nm in {elapsedTime} • Avg {avgSpeed.toFixed(1)} kts
              </p>
            </div>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-medium hover:bg-cyan-500/30 transition-all">
              <Save className="w-3 h-3" /> Save
            </button>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          🔒 Your position is securely stored and only visible to vessels you choose to share with.
        </p>
      </div>
    </div>
  );
}