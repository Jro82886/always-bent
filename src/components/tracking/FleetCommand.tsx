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
  Anchor,
  ChevronRight,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activityLevel, setActivityLevel] = useState<'HIGH' | 'MODERATE' | 'LOW'>('LOW');
  
  // Debug log to ensure component is mounting
  useEffect(() => {
    console.log('FleetCommand mounted', { isTracking, fleetCount, fishingCount });
  }, []);

  // Calculate activity level based on fleet concentration
  useEffect(() => {
    if (fishingCount >= 5) setActivityLevel('HIGH');
    else if (fishingCount >= 2) setActivityLevel('MODERATE');
    else setActivityLevel('LOW');
  }, [fishingCount]);

  const getHeadingLabel = (heading: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  const getSpeedStatus = (speed: number) => {
    if (speed < 1) return { label: 'Anchored', color: 'text-gray-400' };
    if (speed < 3) return { label: 'Drifting', color: 'text-yellow-400' };
    if (speed < 10) return { label: 'Cruising', color: 'text-cyan-400' };
    return { label: 'Running', color: 'text-green-400' };
  };

  const speedStatus = getSpeedStatus(userSpeed);

  // Minimized view - just a small indicator
  if (isMinimized) {
    return (
      <div className="fixed top-20 left-4 z-[100] pointer-events-auto">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gray-950/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-3 py-2 flex items-center gap-2 hover:border-cyan-500/40 transition-all group shadow-lg"
        >
          <Radio className={`w-4 h-4 ${isTracking ? 'text-cyan-400' : 'text-gray-500'}`} />
          <span className="text-xs text-cyan-400/80 font-light">Fleet</span>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-white/60">{fleetCount}</span>
            <Users className="w-3 h-3 text-cyan-400/60" />
          </div>
          <Maximize2 className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 transition-colors" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-20 left-4 z-[100] pointer-events-auto">
      <div className={`bg-gray-950/95 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-64'
      }`}>
        {/* Sleek Header */}
        <div className="px-4 py-3 border-b border-cyan-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className={`w-4 h-4 ${isTracking ? 'text-cyan-400' : 'text-gray-500'}`} />
              {isTracking && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-sm font-light text-cyan-400/90 tracking-wide">Fleet Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-cyan-400 transition-colors"
            >
              {isExpanded ? <ChevronRight className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-500 hover:text-cyan-400 transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-3">
          {/* Quick Status Bar */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800/50">
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleTracking}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isTracking 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
                }`}
              >
                {isTracking ? (
                  <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Live
                  </span>
                ) : (
                  'Start Tracking'
                )}
              </button>
              
              {isTracking && (
                <div className="flex items-center gap-2 text-xs">
                  <span className={speedStatus.color}>{speedStatus.label}</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-cyan-400/70">{userSpeed.toFixed(1)}kt</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-cyan-400/70">{getHeadingLabel(userHeading)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fleet Overview - Clean Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gray-900/40 rounded-lg p-2 border border-gray-800/50">
              <div className="text-xs text-gray-500 mb-0.5">Active</div>
              <div className="text-lg font-light text-white">{fleetCount}</div>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-2 border border-gray-800/50">
              <div className="text-xs text-gray-500 mb-0.5">Fishing</div>
              <div className="text-lg font-light text-yellow-400">{fishingCount}</div>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-2 border border-gray-800/50">
              <div className="text-xs text-gray-500 mb-0.5">Activity</div>
              <div className={`text-sm font-light mt-1 ${
                activityLevel === 'HIGH' ? 'text-red-400' :
                activityLevel === 'MODERATE' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {activityLevel}
              </div>
            </div>
          </div>

          {/* Layer Controls - Sleek Toggles */}
          <div className="space-y-1.5">
            <button
              onClick={onToggleFleet}
              disabled={!isTracking}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                showFleet 
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                  : 'bg-gray-900/30 border border-gray-800/50 text-gray-500 hover:border-gray-700/50'
              } ${!isTracking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="flex items-center gap-2 text-xs">
                <Users className="w-3.5 h-3.5" />
                Community Fleet
              </span>
              {showFleet ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onToggleTrails}
              disabled={!isTracking}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                showTrails 
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                  : 'bg-gray-900/30 border border-gray-800/50 text-gray-500 hover:border-gray-700/50'
              } ${!isTracking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="flex items-center gap-2 text-xs">
                <Activity className="w-3.5 h-3.5" />
                Vessel Trails
              </span>
              {showTrails ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onToggleGFW}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                showGFW 
                  ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                  : 'bg-gray-900/30 border border-gray-800/50 text-gray-500 hover:border-gray-700/50'
              }`}
            >
              <span className="flex items-center gap-2 text-xs">
                <Anchor className="w-3.5 h-3.5" />
                Commercial (GFW)
              </span>
              {showGFW ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-800/50">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-cyan-400 transition-colors"
              >
                <span>Fleet Details</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
              </button>
              
              {showDetails && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Peak Activity</span>
                    <span className="text-cyan-400">6:00-8:00 AM</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Avg Distance</span>
                    <span className="text-white">12.5 nm</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Hot Zone</span>
                    <span className="text-yellow-400">60-80ft depth</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fair Exchange Notice */}
          {!isTracking && showFleet && (
            <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5" />
                <p className="text-xs text-yellow-400/80">
                  Share your position to see other vessels
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}