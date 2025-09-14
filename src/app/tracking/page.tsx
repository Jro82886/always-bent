'use client';

import { useState, useEffect } from 'react';
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

  const handleVesselSelect = (vessel: VesselData) => {
    setSelectedVessel(vessel);
  };

  return (
    <div className="w-full h-screen bg-gray-950 relative">
      {/* Navigation - Always on top */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <NavTabs />
      </div>
      
      {/* Main Content Area - Testing without MapShell */}
      <div className="absolute inset-0 pt-16">
        {/* Temporary background to show it's working */}
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-950 to-black">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">Tracking Page is Loading!</h1>
              <p className="text-xl text-gray-300">The UI components are being rendered below...</p>
            </div>
          </div>
        </div>
        
        {/* UI Components Layer */}
        <div className="absolute inset-0 pointer-events-none">
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
                    </>
                  )}
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
                    <span className="text-gray-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      8 vessels nearby
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Geo Controls */}
          <GeoControls />
        </div>
      </div>
    </div>
  );
}