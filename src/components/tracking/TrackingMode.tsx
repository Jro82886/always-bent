'use client';

import { useState, useEffect } from 'react';
import { Activity, Navigation, Ship, Target, Clock, MapPin } from 'lucide-react';
import { INLETS } from '@/lib/inlets';
import { useAppState } from '@/store/appState';

interface TrackingModeProps {
  map?: mapboxgl.Map | null;
}

export default function TrackingMode({ map }: TrackingModeProps) {
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  const [showFleetPanel, setShowFleetPanel] = useState(true);
  const [showTrackHistory, setShowTrackHistory] = useState(false);
  const { selectedInletId } = useAppState();
  
  // Get the current inlet and its color
  const currentInlet = INLETS.find(i => i.id === selectedInletId);
  const inletColor = currentInlet?.color || '#00ffff';
  
  // This component will handle all tracking-specific functionality
  // Keeping it separate ensures clean architecture
  
  useEffect(() => {
    // Initialize tracking-specific map layers when component mounts
    if (map && trackingEnabled) {
      console.log('🎯 Tracking mode activated');
      // Future: Add vessel markers, track lines, etc.
    }
    
    return () => {
      // Cleanup tracking layers when switching modes
      if (map) {
        console.log('🎯 Tracking mode deactivated');
        // Future: Remove tracking-specific layers
      }
    };
  }, [map, trackingEnabled]);
  
  return (
    <>
      {/* LEFT PANEL - Fleet Management */}
      <div className="absolute left-4 top-24 bottom-4 w-80 pointer-events-auto z-30">
        <div className="bg-gray-950/90 backdrop-blur-xl rounded-xl border border-cyan-500/30 h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-cyan-500/20">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                <Ship size={20} />
                Fleet Tracker
              </h2>
              <button
                onClick={() => setTrackingEnabled(!trackingEnabled)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  trackingEnabled 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                }`}
              >
                {trackingEnabled ? 'LIVE' : 'OFF'}
              </button>
            </div>
            <p className="text-xs text-white/60">Real-time vessel positions</p>
          </div>
          
          {/* Fleet List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {/* Placeholder for vessel list */}
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: inletColor,
                        boxShadow: `0 0 8px ${inletColor}`,
                      }}
                    />
                    <span className="text-sm font-medium text-white">My Vessel</span>
                  </div>
                  <span className="text-xs text-green-400">● Active</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <MapPin size={12} />
                  <span>40.7°N, 72.0°W</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                  <Navigation size={12} />
                  <span>12.5 kts · Heading 045°</span>
                </div>
                {currentInlet && (
                  <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                    <span>Home: {currentInlet.name}</span>
                  </div>
                )}
              </div>
              
              {/* More vessels would go here */}
              <div className="text-center py-8 text-white/40 text-sm">
                More vessels will appear here when tracking is enabled
              </div>
            </div>
          </div>
          
          {/* Footer Controls */}
          <div className="p-4 border-t border-cyan-500/20">
            <button
              onClick={() => setShowTrackHistory(!showTrackHistory)}
              className="w-full px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Clock size={16} />
              {showTrackHistory ? 'Hide' : 'Show'} Track History
            </button>
          </div>
        </div>
      </div>
      
      {/* RIGHT PANEL - Tracking Controls */}
      <div className="absolute right-4 top-24 w-64 pointer-events-auto z-30">
        <div className="bg-gray-950/90 backdrop-blur-xl rounded-xl border border-cyan-500/30 p-4">
          <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
            <Target size={16} />
            Tracking Options
          </h3>
          
          <div className="space-y-3">
            {/* Auto-Center Toggle */}
            <label className="flex items-center justify-between">
              <span className="text-xs text-white/70">Auto-center on vessel</span>
              <input
                type="checkbox"
                className="w-4 h-4 rounded bg-gray-950/70 border-cyan-500/50 text-cyan-400 focus:ring-cyan-500/50"
              />
            </label>
            
            {/* Show Track Lines */}
            <label className="flex items-center justify-between">
              <span className="text-xs text-white/70">Show track lines</span>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded bg-gray-950/70 border-cyan-500/50 text-cyan-400 focus:ring-cyan-500/50"
              />
            </label>
            
            {/* Update Frequency */}
            <div>
              <label className="text-xs text-white/70 block mb-1">Update frequency</label>
              <select className="w-full px-2 py-1 rounded bg-gray-950/70 border border-cyan-500/30 text-white text-xs">
                <option>Every 30 seconds</option>
                <option>Every 1 minute</option>
                <option>Every 5 minutes</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Track Statistics */}
        <div className="bg-gray-950/90 backdrop-blur-xl rounded-xl border border-cyan-500/30 p-4 mt-4">
          <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
            <Activity size={16} />
            Track Statistics
          </h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/60">Distance traveled</span>
              <span className="text-white">0.0 nm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Average speed</span>
              <span className="text-white">0.0 kts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Max speed</span>
              <span className="text-white">0.0 kts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Time tracking</span>
              <span className="text-white">00:00:00</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Status Bar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto z-30">
        <div className="bg-gray-950/90 backdrop-blur-xl rounded-full border border-cyan-500/30 px-6 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${trackingEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs text-white/70">
              {trackingEnabled ? 'Tracking Active' : 'Tracking Paused'}
            </span>
          </div>
          <div className="w-px h-4 bg-cyan-500/30" />
          <span className="text-xs text-white/70">
            {selectedVessel ? `Following: ${selectedVessel}` : 'No vessel selected'}
          </span>
        </div>
      </div>
    </>
  );
}
