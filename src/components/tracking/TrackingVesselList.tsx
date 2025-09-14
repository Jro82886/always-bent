'use client';

import { Anchor } from 'lucide-react';
import { useTrackingStore } from '@/lib/tracking/trackingStore';

export default function TrackingVesselList() {
  const { nearbyVessels, mode } = useTrackingStore();

  // Different vessel types based on mode
  const getVesselTypeLabel = () => {
    switch (mode) {
      case 'fleet': return 'Fleet Vessels';
      case 'commercial': return 'AIS Vessels';
      default: return 'Nearby Vessels';
    }
  };

  const getVesselColor = (vessel: any) => {
    switch (vessel.type) {
      case 'fleet': return 'text-green-400';
      case 'commercial': return 'text-blue-400';
      default: return 'text-cyan-400';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-2">
        <Anchor className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-white">{getVesselTypeLabel()}</span>
        <span className="ml-auto text-[10px] text-gray-400">{nearbyVessels.length} in range</span>
      </div>
      
      {nearbyVessels.length > 0 ? (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {nearbyVessels.map((vessel, i) => (
            <div key={vessel.id || i} className="flex items-center justify-between p-1.5 bg-black/30 rounded text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${getVesselColor(vessel)} bg-current`}></div>
                <span className="text-white">{vessel.name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span>{(vessel.speed * 1.94384).toFixed(1)} kts</span>
                <span className="text-[10px]">
                  {calculateDistance(vessel) < 1 
                    ? `${(calculateDistance(vessel) * 1000).toFixed(0)}m` 
                    : `${calculateDistance(vessel).toFixed(1)}nm`}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-gray-500">
            {mode === 'commercial' 
              ? 'Connecting to AIS data...' 
              : 'No vessels in range'}
          </p>
        </div>
      )}
    </div>
  );
}

// Calculate distance from user vessel
function calculateDistance(vessel: any): number {
  // This would normally calculate from user position
  // For now, return mock distance
  return Math.random() * 5;
}
