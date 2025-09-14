'use client';

import { useState, useEffect } from 'react';
import { MapShell } from '@/lib/MapRef';
import { useMapbox } from '@/lib/MapCtx';
import NavTabs from '@/components/NavTabs';
import TopHUD from '@/components/TopHUD';
import VesselTracker from '@/components/VesselTracker';
import GeoControls from '@/components/GeoControls';
import { 
  Radio, Users, Activity, Map, Eye, EyeOff, 
  Anchor, Ship, Navigation, Waves, AlertTriangle,
  TrendingUp, Clock, MapPin, Compass, Signal,
  User, Building2, Filter, Settings, ChevronRight,
  Globe, Zap, Shield, BarChart3, Info
} from 'lucide-react';

type TrackingMode = 'individual' | 'fleet' | 'commercial';

export default function TrackingPage() {
  const map = useMapbox();
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('individual');
  const [isTracking, setIsTracking] = useState(false);
  const [showMyPosition, setShowMyPosition] = useState(true);
  const [showFleet, setShowFleet] = useState(true);
  const [showTrails, setShowTrails] = useState(false);
  const [showGFW, setShowGFW] = useState(false);
  const [showAIS, setShowAIS] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);

  useEffect(() => {
    // Initialize map for tracking
    if (map) {
      console.log('[TRACKING] Map ready for tracking features');
    }
  }, [map]);

  return (
    <div className="w-full h-screen bg-gray-950">
      <MapShell>
        <div className="pointer-events-none absolute inset-0">
          <NavTabs />
          <TopHUD includeAbfi={false} />
          
          {/* Main Tracking Control Panel - Left Side */}
          <div className="absolute top-20 left-4 w-96 pointer-events-auto z-20">
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
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <Navigation className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Personal Tracking</h2>
                        <p className="text-xs text-gray-400">Share location • See nearby vessels</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsTracking(!isTracking)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                        isTracking 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {isTracking ? 'Sharing ON' : 'Start Sharing'}
                    </button>
                  </div>

                  {/* Personal Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                      <MapPin className="w-5 h-5 text-cyan-400 mb-2" />
                      <p className="text-sm text-gray-400">Your Position</p>
                      <p className="text-lg font-semibold text-white">40.7°N 74.0°W</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                      <Users className="w-5 h-5 text-green-400 mb-2" />
                      <p className="text-sm text-gray-400">Vessels Nearby</p>
                      <p className="text-lg font-semibold text-white">8 within 5nm</p>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-300">Anonymous Mode</span>
                      </div>
                      <button className="w-12 h-6 bg-gray-700 rounded-full relative transition-colors">
                        <div className="w-5 h-5 bg-gray-500 rounded-full absolute top-0.5 left-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Fleet Tracking Mode */}
              {trackingMode === 'fleet' && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <Ship className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Fleet Command</h2>
                        <p className="text-xs text-gray-400">Monitor your fleet in real-time</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                      <Settings className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Fleet Overview */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-3 border border-cyan-500/30">
                      <p className="text-2xl font-bold text-white">24</p>
                      <p className="text-xs text-cyan-300">Total Fleet</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-500/30">
                      <p className="text-2xl font-bold text-green-400">18</p>
                      <p className="text-xs text-green-300">Active</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-3 border border-yellow-500/30">
                      <p className="text-2xl font-bold text-yellow-400">6</p>
                      <p className="text-xs text-yellow-300">Fishing</p>
                    </div>
                  </div>

                  {/* Fleet Filters */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wider">
                      <span>Fleet Filters</span>
                      <button className="text-cyan-400 hover:text-cyan-300">Clear all</button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-xs text-cyan-300">
                        All Vessels
                      </button>
                      <button className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:border-gray-600">
                        Active Only
                      </button>
                      <button className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:border-gray-600">
                        At Anchor
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Fleet Analytics
                    </button>
                    <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Alerts
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
                      <div className="p-2 bg-purple-500/10 rounded-lg">
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

                  {/* Data Sources */}
                  <div className="space-y-3 mb-6">
                    <button
                      onClick={() => setShowAIS(!showAIS)}
                      className={`w-full p-4 rounded-xl border transition-all ${
                        showAIS
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : 'bg-gray-900/50 border-gray-800/50 hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Radio className={`w-5 h-5 ${showAIS ? 'text-purple-400' : 'text-gray-500'}`} />
                          <div className="text-left">
                            <p className={`font-medium ${showAIS ? 'text-purple-300' : 'text-gray-300'}`}>
                              AIS Vessels
                            </p>
                            <p className="text-xs text-gray-500">Commercial & cargo ships</p>
                          </div>
                        </div>
                        <Eye className={`w-5 h-5 ${showAIS ? 'text-purple-400' : 'text-gray-600'}`} />
                      </div>
                    </button>

                    <button
                      onClick={() => setShowGFW(!showGFW)}
                      className={`w-full p-4 rounded-xl border transition-all ${
                        showGFW
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : 'bg-gray-900/50 border-gray-800/50 hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className={`w-5 h-5 ${showGFW ? 'text-purple-400' : 'text-gray-500'}`} />
                          <div className="text-left">
                            <p className={`font-medium ${showGFW ? 'text-purple-300' : 'text-gray-300'}`}>
                              Global Fishing Watch
                            </p>
                            <p className="text-xs text-gray-500">Industrial fishing activity</p>
                          </div>
                        </div>
                        <Eye className={`w-5 h-5 ${showGFW ? 'text-purple-400' : 'text-gray-600'}`} />
                      </div>
                    </button>
                  </div>

                  {/* Vessel Type Filters */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Vessel Types</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-400 hover:bg-gray-700">
                        Cargo
                      </button>
                      <button className="px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-400 hover:bg-gray-700">
                        Tanker
                      </button>
                      <button className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-300">
                        Fishing
                      </button>
                      <button className="px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-400 hover:bg-gray-700">
                        Passenger
                      </button>
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
                        ? 'bg-cyan-500/10 border border-cyan-500/20' 
                        : 'bg-gray-900/50 border border-gray-800/50 hover:bg-gray-800/50'
                    }`}
                  >
                    <span className="flex items-center gap-3 text-sm">
                      <Activity className={`w-4 h-4 ${showTrails ? 'text-cyan-400' : 'text-gray-500'}`} />
                      <span className={showTrails ? 'text-cyan-300' : 'text-gray-400'}>Vessel Trails</span>
                    </span>
                    <span className="text-xs text-gray-500">24hr</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Panel - Context Sensitive */}
          {isTracking && (
            <div className="absolute top-20 right-4 w-80 max-h-[calc(100vh-120px)] pointer-events-auto z-20">
              {/* Individual Mode - Nearby Vessels */}
              {trackingMode === 'individual' && (
                <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl p-4 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Waves className="w-5 h-5 text-cyan-400" />
                      Nearby Vessels
                    </span>
                    <span className="text-xs text-gray-400">8 vessels</span>
                  </h3>
                  <div className="space-y-2">
                    {['Ocean Spirit', 'Blue Wave', 'Sea Hunter'].map((vessel) => (
                      <div key={vessel} className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/50 hover:bg-gray-800/50 cursor-pointer">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-white">{vessel}</p>
                          <span className="text-xs text-green-400">2.1 nm</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Heading 045°</span>
                          <span>8.5 kts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fleet Mode - Vessel List */}
              {trackingMode === 'fleet' && (
                <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl p-4 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Ship className="w-5 h-5 text-cyan-400" />
                      Fleet Vessels
                    </span>
                    <span className="text-xs text-gray-400">18 active</span>
                  </h3>
                  <div className="space-y-2">
                    {['FV Thunder', 'FV Lightning', 'FV Storm', 'FV Wave Runner', 'FV Sea Fox'].map((vessel, idx) => (
                      <div
                        key={vessel}
                        onClick={() => setSelectedVessel(vessel)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedVessel === vessel
                            ? 'bg-cyan-500/20 border-cyan-500/50'
                            : 'bg-gray-900/50 border-gray-800/50 hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-white">{vessel}</p>
                            <p className="text-xs text-gray-400">Captain Smith</p>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            idx % 2 === 0 
                              ? 'bg-yellow-500/20 text-yellow-300' 
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {idx % 2 === 0 ? 'Fishing' : 'Transit'}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Speed</p>
                            <p className="text-gray-300">{8 + idx} kts</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Course</p>
                            <p className="text-gray-300">{45 + idx * 15}°</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Last Update</p>
                            <p className="text-gray-300">{idx + 1}m ago</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commercial Mode - Traffic Info */}
              {trackingMode === 'commercial' && showAIS && (
                <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl p-4 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-purple-400" />
                      AIS Traffic
                    </span>
                    <span className="text-xs text-gray-400">156 vessels</span>
                  </h3>
                  <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-purple-400" />
                      <p className="text-sm font-medium text-purple-300">Traffic Density</p>
                    </div>
                    <p className="text-xs text-purple-200">High commercial traffic detected in shipping lanes</p>
                  </div>
                  <div className="space-y-2">
                    {['MV Atlantic Carrier', 'MV Pacific Dream', 'MT Ocean Star'].map((vessel, idx) => (
                      <div key={vessel} className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/50">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-white">{vessel}</p>
                          <span className="text-xs text-purple-400">{['Cargo', 'Container', 'Tanker'][idx]}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          IMO: {9000000 + idx * 12345} • {300 + idx * 50}m • {15 + idx} kts
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Status Bar */}
          {isTracking && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto">
              <div className="bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-full px-8 py-3 shadow-2xl">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 font-semibold uppercase text-sm">
                      {trackingMode === 'individual' ? 'Sharing Location' : 'Tracking Active'}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-gray-600" />
                  <div className="flex items-center gap-4 text-sm">
                    {trackingMode === 'individual' && (
                      <>
                        <span className="text-gray-300">8 vessels nearby</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300">Privacy: ON</span>
                      </>
                    )}
                    {trackingMode === 'fleet' && (
                      <>
                        <span className="text-gray-300">18/24 vessels active</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300">6 fishing</span>
                      </>
                    )}
                    {trackingMode === 'commercial' && (
                      <>
                        <span className="text-gray-300">156 AIS targets</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300">High traffic</span>
                      </>
                    )}
                  </div>
                  <div className="h-4 w-px bg-gray-600" />
                  <span className="text-gray-400 text-xs">Last update: 2s ago</span>
                </div>
              </div>
            </div>
          )}

          {/* Vessel Tracker Component */}
          <VesselTracker />
          
          {/* Geo Controls */}
          <GeoControls />
        </div>
      </MapShell>
    </div>
  );
}