'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import NavTabs from '@/components/NavTabs';
import TopHUD from '@/components/TopHUD';
import { 
  Users, Ship, Navigation, User, Building2, 
  ChevronLeft, Menu, Wifi, WifiOff, MapPin,
  Shield, AlertTriangle, ChevronRight, Map,
  BarChart3, Maximize2, Activity, Battery, Signal
} from 'lucide-react';

// Set Mapbox token with safety check
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
}

type TrackingMode = 'individual' | 'fleet' | 'commercial';
type ViewMode = 'map' | 'analytics' | 'split';

export default function TrackingPage() {
  // Map references
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('individual');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isTracking, setIsTracking] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('[Tracking] Initializing map...');
    console.log('[Tracking] Mapbox token:', mapboxgl.accessToken ? 'Present' : 'Missing');
    console.log('[Tracking] Container:', mapContainer.current);

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        // Check if token is available
        if (!mapboxgl.accessToken) {
          console.error('[Tracking] Mapbox token is missing!');
          setMapLoaded(false);
          return;
        }

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-74.0, 40.7], // NYC area
          zoom: 9,
          pitch: 0,
          bearing: 0
        });

        map.current.on('load', () => {
          setMapLoaded(true);
          console.log('[Tracking] Map loaded successfully');

          // Add navigation controls
          map.current?.addControl(new mapboxgl.NavigationControl(), 'top-right');
          map.current?.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
        });

        map.current.on('error', (e) => {
          console.error('[Tracking] Map error:', e);
          setMapLoaded(false);
        });

      } catch (error) {
        console.error('[Tracking] Failed to initialize map:', error);
        setMapLoaded(false);
      }
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-950 overflow-hidden">
      {/* Map Container - Full screen background */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: '100vh', minWidth: '100vw', backgroundColor: '#111827' }}
      />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Navigation */}
        <div className="relative z-50">
          <NavTabs />
          <TopHUD includeAbfi={false} />
        </div>
        
        {/* Loading indicator */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950/50">
            <div className="text-center">
              {!mapboxgl.accessToken ? (
                <>
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-yellow-400">Mapbox token not configured</p>
                  <p className="text-gray-400 text-sm mt-2">Please check environment variables</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-cyan-400">Loading map...</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main UI - Only show when map is loaded */}
        {mapLoaded && (
          <>
            {/* View Mode Selector - Top Right */}
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
            
            {/* Left Sidebar */}
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
                  {/* Mode Selector */}
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
                      </button>
                    </div>
                  </div>

                  {/* Control Panel */}
                  <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl p-6">
                    {/* Individual Mode */}
                    {trackingMode === 'individual' && (
                      <>
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
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            {isTracking ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                            {isTracking ? 'Sharing ON' : 'Start Sharing'}
                          </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
                            <MapPin className="w-5 h-5 text-cyan-400 mb-2" />
                            <p className="text-sm text-gray-400">Your Position</p>
                            <p className="text-lg font-semibold text-white">40.7128°N</p>
                            <p className="text-lg font-semibold text-white">74.0060°W</p>
                          </div>
                          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
                            <Users className="w-5 h-5 text-green-400 mb-2" />
                            <p className="text-sm text-gray-400">Vessels Nearby</p>
                            <p className="text-2xl font-bold text-white">8</p>
                            <p className="text-xs text-green-300">within 5nm</p>
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

                        {/* Privacy Settings */}
                        <div className="space-y-3">
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

                    {/* Fleet Mode */}
                    {trackingMode === 'fleet' && (
                      <>
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
                        </div>

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

                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                          <p className="text-sm text-purple-300 mb-2">Fleet Performance</p>
                          <div className="text-2xl font-bold text-white">2,450 lbs</div>
                          <p className="text-xs text-purple-400">Today&apos;s catch</p>
                        </div>
                      </>
                    )}

                    {/* Commercial Mode */}
                    {trackingMode === 'commercial' && (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                              <Building2 className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-white">Commercial Traffic</h2>
                              <p className="text-xs text-gray-400">AIS & vessel monitoring</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-purple-300">Area Traffic</p>
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">High</span>
                          </div>
                          <div className="text-3xl font-bold text-white">156</div>
                          <p className="text-xs text-purple-400">vessels in range</p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 uppercase tracking-wider">Vessel Types</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-300">
                              Fishing
                            </button>
                            <button className="px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-400 hover:bg-gray-700">
                              Cargo
                            </button>
                            <button className="px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-400 hover:bg-gray-700">
                              Tanker
                            </button>
                            <button className="px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-400 hover:bg-gray-700">
                              Passenger
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Display Options */}
                    <div className="mt-6 pt-6 border-t border-gray-800">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Display Options
                      </div>
                      <button className="w-full flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors">
                        <span className="flex items-center gap-3 text-sm">
                          <Activity className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-400">Vessel Trails</span>
                        </span>
                        <span className="text-xs text-gray-500">24hr</span>
                      </button>
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

            {/* Bottom Status Bar */}
            {isTracking && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto z-20">
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
                    <span className="text-gray-300 text-sm">
                      {trackingMode === 'individual' && '8 vessels nearby'}
                      {trackingMode === 'fleet' && '18/24 vessels active'}
                      {trackingMode === 'commercial' && '156 AIS targets'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}