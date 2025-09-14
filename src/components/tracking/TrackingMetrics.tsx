'use client';

import { Activity, TrendingUp, Compass, Navigation, Waves, Anchor, MapPin, Clock } from 'lucide-react';
import { useTrackingStore } from '@/lib/tracking/trackingStore';
import { useEffect, useState } from 'react';

export default function TrackingMetrics() {
  const { isTracking, userVessel, tripDistance, maxSpeed, tripStartTime } = useTrackingStore();
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Update elapsed time
  useEffect(() => {
    if (!isTracking || !tripStartTime) {
      setElapsedTime('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - tripStartTime.getTime();
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, tripStartTime]);

  const getCompassDirection = (heading: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  if (!userVessel) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Start tracking to see metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Timer */}
      {isTracking && (
        <div className="bg-black/30 rounded-lg px-2 py-1 text-center">
          <div className="text-lg font-mono text-cyan-400">{elapsedTime}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Duration</div>
        </div>
      )}

      {/* Live Metrics */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="text-sm font-semibold text-white">Live Data</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-black/30 rounded p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-gray-400">Speed</span>
            </div>
            <div className="text-base font-bold text-white">
              {(userVessel.speed * 1.94384).toFixed(1)}
              <span className="text-[10px] text-gray-400 ml-1">kts</span>
            </div>
          </div>
          
          <div className="bg-black/30 rounded p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-gray-400">Heading</span>
            </div>
            <div className="text-base font-bold text-white">
              {Math.round(userVessel.heading)}°
              <span className="text-[10px] text-gray-400 ml-1">{getCompassDirection(userVessel.heading)}</span>
            </div>
          </div>
          
          <div className="bg-black/30 rounded p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Navigation className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-gray-400">Distance</span>
            </div>
            <div className="text-base font-bold text-white">
              {tripDistance.toFixed(1)}
              <span className="text-[10px] text-gray-400 ml-1">nm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Position */}
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
            <span className="text-white font-mono">{userVessel.lat.toFixed(5)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Lon:</span>
            <span className="text-white font-mono">{userVessel.lng.toFixed(5)}°</span>
          </div>
        </div>
      </div>
    </div>
  );
}
