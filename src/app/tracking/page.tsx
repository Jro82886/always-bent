'use client';

import { useState, useEffect } from 'react';
import { MapShell } from '@/lib/MapRef';
import { useMapbox } from '@/lib/MapCtx';
import NavTabs from '@/components/NavTabs';
import { useAppState } from '@/store/appState';
import { Radio, Users, Activity, Map, Eye, EyeOff } from 'lucide-react';

export default function TrackingPage() {
  const map = useMapbox();
  const { username } = useAppState();
  const [isTracking, setIsTracking] = useState(false);
  const [showFleet, setShowFleet] = useState(true);
  const [showTrails, setShowTrails] = useState(false);
  const [showGFW, setShowGFW] = useState(false);

  useEffect(() => {
    console.log('[TRACKING] Page loaded, map:', !!map, 'username:', username);
  }, [map, username]);

  return (
    <MapShell>
      {/* Navigation and UI overlay - pointer-events-none on container */}
      <div className="pointer-events-none absolute inset-0">
        <NavTabs />
        
        {/* Fleet Command Bridge - Top Left - pointer-events-auto to make it interactive */}
        <div className="absolute top-20 left-4 bg-black/90 backdrop-blur-md rounded-xl border border-cyan-500/30 p-4 max-w-sm pointer-events-auto z-20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className={`w-5 h-5 ${isTracking ? 'text-cyan-400' : 'text-gray-500'}`} />
              <h2 className="text-lg font-semibold text-white">Fleet Tracking</h2>
            </div>
            <button
              onClick={() => setIsTracking(!isTracking)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                isTracking 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {isTracking ? '● Live' : 'Start'}
            </button>
          </div>

          {/* Fleet Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-900/50 rounded-lg p-2 text-center">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-xs text-gray-400">Active</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-2 text-center">
              <div className="text-2xl font-bold text-yellow-400">0</div>
              <div className="text-xs text-gray-400">Fishing</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-2 text-center">
              <div className="text-sm font-bold text-green-400 mt-2">LOW</div>
              <div className="text-xs text-gray-400">Activity</div>
            </div>
          </div>

          {/* Layer Controls */}
          <div className="space-y-2">
            <button
              onClick={() => setShowFleet(!showFleet)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                showFleet 
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                  : 'bg-gray-900/30 border border-gray-800/50 text-gray-500'
              }`}
            >
              <span className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                Community Fleet
              </span>
              {showFleet ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowTrails(!showTrails)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                showTrails 
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                  : 'bg-gray-900/30 border border-gray-800/50 text-gray-500'
              }`}
            >
              <span className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4" />
                Vessel Trails
              </span>
              {showTrails ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowGFW(!showGFW)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                showGFW 
                  ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                  : 'bg-gray-900/30 border border-gray-800/50 text-gray-500'
              }`}
            >
              <span className="flex items-center gap-2 text-sm">
                <Map className="w-4 h-4" />
                Commercial (GFW)
              </span>
              {showGFW ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {/* Fair Exchange Notice */}
          {!isTracking && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-yellow-400">
                Share your position to see other vessels (fair exchange)
              </p>
            </div>
          )}
        </div>

        {/* Status Bar - Bottom */}
        {isTracking && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600/90 text-white px-4 py-2 rounded-full text-sm font-medium pointer-events-auto">
            🟢 Live Tracking Active
          </div>
        )}
      </div>
    </MapShell>
  );
}