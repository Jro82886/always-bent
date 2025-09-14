'use client';

import { useState, useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { 
  Navigation, Activity, Anchor, Battery, 
  Play, Pause, Square, TrendingUp, 
  Compass, MapPin, Clock, Waves
} from 'lucide-react';
import { useMapbox } from '@/lib/MapCtx';

export default function IndividualTrackingWidget() {
  const map = useMapbox();
  
  // Core tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mockTimer, setMockTimer] = useState(0);
  
  // Mock data for demonstration
  const [mockData, setMockData] = useState({
    speed: 7.2,
    heading: 45,
    depth: 120,
    waterTemp: 72,
    distance: 12.4,
    maxSpeed: 8.5,
    avgSpeed: 6.8,
    position: { lat: 38.112258, lng: -75.320577 }
  });

  // Nearby vessels (mock)
  const nearbyVessels = [
    { name: 'Sea Hawk', distance: 1.2, bearing: 'NE' },
    { name: 'Blue Runner', distance: 2.8, bearing: 'S' },
    { name: 'Reel Deal', distance: 3.5, bearing: 'W' }
  ];

  // References
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const userMarker = useRef<any>(null);

  // Initialize user position marker
  useEffect(() => {
    if (map && !userMarker.current) {
      userMarker.current = new (window as any).mapboxgl.Marker({
        color: '#3b82f6',
        scale: 1.2
      })
        .setLngLat([mockData.position.lng, mockData.position.lat])
        .setPopup(new (window as any).mapboxgl.Popup().setText('Your Vessel'))
        .addTo(map);
    }
  }, [map, mockData.position]);

  // Timer for tracking duration
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerInterval.current = setInterval(() => {
        setMockTimer(prev => prev + 1);
        
        // Simulate movement
        setMockData(prev => ({
          ...prev,
          speed: 6 + Math.random() * 4,
          heading: (prev.heading + Math.random() * 10 - 5 + 360) % 360,
          distance: prev.distance + 0.002,
          waterTemp: 70 + Math.random() * 6,
          depth: 100 + Math.random() * 50
        }));
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }
    
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [isTracking, isPaused]);

  // Format timer
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get compass direction
  const getCompassDirection = (heading: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  return (
    <div className="space-y-2">
      {/* Compact Header with Controls */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Trip Control</span>
          </div>
          <div className="flex gap-1">
            {!isTracking ? (
              <button
                onClick={() => { setIsTracking(true); setMockTimer(0); }}
                className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-medium hover:bg-green-500/30 transition-all"
              >
                <Play className="w-3 h-3" /> Start
              </button>
            ) : (
              <>
                {!isPaused ? (
                  <button
                    onClick={() => setIsPaused(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs font-medium hover:bg-yellow-500/30 transition-all"
                  >
                    <Pause className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsPaused(false)}
                    className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-medium hover:bg-green-500/30 transition-all"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => { setIsTracking(false); setIsPaused(false); }}
                  className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-medium hover:bg-red-500/30 transition-all"
                >
                  <Square className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
        
        {isTracking && (
          <div className="bg-black/30 rounded px-2 py-1 text-center">
            <div className="text-lg font-mono text-cyan-400">{formatTime(mockTimer)}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Duration</div>
          </div>
        )}
      </div>

      {/* Compact Metrics Grid */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="text-sm font-semibold text-white">Live Data</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {/* Speed */}
          <div className="bg-black/30 rounded p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-gray-400">Speed</span>
            </div>
            <div className="text-base font-bold text-white">
              {mockData.speed.toFixed(1)}
              <span className="text-[10px] text-gray-400 ml-1">kts</span>
            </div>
          </div>
          
          {/* Heading */}
          <div className="bg-black/30 rounded p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-gray-400">Heading</span>
            </div>
            <div className="text-base font-bold text-white">
              {Math.round(mockData.heading)}°
              <span className="text-[10px] text-gray-400 ml-1">{getCompassDirection(mockData.heading)}</span>
            </div>
          </div>
          
          {/* Distance */}
          <div className="bg-black/30 rounded p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Navigation className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-gray-400">Distance</span>
            </div>
            <div className="text-base font-bold text-white">
              {mockData.distance.toFixed(1)}
              <span className="text-[10px] text-gray-400 ml-1">nm</span>
            </div>
          </div>
        </div>

        {/* Ocean Conditions */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-black/30 rounded p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Waves className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-gray-400">Water Temp</span>
            </div>
            <div className="text-base font-bold text-white">
              {Math.round(mockData.waterTemp)}°F
            </div>
          </div>
          
          <div className="bg-black/30 rounded p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Anchor className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-gray-400">Depth</span>
            </div>
            <div className="text-base font-bold text-white">
              {Math.round(mockData.depth)}
              <span className="text-[10px] text-gray-400 ml-1">ft</span>
            </div>
          </div>
        </div>
      </div>

      {/* Position Info - Compact */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Position</span>
          <span className="ml-auto text-[10px] text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            GPS Active
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Lat:</span>
            <span className="text-white font-mono">{mockData.position.lat.toFixed(5)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Lon:</span>
            <span className="text-white font-mono">{mockData.position.lng.toFixed(5)}°</span>
          </div>
        </div>
      </div>

      {/* Nearby Vessels - Compact List */}
      {isTracking && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Anchor className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Nearby Vessels</span>
            <span className="ml-auto text-[10px] text-gray-400">{nearbyVessels.length} in range</span>
          </div>
          
          <div className="space-y-1">
            {nearbyVessels.map((vessel, i) => (
              <div key={i} className="flex items-center justify-between p-1.5 bg-black/30 rounded text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span className="text-white">{vessel.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span>{vessel.distance} nm</span>
                  <span className="text-[10px]">{vessel.bearing}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trip Summary - Shows when stopped */}
      {!isTracking && mockTimer > 0 && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-cyan-400">Trip Complete</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {mockData.distance.toFixed(1)} nm • {formatTime(mockTimer)} • Avg {mockData.avgSpeed.toFixed(1)} kts
              </p>
            </div>
            <button className="px-2 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-medium hover:bg-cyan-500/30 transition-all">
              Save Trip
            </button>
          </div>
        </div>
      )}

      {/* Compact Status Bar */}
      <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/30">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Battery className="w-3 h-3 text-green-400" />
              <span className="text-gray-400">87%</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="text-gray-400">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <span className="text-gray-500">Tracking Mode: Individual</span>
        </div>
      </div>
    </div>
  );
}