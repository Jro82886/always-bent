/**
 * Complete Tracking Page UI
 * Real-time vessel tracking with fleet intelligence
 */

"use client";
import { useState, useEffect } from 'react';
import { 
  Ship, Users, Activity, Navigation, Anchor, MapPin, 
  Clock, TrendingUp, AlertCircle, Eye, EyeOff, 
  Maximize2, Filter, Settings, Radio, Waves,
  ChevronDown, ChevronUp, Info, Target, Fish
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TrackingUIProps {
  map: any;
  showUser: boolean;
  showFleet: boolean;
  showCommercial: boolean;
  showTracks: boolean;
  setShowUser: (show: boolean) => void;
  setShowFleet: (show: boolean) => void;
  setShowCommercial: (show: boolean) => void;
  setShowTracks: (show: boolean) => void;
  selectedInlet?: string;
  selectedInletName?: string;
}

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
  type: 'arrival' | 'departure' | 'fishing' | 'bite';
  vessel: string;
  time: Date;
  location?: string;
}

export default function TrackingUI({
  map,
  showUser,
  showFleet,
  showCommercial,
  showTracks,
  setShowUser,
  setShowFleet,
  setShowCommercial,
  setShowTracks,
  selectedInlet,
  selectedInletName = 'No Inlet Selected'
}: TrackingUIProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'vessels' | 'activity' | 'intel'>('vessels');
  const [vesselStats, setVesselStats] = useState<VesselStats>({
    total: 0,
    active: 0,
    user: 1,
    fleet: 0,
    commercial: 0,
    fishing: 0
  });
  const [activityFeed, setActivityFeed] = useState<ActivityFeed[]>([]);
  const [trackLength, setTrackLength] = useState<'1h' | '3h' | '6h' | '12h'>('3h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load vessel stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/tracking/fleet');
        const data = await response.json();
        
        setVesselStats({
          total: data.vessels?.length || 0,
          active: data.vessels?.filter((v: any) => v.isActive).length || 0,
          user: 1,
          fleet: data.vessels?.filter((v: any) => v.type === 'fleet').length || 0,
          commercial: data.vessels?.filter((v: any) => v.type === 'commercial').length || 0,
          fishing: data.vessels?.filter((v: any) => v.activity === 'fishing').length || 0,
        });
      } catch (error) {
        console.error('[TRACKING UI] Error loading stats:', error);
      }
    };

    loadStats();
    if (autoRefresh) {
      const interval = setInterval(loadStats, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Mock activity feed
  useEffect(() => {
    setActivityFeed([
      {
        id: '1',
        type: 'fishing',
        vessel: 'Reel Deal',
        time: new Date(Date.now() - 1000 * 60 * 15),
        location: 'North Ledge'
      },
      {
        id: '2',
        type: 'arrival',
        vessel: 'Sea Hunter',
        time: new Date(Date.now() - 1000 * 60 * 45),
        location: selectedInlet
      },
      {
        id: '3',
        type: 'bite',
        vessel: 'Lucky Strike',
        time: new Date(Date.now() - 1000 * 60 * 90),
        location: '28.5°N 79.8°W'
      }
    ]);
  }, [selectedInlet]);

  return (
    <>
      {/* Main Control Panel - Left Side */}
      <div className="absolute top-20 left-4 z-40 w-80">
        <div className="bg-slate-900/95 backdrop-blur-md rounded-xl border border-cyan-500/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 px-4 py-3 border-b border-cyan-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ship className="text-cyan-400" size={18} />
                <h2 className="text-sm font-bold text-white">Fleet Tracking</h2>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {isExpanded && (
            <>
              {/* Stats Bar */}
              <div className="px-4 py-3 bg-slate-800/30 border-b border-slate-700/50">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-cyan-400">{vesselStats.total}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{vesselStats.active}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-400">{vesselStats.fishing}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Fishing</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-700/50">
                {(['vessels', 'activity', 'intel'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-all ${
                      activeTab === tab
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'vessels' && (
                  <div className="space-y-3">
                    {/* Vessel Toggles */}
                    <VesselToggle
                      label="Your Vessel"
                      icon={<div className="w-3 h-3 bg-white rounded-full shadow-lg shadow-white/50" />}
                      checked={showUser}
                      onChange={setShowUser}
                      count={vesselStats.user}
                    />
                    <VesselToggle
                      label="Fleet Vessels"
                      icon={<div className="w-3 h-3 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />}
                      checked={showFleet}
                      onChange={setShowFleet}
                      count={vesselStats.fleet}
                    />
                    <VesselToggle
                      label="Commercial"
                      icon={<div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[10px] border-transparent border-b-orange-500" />}
                      checked={showCommercial}
                      onChange={setShowCommercial}
                      count={vesselStats.commercial}
                    />

                    {/* Track Settings */}
                    <div className="pt-3 border-t border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-slate-300 flex items-center gap-2">
                          <Activity size={12} />
                          Show Tracks
                        </label>
                        <input
                          type="checkbox"
                          checked={showTracks}
                          onChange={(e) => setShowTracks(e.target.checked)}
                          className="toggle"
                        />
                      </div>
                      
                      {showTracks && (
                        <div className="flex gap-1 mt-2">
                          {(['1h', '3h', '6h', '12h'] as const).map((length) => (
                            <button
                              key={length}
                              onClick={() => setTrackLength(length)}
                              className={`flex-1 py-1 text-[10px] rounded transition-all ${
                                trackLength === length
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                  : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/30'
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
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activityFeed.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                    {activityFeed.length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No recent activity
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'intel' && (
                  <div className="space-y-3">
                    <IntelItem
                      icon={<Target className="text-yellow-400" size={14} />}
                      title="Hotspot Alert"
                      description="3 vessels fishing North Ledge"
                      time="15 min ago"
                    />
                    <IntelItem
                      icon={<TrendingUp className="text-green-400" size={14} />}
                      title="Fleet Movement"
                      description="5 boats heading offshore"
                      time="1 hour ago"
                    />
                    <IntelItem
                      icon={<Waves className="text-blue-400" size={14} />}
                      title="Conditions Update"
                      description="Seas building to 3-5ft"
                      time="2 hours ago"
                    />
                  </div>
                )}
              </div>

              {/* Footer Controls */}
              <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                  <button className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1">
                    <Settings size={12} />
                    Settings
                  </button>
                  <div className="flex items-center gap-2">
                    <Radio size={12} className={`${autoRefresh ? 'text-green-400 animate-pulse' : 'text-slate-600'}`} />
                    <label className="text-xs text-slate-400">
                      Auto-refresh
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="ml-2"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats Bar - Top Right */}
      <div className="absolute top-20 right-4 z-40">
        <div className="bg-slate-900/95 backdrop-blur-md rounded-lg px-4 py-2 border border-cyan-500/20 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <span className="text-xs text-slate-300">Last Update:</span>
            <span className="text-xs text-cyan-400 font-medium">Just now</span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <Navigation size={14} className="text-slate-400" />
            <span className="text-xs text-slate-300">Range:</span>
            <span className="text-xs text-cyan-400 font-medium">60nm</span>
          </div>
        </div>
      </div>

      {/* Enhanced Legend - Bottom Center Centerpiece */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
          {/* Active Inlet Display */}
          <div className="px-6 py-3 border-b border-cyan-500/20">
            <div className="flex items-center justify-center gap-3">
              <MapPin className="text-cyan-400" size={16} />
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Active Inlet</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {selectedInletName}
                </div>
              </div>
              {selectedInlet && (
                <div className="ml-2 px-2 py-1 bg-cyan-500/20 rounded-lg">
                  <span className="text-xs text-cyan-300 font-medium">
                    {vesselStats.total} vessels in area
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Fleet Color Legend */}
          <div className="px-6 py-3">
            <div className="flex items-center gap-8">
              {/* Your Position */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
                </div>
                <span className="text-xs text-white font-medium mt-2">YOU</span>
                <span className="text-[10px] text-cyan-400">GPS Active</span>
              </div>
              
              {/* Divider */}
              <div className="h-12 w-px bg-slate-700" />
              
              {/* Fleet by Inlet Colors */}
              <div className="flex flex-col">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Fleet Colors by Inlet</div>
                <div className="flex items-center gap-4">
                  <LegendItem 
                    icon={<div className={`w-3 h-3 rounded-full ${selectedInlet === 'jupiter' ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : 'bg-blue-400/40'}`} />}
                    label="Jupiter"
                  />
                  <LegendItem 
                    icon={<div className={`w-3 h-3 rounded-full ${selectedInlet === 'palm-beach' ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-green-400/40'}`} />}
                    label="Palm Beach"
                  />
                  <LegendItem 
                    icon={<div className={`w-3 h-3 rounded-full ${selectedInlet === 'stuart' ? 'bg-purple-400 shadow-lg shadow-purple-400/50' : 'bg-purple-400/40'}`} />}
                    label="Stuart"
                  />
                  <LegendItem 
                    icon={<div className={`w-3 h-3 rounded-full ${selectedInlet === 'fort-pierce' ? 'bg-orange-400 shadow-lg shadow-orange-400/50' : 'bg-orange-400/40'}`} />}
                    label="Ft Pierce"
                  />
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-12 w-px bg-slate-700" />
              
              {/* Vessel Status */}
              <div className="flex flex-col">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Activity Status</div>
                <div className="flex items-center gap-3">
                  <LegendItem 
                    icon={<Fish className="text-green-400" size={12} />}
                    label="Fishing"
                  />
                  <LegendItem 
                    icon={<Navigation className="text-yellow-400" size={12} />}
                    label="Moving"
                  />
                  <LegendItem 
                    icon={<Anchor className="text-red-400" size={12} />}
                    label="Anchored"
                  />
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-12 w-px bg-slate-700" />
              
              {/* Commercial */}
              <div className="flex flex-col items-center">
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[10px] border-transparent border-b-gray-400" />
                <span className="text-xs text-white font-medium mt-2">Commercial</span>
                <span className="text-[10px] text-gray-400">Non-Fleet</span>
              </div>
            </div>
          </div>
          
          {/* Track Length Control */}
          <div className="px-6 py-2 border-t border-cyan-500/20 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-400">Track History:</span>
            <div className="flex gap-1">
              {(['1h', '3h', '6h', '12h'] as const).map(length => (
                <button
                  key={length}
                  onClick={() => setTrackLength(length)}
                  className={`px-2 py-1 text-xs rounded transition-all ${
                    trackLength === length 
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' 
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                  {length}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Component helpers
function VesselToggle({ 
  label, 
  icon, 
  checked, 
  onChange, 
  count 
}: { 
  label: string; 
  icon: React.ReactNode; 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/30 transition-all">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-xs text-slate-500">({count})</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? 'bg-cyan-500/30' : 'bg-slate-700/50'
        }`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );
}

function ActivityItem({ activity }: { activity: ActivityFeed }) {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'fishing': return <Fish className="text-green-400" size={12} />;
      case 'arrival': return <Anchor className="text-blue-400" size={12} />;
      case 'departure': return <Navigation className="text-orange-400" size={12} />;
      case 'bite': return <Activity className="text-yellow-400" size={12} />;
    }
  };

  return (
    <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-800/30 transition-colors">
      <div className="mt-1">{getActivityIcon()}</div>
      <div className="flex-1">
        <div className="text-xs text-white font-medium">{activity.vessel}</div>
        <div className="text-[10px] text-slate-400">
          {activity.location && `${activity.location} • `}
          {formatDistanceToNow(activity.time, { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}

function IntelItem({ 
  icon, 
  title, 
  description, 
  time 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  time: string;
}) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700/30">
      <div className="mt-1">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-white font-medium">{title}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">{description}</div>
        <div className="text-[10px] text-slate-500 mt-1">{time}</div>
      </div>
    </div>
  );
}

function LegendItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}
