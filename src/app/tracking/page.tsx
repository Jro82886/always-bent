'use client';

import { useState, useEffect, useRef } from 'react';
import { MapShell } from '@/lib/MapRef';
import { useMapbox } from '@/lib/MapCtx';
import NavTabs from '@/components/NavTabs';
import TopHUD from '@/components/TopHUD';
import SimpleVesselMarkers from '@/components/tracking/SimpleVesselMarkers';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import { flyToInlet60nm } from '@/lib/inletBounds';
import { 
  Ship, Users, Activity, Navigation, Anchor, MapPin, 
  Clock, TrendingUp, AlertCircle, Eye, EyeOff, 
  Maximize2, Filter, Settings, Radio, Waves,
  ChevronDown, ChevronUp, Info, Target, Fish,
  Zap, Compass, Wind, ThermometerSun
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VesselStats {
  total: number;
  active: number;
  user: number;
  fleet: number;
  commercial: number;
  fishing: number;
}

interface ActivityFeed {
  id: string;
  type: 'arrival' | 'departure' | 'fishing' | 'bite' | 'hotspot';
  vessel?: string;
  message: string;
  time: Date;
  location?: string;
  priority?: 'high' | 'medium' | 'low';
}

export default function TrackingPage() {
  const map = useMapbox();
  const { selectedInletId } = useAppState();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // UI States
  const [isLeftPanelExpanded, setIsLeftPanelExpanded] = useState(true);
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'vessels' | 'activity' | 'intel'>('vessels');
  
  // Vessel visibility states
  const [showUser, setShowUser] = useState(true);
  const [showFleet, setShowFleet] = useState(true);
  const [showCommercial, setShowCommercial] = useState(true);
  const [showTracks, setShowTracks] = useState(false);
  const [trackLength, setTrackLength] = useState<'1h' | '3h' | '6h' | '12h'>('3h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Data states
  const [vesselStats, setVesselStats] = useState<VesselStats>({
    total: 12,
    active: 8,
    user: 1,
    fleet: 5,
    commercial: 6,
    fishing: 3
  });
  
  const [activityFeed, setActivityFeed] = useState<ActivityFeed[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Get user's saved location from welcome screen
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

  // Watch for inlet changes and fly to selected inlet
  useEffect(() => {
    if (!map || !selectedInletId) return;
    
    const inlet = getInletById(selectedInletId);
    if (inlet) {
      flyToInlet60nm(map, inlet);
      console.log(`[TRACKING] Flying to inlet: ${inlet.name}`);
    }
  }, [map, selectedInletId]);
  
  // Load mock activity feed
  useEffect(() => {
    const mockActivities: ActivityFeed[] = [
      {
        id: '1',
        type: 'hotspot',
        message: 'ABFI Hotspot detected!',
        time: new Date(Date.now() - 1000 * 60 * 5),
        location: 'North Ledge - 32nm',
        priority: 'high'
      },
      {
        id: '2',
        type: 'fishing',
        vessel: 'Reel Deal',
        message: 'Started fishing',
        time: new Date(Date.now() - 1000 * 60 * 15),
        location: 'Canyon Edge',
        priority: 'medium'
      },
      {
        id: '3',
        type: 'bite',
        vessel: 'Lucky Strike',
        message: 'Reported bite via ABFI',
        time: new Date(Date.now() - 1000 * 60 * 30),
        location: '28.5°N 79.8°W',
        priority: 'medium'
      },
      {
        id: '4',
        type: 'arrival',
        vessel: 'Sea Hunter',
        message: 'Arrived at inlet',
        time: new Date(Date.now() - 1000 * 60 * 45),
        location: selectedInletId || 'Unknown',
        priority: 'low'
      },
      {
        id: '5',
        type: 'departure',
        vessel: 'Wave Runner',
        message: 'Departed inlet',
        time: new Date(Date.now() - 1000 * 60 * 90),
        location: selectedInletId || 'Unknown',
        priority: 'low'
      }
    ];
    setActivityFeed(mockActivities);
  }, [selectedInletId]);
  
  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Here you would refresh vessel positions
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <MapShell>
      <NavTabs />
      <TopHUD includeAbfi={false} />
      
      {/* Vessel Markers */}
      {map && (
        <SimpleVesselMarkers 
          map={map}
          showUser={showUser}
          showFleet={showFleet}
          showCommercial={showCommercial}
          showTracks={showTracks}
        />
      )}
      
      {/* Left Panel - Fleet Control */}
      <div className="absolute top-20 left-4 z-40 w-80">
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden">
          {/* Header with Glow */}
          <div className="relative bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-cyan-600/10 px-4 py-3 border-b border-cyan-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-pulse" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                  <Ship className="text-cyan-400" size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Fleet Intelligence</h2>
                  <p className="text-[10px] text-cyan-400/70">Real-time tracking</p>
                </div>
              </div>
              <button
                onClick={() => setIsLeftPanelExpanded(!isLeftPanelExpanded)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors p-1 hover:bg-cyan-500/10 rounded"
              >
                {isLeftPanelExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {isLeftPanelExpanded && (
            <>
              {/* Live Stats Grid */}
              <div className="px-4 py-3 bg-gradient-to-b from-slate-800/50 to-slate-900/50 border-b border-slate-700/50">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center border border-slate-700/30">
                    <div className="text-lg font-bold text-cyan-400">{vesselStats.total}</div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">Total</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center border border-green-500/20">
                    <div className="text-lg font-bold text-green-400">{vesselStats.active}</div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">Active</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center border border-orange-500/20">
                    <div className="text-lg font-bold text-orange-400 animate-pulse">{vesselStats.fishing}</div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">Fishing</div>
                  </div>
                </div>
              </div>

              {/* Modern Tabs */}
              <div className="flex bg-slate-900/50">
                {(['vessels', 'activity', 'intel'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-3 py-2.5 text-xs font-medium capitalize transition-all relative ${
                      activeTab === tab
                        ? 'text-cyan-400 bg-gradient-to-t from-cyan-500/10 to-transparent'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'vessels' && (
                  <div className="space-y-2">
                    {/* Your Vessel */}
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30 hover:border-cyan-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-4 h-4 bg-white rounded-full shadow-lg shadow-white/50" />
                            <div className="absolute inset-0 w-4 h-4 bg-white rounded-full animate-ping opacity-30" />
                          </div>
                          <div>
                            <span className="text-sm text-white font-medium">Your Vessel</span>
                            <div className="text-[10px] text-cyan-400">GPS Active</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowUser(!showUser)}
                          className={`relative w-11 h-6 rounded-full transition-all ${
                            showUser 
                              ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-500/50' 
                              : 'bg-slate-700/50 border border-slate-600/50'
                          }`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-lg ${
                            showUser ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Fleet Vessels */}
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30 hover:border-cyan-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-4 h-4 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />
                            {showFleet && <div className="absolute inset-0 w-4 h-4 bg-cyan-400 rounded-full animate-pulse opacity-50" />}
                          </div>
                          <div>
                            <span className="text-sm text-white font-medium">Fleet Vessels</span>
                            <div className="text-[10px] text-slate-400">{vesselStats.fleet} active</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowFleet(!showFleet)}
                          className={`relative w-11 h-6 rounded-full transition-all ${
                            showFleet 
                              ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-500/50' 
                              : 'bg-slate-700/50 border border-slate-600/50'
                          }`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-lg ${
                            showFleet ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Commercial */}
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30 hover:border-orange-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-transparent border-b-orange-500 filter drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                          <div>
                            <span className="text-sm text-white font-medium">Commercial</span>
                            <div className="text-[10px] text-slate-400">{vesselStats.commercial} vessels</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowCommercial(!showCommercial)}
                          className={`relative w-11 h-6 rounded-full transition-all ${
                            showCommercial 
                              ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 border border-orange-500/50' 
                              : 'bg-slate-700/50 border border-slate-600/50'
                          }`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-lg ${
                            showCommercial ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Track Settings */}
                    <div className="mt-4 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs text-slate-300 flex items-center gap-2">
                          <Activity size={14} className="text-cyan-400" />
                          Vessel Tracks
                        </label>
                        <button
                          onClick={() => setShowTracks(!showTracks)}
                          className={`relative w-11 h-6 rounded-full transition-all ${
                            showTracks 
                              ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-500/50' 
                              : 'bg-slate-700/50 border border-slate-600/50'
                          }`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-lg ${
                            showTracks ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                      
                      {showTracks && (
                        <div className="flex gap-1">
                          {(['1h', '3h', '6h', '12h'] as const).map((length) => (
                            <button
                              key={length}
                              onClick={() => setTrackLength(length)}
                              className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-all ${
                                trackLength === length
                                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/20'
                                  : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/30 border border-slate-700/30'
                              }`}
                            >
                              {length}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                    {activityFeed.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} />
                    ))}
                  </div>
                )}

                {activeTab === 'intel' && (
                  <div className="space-y-2">
                    <IntelCard
                      icon={<Zap className="text-yellow-400" size={14} />}
                      title="ABFI Hotspot"
                      description="Multiple bites reported - North Ledge"
                      time="5 min ago"
                      priority="high"
                    />
                    <IntelCard
                      icon={<TrendingUp className="text-green-400" size={14} />}
                      title="Fleet Movement"
                      description="5 boats converging on canyon edge"
                      time="15 min ago"
                      priority="medium"
                    />
                    <IntelCard
                      icon={<ThermometerSun className="text-orange-400" size={14} />}
                      title="SST Break"
                      description="Strong temp break forming 32nm SE"
                      time="1 hour ago"
                      priority="medium"
                    />
                    <IntelCard
                      icon={<Wind className="text-blue-400" size={14} />}
                      title="Weather Update"
                      description="Winds laying down, seas 2-3ft"
                      time="2 hours ago"
                      priority="low"
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-gradient-to-t from-slate-900 to-slate-800/50 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio size={12} className={`${autoRefresh ? 'text-green-400 animate-pulse' : 'text-slate-600'}`} />
                    <span className="text-[10px] text-slate-400">
                      {autoRefresh ? 'Live' : 'Paused'}
                    </span>
                  </div>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {autoRefresh ? 'Pause' : 'Resume'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Quick Stats */}
      <div className="absolute top-20 right-4 z-40">
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-xl border border-cyan-500/20 shadow-xl shadow-cyan-500/10 px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-cyan-400" />
              <div>
                <div className="text-[10px] text-slate-400">Last Update</div>
                <div className="text-xs text-white font-medium">
                  {formatDistanceToNow(lastUpdate, { addSuffix: true })}
                </div>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="flex items-center gap-2">
              <Compass size={14} className="text-cyan-400" />
              <div>
                <div className="text-[10px] text-slate-400">Range</div>
                <div className="text-xs text-white font-medium">60nm</div>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="flex items-center gap-2">
              <Navigation size={14} className="text-green-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400">Tracking</div>
                <div className="text-xs text-green-400 font-medium">Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legend */}
      <div className="absolute bottom-8 right-4 z-40">
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-xl border border-cyan-500/20 shadow-xl shadow-cyan-500/10 px-4 py-3">
          <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-3">Vessel Types</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-white rounded-full shadow-lg shadow-white/50" />
              </div>
              <span className="text-xs text-slate-300">Your Position</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />
              <span className="text-xs text-slate-300">Fleet Member</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[10px] border-transparent border-b-orange-500" />
              <span className="text-xs text-slate-300">Commercial</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              <span className="text-xs text-slate-300">Track History</span>
            </div>
          </div>
        </div>
      </div>
    </MapShell>
  );
}

// Helper Components
function ActivityCard({ activity }: { activity: ActivityFeed }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'hotspot': return <Zap className="text-yellow-400" size={12} />;
      case 'fishing': return <Fish className="text-green-400" size={12} />;
      case 'bite': return <Activity className="text-cyan-400" size={12} />;
      case 'arrival': return <Anchor className="text-blue-400" size={12} />;
      case 'departure': return <Navigation className="text-orange-400" size={12} />;
      default: return <Info className="text-slate-400" size={12} />;
    }
  };

  const getPriorityColor = () => {
    switch (activity.priority) {
      case 'high': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'medium': return 'border-cyan-500/30 bg-cyan-500/5';
      default: return 'border-slate-700/30 bg-slate-800/30';
    }
  };

  return (
    <div className={`rounded-lg p-2.5 border transition-all hover:scale-[1.02] ${getPriorityColor()}`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1">
          <div className="text-xs text-white font-medium">
            {activity.vessel && <span className="text-cyan-400">{activity.vessel}: </span>}
            {activity.message}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {activity.location && `${activity.location} • `}
            {formatDistanceToNow(activity.time, { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
}

function IntelCard({ 
  icon, 
  title, 
  description, 
  time,
  priority 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  time: string;
  priority: 'high' | 'medium' | 'low';
}) {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10';
      case 'medium': return 'border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10';
      default: return 'border-slate-700/30 bg-slate-800/30';
    }
  };

  return (
    <div className={`rounded-lg p-3 border transition-all hover:scale-[1.02] ${getPriorityColor()}`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="text-xs text-white font-semibold">{title}</div>
          <div className="text-[10px] text-slate-300 mt-0.5">{description}</div>
          <div className="text-[10px] text-slate-500 mt-1">{time}</div>
        </div>
      </div>
    </div>
  );
}