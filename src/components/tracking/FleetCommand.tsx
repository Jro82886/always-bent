'use client';

import { useState, useEffect } from 'react';
import { 
  Navigation, 
  Activity, 
  Users, 
  Radio, 
  Layers,
  AlertCircle,
  TrendingUp,
  Clock,
  Zap,
  Anchor
} from 'lucide-react';
import { useAppState } from '@/store/appState';

interface FleetCommandProps {
  isTracking: boolean;
  onToggleTracking: () => void;
  fleetCount: number;
  fishingCount: number;
  showFleet: boolean;
  onToggleFleet: () => void;
  showTrails: boolean;
  onToggleTrails: () => void;
  showGFW: boolean;
  onToggleGFW: () => void;
  userSpeed?: number;
  userHeading?: number;
  boatName?: string;
}

export default function FleetCommand({
  isTracking,
  onToggleTracking,
  fleetCount,
  fishingCount,
  showFleet,
  onToggleFleet,
  showTrails,
  onToggleTrails,
  showGFW,
  onToggleGFW,
  userSpeed = 0,
  userHeading = 0,
  boatName = 'My Vessel'
}: FleetCommandProps) {
  const { username } = useAppState();
  const [isExpanded, setIsExpanded] = useState(true);
  const [radarSweep, setRadarSweep] = useState(false);
  const [activityLevel, setActivityLevel] = useState<'HIGH' | 'MODERATE' | 'LOW'>('LOW');

  // Calculate activity level based on fleet concentration
  useEffect(() => {
    if (fishingCount >= 5) setActivityLevel('HIGH');
    else if (fishingCount >= 2) setActivityLevel('MODERATE');
    else setActivityLevel('LOW');
  }, [fishingCount]);

  // Trigger radar sweep on fleet update
  useEffect(() => {
    setRadarSweep(true);
    const timer = setTimeout(() => setRadarSweep(false), 1000);
    return () => clearTimeout(timer);
  }, [fleetCount]);

  const getHeadingLabel = (heading: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  const getSpeedColor = (speed: number) => {
    if (speed < 3) return 'text-yellow-400'; // Loitering/Fishing
    if (speed < 10) return 'text-cyan-400';  // Cruising
    return 'text-green-400';  // Running
  };

  return (
    <div className="absolute top-20 left-4 z-40 w-80">
      <div className="bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20 flex items-center justify-between hover:from-cyan-500/20 hover:to-blue-500/20 transition-all"
        >
          <div className="flex items-center gap-2">
            <Radio className={`w-5 h-5 ${isTracking ? 'text-cyan-400 animate-pulse' : 'text-gray-500'}`} />
            <span className="text-cyan-300 font-bold tracking-wide">FLEET COMMAND</span>
          </div>
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Your Vessel Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-cyan-400/60 uppercase tracking-wider">
                <Anchor className="w-3 h-3" />
                Your Vessel
              </div>
              
              <div className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-lg p-3 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="text-white font-medium">{boatName}</span>
                  </div>
                  <button
                    onClick={onToggleTracking}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isTracking 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                    }`}
                  >
                    {isTracking ? 'STOP SHARING' : 'START SHARING'}
                  </button>
                </div>
                
                {isTracking && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`w-4 h-4 ${getSpeedColor(userSpeed)}`} />
                      <span className={getSpeedColor(userSpeed)}>{userSpeed.toFixed(1)} kts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Navigation className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-400">{getHeadingLabel(userHeading)}</span>
                    </div>
                  </div>
                )}
                
                {!isTracking && (
                  <div className="text-xs text-yellow-400/60 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Share position to see fleet
                  </div>
                )}
              </div>
            </div>

            {/* Fleet Status Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-cyan-400/60 uppercase tracking-wider">
                <Users className="w-3 h-3" />
                Fleet Status
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-500/10 relative overflow-hidden">
                {/* Radar Sweep Effect */}
                {radarSweep && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-sweep" />
                  </div>
                )}
                
                <div className="space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Active Vessels</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 font-bold">{fleetCount}</span>
                      {fleetCount > 0 && (
                        <div className="flex gap-0.5">
                          {[...Array(Math.min(fleetCount, 5))].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" 
                                 style={{ animationDelay: `${i * 100}ms` }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Fishing Now</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${fishingCount > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {fishingCount}
                      </span>
                      {fishingCount > 0 && (
                        <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Activity Level</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                      activityLevel === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                      activityLevel === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {activityLevel}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Peak Time</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-400 text-sm">6:00-8:00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Layer Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-cyan-400/60 uppercase tracking-wider">
                <Layers className="w-3 h-3" />
                Layers
              </div>
              
              <div className="space-y-2">
                {/* Community Fleet */}
                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-cyan-500/5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showFleet}
                      onChange={onToggleFleet}
                      disabled={!isTracking}
                      className="w-4 h-4 rounded border-cyan-500/30 bg-black/50 text-cyan-400 focus:ring-cyan-400 focus:ring-offset-0"
                    />
                    <span className={`text-sm ${!isTracking ? 'text-gray-500' : 'text-white'}`}>
                      Community Fleet
                    </span>
                  </div>
                  {showFleet && (
                    <div className="flex gap-0.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                    </div>
                  )}
                </label>

                {/* Vessel Trails */}
                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-cyan-500/5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showTrails}
                      onChange={onToggleTrails}
                      disabled={!isTracking || !showFleet}
                      className="w-4 h-4 rounded border-cyan-500/30 bg-black/50 text-cyan-400 focus:ring-cyan-400 focus:ring-offset-0"
                    />
                    <span className={`text-sm ${!isTracking || !showFleet ? 'text-gray-500' : 'text-white'}`}>
                      Vessel Trails (4hr)
                    </span>
                  </div>
                  {showTrails && (
                    <span className="text-xs text-cyan-400/60">Fade</span>
                  )}
                </label>

                {/* Commercial (GFW) */}
                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-cyan-500/5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showGFW}
                      onChange={onToggleGFW}
                      className="w-4 h-4 rounded border-cyan-500/30 bg-black/50 text-cyan-400 focus:ring-cyan-400 focus:ring-offset-0"
                    />
                    <span className="text-sm text-white">Commercial (GFW)</span>
                  </div>
                  {showGFW && (
                    <Zap className="w-4 h-4 text-cyan-400" />
                  )}
                </label>

                {/* Fishing Hotspots - Coming Soon */}
                <label className="flex items-center justify-between p-2 rounded-lg opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled
                      className="w-4 h-4 rounded border-gray-600 bg-black/50"
                    />
                    <span className="text-sm text-gray-500">Fishing Hotspots</span>
                  </div>
                  <span className="text-xs text-gray-600">Soon</span>
                </label>
              </div>
            </div>

            {/* Member Badge */}
            <div className="pt-2 border-t border-cyan-500/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-400/60">VESSEL</span>
                <span className="text-cyan-400 font-medium">{boatName}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-cyan-400/60">TRUSTED NETWORK</span>
                <span className="text-green-400 font-medium">MEMBERS ONLY</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
