'use client';

import { useState, useEffect } from 'react';
import { MapShell } from '@/lib/MapRef';
import { useMapbox } from '@/lib/MapCtx';
import NavTabs from '@/components/NavTabs';
import TopHUD from '@/components/TopHUD';
import GeoControls from '@/components/GeoControls';
import VesselMap from '@/components/tracking/VesselMap';
import AnalyticsDashboard from '@/components/tracking/AnalyticsDashboard';
import { 
  Radio, Users, Activity, Map, Eye, EyeOff, 
  Anchor, Ship, Navigation, Waves, AlertTriangle,
  TrendingUp, Clock, MapPin, Compass, Signal,
  User, Building2, Filter, Settings, ChevronRight,
  Globe, Zap, Shield, BarChart3, Info, Layers,
  Target, Radar, Maximize2, Menu, X, ChevronLeft,
  Wifi, WifiOff, Battery, BatteryLow, Gauge
} from 'lucide-react';

type TrackingMode = 'individual' | 'fleet' | 'commercial';
type ViewMode = 'map' | 'analytics' | 'split';

interface VesselData {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  heading: number;
  speed: number;
  status: string;
  lastUpdate: Date;
  captain?: string;
}

export default function TrackingPage() {
  const map = useMapbox();
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('individual');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isTracking, setIsTracking] = useState(false);
  const [showMyPosition, setShowMyPosition] = useState(true);
  const [showFleet, setShowFleet] = useState(true);
  const [showTrails, setShowTrails] = useState(false);
  const [showGFW, setShowGFW] = useState(false);
  const [showAIS, setShowAIS] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<VesselData | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    // Initialize map for tracking
    if (map) {
      console.log('[TRACKING] Map ready for tracking features');
      
      // Set initial view
      map.flyTo({
        center: [-74.0, 40.7],
        zoom: 10,
        duration: 1000
      });
    }
  }, [map]);

  const handleVesselSelect = (vessel: VesselData) => {
    setSelectedVessel(vessel);
    if (map) {
      map.flyTo({
        center: vessel.position,
        zoom: 12,
        duration: 1000
      });
    }
  };

  return (
    <div className="w-full h-screen bg-gray-950">
      <MapShell>
        <div className="pointer-events-none absolute inset-0">
          <NavTabs />
          <TopHUD includeAbfi={false} />
          
          {/* Advanced View Mode Selector - Top Right */}
          <div className="absolute top-20 right-4 pointer-events-auto z-20">
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl p-1">
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'map'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  Map
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'analytics'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'split'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                  Split
                </button>
              </div>
            </div>
          </div>
          
          {/* Main Tracking Control Panel - Left Side */}
          <div className={`absolute top-20 left-4 transition-all duration-300 pointer-events-auto z-20 ${
            showSidebar ? 'w-96' : 'w-auto'
          }`}>
            {/* Sidebar Toggle */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="absolute -right-3 top-8 w-6 h-12 bg-black/90 border border-cyan-500/20 rounded-r-lg flex items-center justify-center hover:bg-cyan-500/20 transition-colors"
            >
              {showSidebar ? <ChevronLeft className="w-4 h-4 text-cyan-400" /> : <Menu className="w-4 h-4 text-cyan-400" />}
            </button>

            {showSidebar ? (
              <>
                {/* Mode Selector - Ultra Modern Tab Design */}
                <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl p-2 mb-4">
                  <div className="grid grid-cols-3 gap-1 p-1 bg-gray-900/50 rounded-xl">
                    <button
                      onClick={() => setTrackingMode('individual')}
                      className={`relative px-4 py-3 rounded-lg font-medium transition-all ${
                        trackingMode === 'individual'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <User className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs">Individual</span>
                      {trackingMode === 'individual' && (
                        <div className="absolute inset-0 rounded-lg ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-black/50" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => setTrackingMode('fleet')}
                      className={`relative px-4 py-3 rounded-lg font-medium transition-all ${
                        trackingMode === 'fleet'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <Users className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs">Fleet</span>
                      {trackingMode === 'fleet' && (
                        <div className="absolute inset-0 rounded-lg ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-black/50" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => setTrackingMode('commercial')}
                      className={`relative px-4 py-3 rounded-lg font-medium transition-all ${
                        trackingMode === 'commercial'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <Building2 className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs">Commercial</span>
                      {trackingMode === 'commercial' && (
                        <div className="absolute inset-0 rounded-lg ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-black/50" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mode-Specific Control Panel */}
                <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl p-6">
                  {/* Individual Tracking Mode */}
                  {trackingMode === 'individual' && (
                    <>
                      {/* Header with Live Status */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-cyan-500/10 rounded-lg relative">
                            <Navigation className="w-6 h-6 text-cyan-400" />
                            {isTracking && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">Personal Tracking</h2>
                            <p className="text-xs text-gray-400">Share location • See nearby vessels</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsTracking(!isTracking)}
                          className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                            isTracking 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25' 
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {isTracking ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                          {isTracking ? 'Sharing ON' : 'Start Sharing'}
                        </button>
                      </div>

                      {/* Personal Stats with Live Updates */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
                          <MapPin className="w-5 h-5 text-cyan-400 mb-2" />
                          <p className="text-sm text-gray-400">Your Position</p>
                          <p className="text-lg font-semibold text-white">40.7128°N</p>
                          <p className="text-lg font-semibold text-white">74.0060°W</p>
                          <p className="text-xs text-cyan-300 mt-1">± 5m accuracy</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
                          <Users className="w-5 h-5 text-green-400 mb-2" />
                          <p className="text-sm text-gray-400">Vessels Nearby</p>
                          <p className="text-2xl font-bold text-white">8</p>
                          <p className="text-xs text-green-300">within 5nm</p>
                          <div className="mt-2 flex gap-1">
                            {[1,2,3,4].map(i => (
                              <div key={i} className="w-2 h-2 bg-green-400 rounded-full" />
                            ))}
                            <span className="text-xs text-gray-400 ml-1">+4</span>
                          </div>
                        </div>
                      </div>

                      {/* Device Status */}
                      <div className="mb-6 p-3 bg-gray-900/50 rounded-lg border border-gray-800/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Battery className="w-5 h-5 text-green-400" />
                            <div>
                              <p className="text-sm text-gray-300">Device Status</p>
                              <p className="text-xs text-gray-500">GPS Active • 87% Battery</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Signal className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-green-400">Strong</span>
                          </div>
                        </div>
                      </div>

                      {/* Privacy & Safety Settings */}
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Privacy & Safety</div>
                        
                        <button className="w-full flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                              <span className="text-sm text-gray-300">Anonymous Mode</span>
                              <p className="text-xs text-gray-500">Hide your vessel name</p>
                            </div>
                          </div>
                          <div className="relative w-12 h-6 bg-gray-700 rounded-full">
                            <div className="absolute w-5 h-5 bg-gray-500 rounded-full top-0.5 left-0.5 transition-transform" />
                          </div>
                        </button>

                        <button className="w-full flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            <div className="text-left">
                              <span className="text-sm text-gray-300">Emergency Beacon</span>
                              <p className="text-xs text-gray-500">Send SOS with location</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Fleet Tracking Mode */}
                  {trackingMode === 'fleet' && (
                    <>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                            <Ship className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">Fleet Command</h2>
                            <p className="text-xs text-gray-400">Monitor your fleet in real-time</p>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors group">
                          <Settings className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform" />
                        </button>
                      </div>

                      {/* Fleet Overview - Enhanced */}
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-3 border border-cyan-500/30">
                          <p className="text-2xl font-bold text-white">24</p>
                          <p className="text-xs text-cyan-300">Total Fleet</p>
                          <div className="mt-1 h-1 bg-cyan-900/50 rounded-full overflow-hidden">
                            <div className="h-full w-3/4 bg-gradient-to-r from-cyan-400 to-blue-400" />
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-500/30">
                          <p className="text-2xl font-bold text-green-400">18</p>
                          <p className="text-xs text-green-300">Active</p>
                          <div className="mt-1 flex gap-0.5">
                            {[...Array(6)].map((_, i) => (
                              <div key={i} className="flex-1 h-1 bg-green-400 rounded-full" />
                            ))}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-3 border border-yellow-500/30">
                          <p className="text-2xl font-bold text-yellow-400">6</p>
                          <p className="text-xs text-yellow-300">Fishing</p>
                          <Activity className="w-3 h-3 text-yellow-400 mt-1" />
                        </div>
                      </div>

                      {/* Fleet Performance Metrics */}
                      <div className="mb-6 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Today's Performance
                          </h3>
                          <span className="text-xs text-purple-400">↑ 12%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-400">Total Catch</p>
                            <p className="text-lg font-semibold text-white">2,450 lbs</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Fuel Used</p>
                            <p className="text-lg font-semibold text-white">850 gal</p>
                          </div>
                        </div>
                      </div>

                      {/* Fleet Filters - Enhanced */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wider">
                          <span>Fleet Filters</span>
                          <button className="text-cyan-400 hover:text-cyan-300 transition-colors">Clear all</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-xs text-cyan-300 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                            All Vessels
                          </button>
                          <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:border-gray-600 flex items-center justify-center gap-2">
                            <Navigation className="w-3 h-3" />
                            Active Only
                          </button>
                          <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:border-gray-600 flex items-center justify-center gap-2">
                            <Anchor className="w-3 h-3" />
                            At Anchor
                          </button>
                          <button className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:border-gray-600 flex items-center justify-center gap-2">
                            <Activity className="w-3 h-3" />
                            Fishing
                          </button>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setShowAnalytics(true)}
                          className="p-3 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 rounded-lg text-sm text-gray-300 transition-all flex items-center gap-2 group"
                        >
                          <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          Fleet Analytics
                        </button>
                        <button className="p-3 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 rounded-lg text-sm text-gray-300 transition-all flex items-center gap-2 group">
                          <Zap className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                          Alerts (3)
                        </button>
                      </div>
                    </>
                  )}

                  {/* Commercial Tracking Mode */}
                  {trackingMode === 'commercial' && (
                    <>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                            <Globe className="w-6 h-6 text-purple-400" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">Commercial Traffic</h2>
                            <p className="text-xs text-gray-400">AIS & Global Fishing Watch</p>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                          <Filter className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>

                      {/* Traffic Overview */}
                      <div className="mb-6 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                            <Radar className="w-4 h-4" />
                            Area Traffic Density
                          </h3>
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">High</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-2xl font-bold text-white">156</p>
                            <p className="text-xs text-gray-400">Total Vessels</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-400">42</p>
                            <p className="text-xs text-gray-400">Commercial</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-yellow-400">8</p>
                            <p className="text-xs text-gray-400">High Risk</p>
                          </div>
                        </div>
                      </div>

                      {/* Data Sources - Enhanced */}
                      <div className="space-y-3 mb-6">
                        <button
                          onClick={() => setShowAIS(!showAIS)}
                          className={`w-full p-4 rounded-xl border transition-all ${
                            showAIS
                              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30'
                              : 'bg-gray-900/50 border-gray-800/50 hover:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${showAIS ? 'bg-purple-500/20' : 'bg-gray-800'}`}>
                                <Radio className={`w-5 h-5 ${showAIS ? 'text-purple-400' : 'text-gray-500'}`} />
                              </div>
                              <div className="text-left">
                                <p className={`font-medium ${showAIS ? 'text-purple-300' : 'text-gray-300'}`}>
                                  AIS Vessels
                                </p>
                                <p className="text-xs text-gray-500">Commercial & cargo ships</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {showAIS && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                              <Eye className={`w-5 h-5 ${showAIS ? 'text-purple-400' : 'text-gray-600'}`} />
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => setShowGFW(!showGFW)}
                          className={`w-full p-4 rounded-xl border transition-all ${
                            showGFW
                              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30'
                              : 'bg-gray-900/50 border-gray-800/50 hover:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${showGFW ? 'bg-purple-500/20' : 'bg-gray-800'}`}>
                                <Globe className={`w-5 h-5 ${showGFW ? 'text-purple-400' : 'text-gray-500'}`} />
                              </div>
                              <div className="text-left">
                                <p className={`font-medium ${showGFW ? 'text-purple-300' : 'text-gray-300'}`}>
                                  Global Fishing Watch
                                </p>
                                <p className="text-xs text-gray-500">Industrial fishing activity</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {showGFW && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                              <Eye className={`w-5 h-5 ${showGFW ? 'text-purple-400' : 'text-gray-600'}`} />
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Vessel Type Filters - Enhanced */}
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Vessel Types</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { name: 'Cargo', icon: '🚢', active: false },
                            { name: 'Tanker', icon: '⛽', active: false },
                            { name: 'Fishing', icon: '🎣', active: true },
                            { name: 'Passenger', icon: '🛳️', active: false }
                          ].map(type => (
                            <button 
                              key={type.name}
                              className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-all ${
                                type.active
                                  ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                              }`}
                            >
                              <span>{type.icon}</span>
                              {type.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Universal Layer Controls */}
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Display Options
                      </div>
                      
                      <button
                        onClick={() => setShowTrails(!showTrails)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                          showTrails 
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30' 
                            : 'bg-gray-900/50 border border-gray-800/50 hover:bg-gray-800/50'
                        }`}
                      >
                        <span className="flex items-center gap-3 text-sm">
                          <Activity className={`w-4 h-4 ${showTrails ? 'text-cyan-400' : 'text-gray-500'}`} />
                          <span className={showTrails ? 'text-cyan-300' : 'text-gray-400'}>Vessel Trails</span>
                        </span>
                        <span className="text-xs text-gray-500">24hr</span>
                      </button>

                      <button
                        className="w-full flex items-center justify-between p-3 bg-gray-900/50 border border-gray-800/50 rounded-lg hover:bg-gray-800/50 transition-all"
                      >
                        <span className="flex items-center gap-3 text-sm">
                          <Layers className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-400">Heatmaps</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Collapsed Sidebar */
              <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl p-3">
                <div className="space-y-3">
                  <button 
                    onClick={() => setTrackingMode('individual')}
                    className={`p-2 rounded-lg transition-all ${
                      trackingMode === 'individual' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setTrackingMode('fleet')}
                    className={`p-2 rounded-lg transition-all ${
                      trackingMode === 'fleet' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setTrackingMode('commercial')}
                    className={`p-2 rounded-lg transition-all ${
                      trackingMode === 'commercial' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Analytics Panel - Right Side */}
          {(viewMode === 'analytics' || viewMode === 'split') && (
            <div className={`absolute top-36 right-4 pointer-events-auto z-20 ${
              viewMode === 'split' ? 'w-96' : 'w-[600px]'
            }`}>
              <AnalyticsDashboard 
                mode={trackingMode} 
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
              />
            </div>
          )}

          {/* Selected Vessel Details - Enhanced */}
          {selectedVessel && (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-[600px] pointer-events-auto">
              <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
                      <Ship className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedVessel.name}</h3>
                      <p className="text-sm text-gray-400">{selectedVessel.type} • {selectedVessel.captain}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedVessel(null)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Speed</p>
                    <p className="text-lg font-semibold text-white">{selectedVessel.speed.toFixed(1)} kts</p>
                    <div className="mt-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-yellow-400"
                        style={{ width: `${(selectedVessel.speed / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Heading</p>
                    <p className="text-lg font-semibold text-white">{selectedVessel.heading.toFixed(0)}°</p>
                    <Compass className="w-4 h-4 text-cyan-400 mt-1" />
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <p className="text-lg font-semibold text-white capitalize">{selectedVessel.status}</p>
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      selectedVessel.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Last Update</p>
                    <p className="text-lg font-semibold text-white">
                      {new Date(selectedVessel.lastUpdate).toLocaleTimeString([], { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })}
                    </p>
                    <Clock className="w-4 h-4 text-gray-400 mt-1" />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-2">
                    <Target className="w-4 h-4" />
                    Track Vessel
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                    <Info className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Status Bar - Enhanced */}
          {isTracking && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto">
              <div className="bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-full px-8 py-3 shadow-2xl">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                    </div>
                    <span className="text-green-400 font-semibold uppercase text-sm">
                      {trackingMode === 'individual' ? 'Sharing Location' : 'Tracking Active'}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-gray-600" />
                  <div className="flex items-center gap-4 text-sm">
                    {trackingMode === 'individual' && (
                      <>
                        <span className="text-gray-300 flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-400" />
                          8 vessels nearby
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-400" />
                          Privacy: ON
                        </span>
                      </>
                    )}
                    {trackingMode === 'fleet' && (
                      <>
                        <span className="text-gray-300 flex items-center gap-2">
                          <Ship className="w-4 h-4 text-cyan-400" />
                          18/24 vessels active
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-yellow-400" />
                          6 fishing
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300 flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-green-400" />
                          85% efficiency
                        </span>
                      </>
                    )}
                    {trackingMode === 'commercial' && (
                      <>
                        <span className="text-gray-300 flex items-center gap-2">
                          <Radio className="w-4 h-4 text-purple-400" />
                          156 AIS targets
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          High traffic
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-green-400" />
                          GFW Active
                        </span>
                      </>
                    )}
                  </div>
                  <div className="h-4 w-px bg-gray-600" />
                  <span className="text-gray-400 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last update: 2s ago
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Vessel Map Component */}
          <VesselMap 
            mode={trackingMode}
            showTrails={showTrails}
            selectedVesselId={selectedVessel?.id}
            onVesselSelect={handleVesselSelect}
          />
          
          {/* Geo Controls */}
          <GeoControls />
        </div>
      </MapShell>
    </div>
  );
}