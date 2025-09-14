'use client';

import { useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import { Navigation } from 'lucide-react';
import { useTrackingStore } from '@/lib/tracking/trackingStore';
import TrackingControls from './TrackingControls';
import TrackingMetrics from './TrackingMetrics';
import TrackingVesselList from './TrackingVesselList';
import TrackingMapLayer from './TrackingMapLayer';

interface TrackingSystemProps {
  map: mapboxgl.Map | null;
}

/**
 * Main tracking system component
 * This is the scalable approach - separating concerns:
 * - Store manages state
 * - Components are purely presentational
 * - Map layer handles all map interactions
 * - Each component can be tested independently
 */
export default function TrackingSystem({ map }: TrackingSystemProps) {
  const mode = useTrackingStore(state => state.mode);
  
  return (
    <>
      {/* Map Layer - Renders vessels on the map */}
      {map && <TrackingMapLayer map={map} />}
      
      {/* UI Panel - Positioned like Ocean Analysis */}
      <div className="absolute top-20 left-4 bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-blue-900/80 backdrop-blur-md rounded-2xl px-6 py-4 shadow-[0_0_30px_rgba(71,85,105,0.3)] z-50 border border-slate-500/30 w-80 max-h-[calc(100vh-100px)] overflow-y-auto">
        {/* Header */}
        <div className="relative">
          <h3 className="text-cyan-300 font-semibold mb-3 text-sm text-center flex items-center justify-center gap-2" 
              style={{ textShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }}>
            <Navigation size={14} className="text-cyan-400" 
                       style={{ filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))' }} />
            Vessel Tracking
            <span className="px-2 py-0.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 text-[10px] font-bold rounded-full border border-green-500/30 animate-pulse">
              LIVE
            </span>
          </h3>
        </div>
        
        {/* Mode Selector & Controls */}
        <TrackingControls />
        
        {/* Metrics Dashboard */}
        <TrackingMetrics />
        
        {/* Vessel List */}
        <TrackingVesselList />
        
        {/* Status Bar */}
        <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/30 mt-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">Mode: {mode}</span>
            <span className="text-gray-500">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
