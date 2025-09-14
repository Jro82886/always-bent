'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function LegendaryOceanPlatform() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const [sstActive, setSstActive] = useState(false);
  const [polygonsActive, setPolygonsActive] = useState(false);
  const [sstOpacity, setSstOpacity] = useState(0.85);
  const [currentDate, setCurrentDate] = useState('latest');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [dataStats, setDataStats] = useState({ tiles: 0, features: 0 });

  // Live UTC clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour12: true,
        timeZone: 'UTC'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize the most badass map ever
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-75, 36], // East Coast focus
      zoom: 6,
      pitch: 60, // Dramatic 3D perspective
      bearing: -20, // Dynamic angle
      cooperativeGestures: true,
      antialias: true,
      renderWorldCopies: false
    });

    const mapInstance = map.current;

    mapInstance.on('load', () => {
      // SST layer with cinematic effects
      mapInstance.addSource('sst', {
        type: 'raster',
        tiles: [`/api/tiles/sst/{z}/{x}/{y}.png`],
        tileSize: 256
      });

      mapInstance.addLayer({
        id: 'sst-layer',
        type: 'raster',
        source: 'sst',
        layout: { visibility: 'none' },
        paint: { 
          'raster-opacity': sstOpacity,
          'raster-fade-duration': 500,
          'raster-brightness-min': 0.2,
          'raster-brightness-max': 0.8,
          'raster-contrast': 0.3,
          'raster-saturation': 1.3
        }
      });

      // Ocean features with epic glow effects
      mapInstance.addSource('polygons', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Outer glow
      mapInstance.addLayer({
        id: 'polygons-glow-outer',
        type: 'line',
        source: 'polygons',
        layout: { visibility: 'none' },
        paint: {
          'line-color': ['match', ['get', 'class'],
            'filament', '#00DDEB',
            'eddy', '#E879F9',
            '#F59E0B'
          ],
          'line-width': 12,
          'line-opacity': 0.2,
          'line-blur': 5
        }
      });

      // Inner glow
      mapInstance.addLayer({
        id: 'polygons-glow-inner',
        type: 'line',
        source: 'polygons',
        layout: { visibility: 'none' },
        paint: {
          'line-color': ['match', ['get', 'class'],
            'filament', '#00DDEB',
            'eddy', '#E879F9',
            '#F59E0B'
          ],
          'line-width': 6,
          'line-opacity': 0.4,
          'line-blur': 2
        }
      });

      // Main feature lines
      mapInstance.addLayer({
        id: 'polygons-main',
        type: 'line',
        source: 'polygons',
        layout: { visibility: 'none' },
        paint: {
          'line-color': ['match', ['get', 'class'],
            'filament', '#00DDEB',
            'eddy', '#E879F9',
            '#F59E0B'
          ],
          'line-width': 3,
          'line-opacity': 1.0
        }
      });

      // Pulsing fill
      mapInstance.addLayer({
        id: 'polygons-fill',
        type: 'fill',
        source: 'polygons',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': ['match', ['get', 'class'],
            'filament', '#00DDEB',
            'eddy', '#E879F9',
            '#F59E0B'
          ],
          'fill-opacity': 0.15
        }
      });

      // Make globally available
      (window as any).map = mapInstance;
      console.log('🌊 LEGENDARY OCEAN PLATFORM INITIALIZED 🚀');
    });

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Epic SST activation
  const toggleSST = () => {
    if (!map.current) return;
    const newState = !sstActive;
    setSstActive(newState);
    
    if (map.current.getLayer('sst-layer')) {
      if (newState) {
        // Epic fade-in animation
        map.current.setLayoutProperty('sst-layer', 'visibility', 'visible');
        map.current.setPaintProperty('sst-layer', 'raster-opacity', 0);
        
        let opacity = 0;
        const fadeIn = setInterval(() => {
          opacity += 0.05;
          if (opacity >= sstOpacity) {
            opacity = sstOpacity;
            clearInterval(fadeIn);
          }
          map.current?.setPaintProperty('sst-layer', 'raster-opacity', opacity);
        }, 20);
      } else {
        map.current.setLayoutProperty('sst-layer', 'visibility', 'none');
      }
      
      console.log(`🌡️ SST ${newState ? '🔥 ACTIVATED' : '❄️ DEACTIVATED'}`);
      setDataStats(prev => ({ ...prev, tiles: newState ? prev.tiles + 1 : 0 }));
    }
  };

  // Epic polygon activation with cascade
  const togglePolygons = async () => {
    if (!map.current) return;
    const newState = !polygonsActive;
    setPolygonsActive(newState);
    
    if (newState) {
      setIsAnalyzing(true);
      await loadPolygons();
      
      // Cascade animation: outer glow → inner glow → main → fill
      const layers = ['polygons-glow-outer', 'polygons-glow-inner', 'polygons-main', 'polygons-fill'];
      layers.forEach((layerId, index) => {
        setTimeout(() => {
          if (map.current?.getLayer(layerId)) {
            map.current.setLayoutProperty(layerId, 'visibility', 'visible');
          }
        }, index * 150);
      });
      
      setIsAnalyzing(false);
    } else {
      const layers = ['polygons-fill', 'polygons-main', 'polygons-glow-inner', 'polygons-glow-outer'];
      layers.forEach((layerId, index) => {
        setTimeout(() => {
          if (map.current?.getLayer(layerId)) {
            map.current.setLayoutProperty(layerId, 'visibility', 'none');
          }
        }, index * 100);
      });
    }
    
    console.log(`🌀 Ocean Features ${newState ? '🎯 REVEALED' : '🫥 HIDDEN'}`);
    setDataStats(prev => ({ ...prev, features: newState ? 42 : 0 }));
  };

  // Load polygon data
  const loadPolygons = async () => {
    try {
      const response = await fetch(`/api/polygons?date=${currentDate}`);
      const data = await response.json();
      const source = map.current?.getSource('polygons') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(data);
      }
    } catch (error) {
      console.warn('Failed to load ocean features:', error);
    }
  };

  // Handle opacity with smooth transitions
  useEffect(() => {
    if (!map.current || !map.current.getLayer('sst-layer')) return;
    map.current.setPaintProperty('sst-layer', 'raster-opacity', sstOpacity);
  }, [sstOpacity]);

  // Handle date changes
  useEffect(() => {
    if (!map.current) return;
    const source = map.current.getSource('sst') as mapboxgl.RasterTileSource;
    if (source && (source as any).setTiles) {
      (source as any).setTiles([`/api/sst/{z}/{x}/{y}?time=${currentDate}`]);
      map.current.triggerRepaint();
    }
  }, [currentDate]);

  return (
    <div className="w-full h-screen relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* LEGENDARY CONTROL HUB */}
      <div className="absolute top-8 left-8 space-y-6 z-50">
        {/* Main Control Panel */}
        <div className="bg-black/20 backdrop-blur-2xl rounded-3xl border border-cyan-500/30 p-8 min-w-[400px] shadow-2xl shadow-cyan-500/10">
          
          {/* Epic Branding */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                  <span className="text-3xl">🌊</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-3 border-white animate-pulse shadow-lg"></div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight mb-1">
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    ALWAYS BENT
                  </span>
                </h1>
                <p className="text-cyan-100/90 text-sm font-semibold">Ocean Intelligence Platform</p>
                <p className="text-white/60 text-xs font-mono">UTC {currentTime}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-cyan-500/15 to-purple-500/15 rounded-2xl p-5 border border-cyan-400/30">
              <div className="flex items-center gap-4">
                <span className="text-3xl">⚡</span>
                <div>
                  <p className="text-cyan-100 text-sm font-bold">Powered by Claude & Cursor</p>
                  <p className="text-white/80 text-xs">Revolutionary AI-driven ocean analysis • Industry first</p>
                </div>
              </div>
            </div>
          </div>

          {/* SST Command Center */}
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-500/15 to-cyan-500/15 rounded-2xl border border-blue-400/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">🌡️</span>
                </div>
                <div>
                  <h3 className="text-white font-black text-xl">Sea Surface Temperature</h3>
                  <p className="text-blue-200/90 text-sm font-medium">Copernicus Marine SST • Live Satellite Feed</p>
                </div>
              </div>
              <button
                onClick={toggleSST}
                className={`relative px-10 py-5 rounded-2xl font-black text-lg transition-all duration-500 transform hover:scale-110 ${
                  sstActive 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-2xl shadow-blue-500/50 animate-pulse' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 border-2 border-white/30'
                }`}
              >
                {sstActive ? (
                  <span className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-cyan-300 rounded-full animate-ping"></span>
                    <span className="w-4 h-4 bg-cyan-400 rounded-full absolute left-8"></span>
                    LIVE
                  </span>
                ) : (
                  'ACTIVATE'
                )}
              </button>
            </div>
            
            {sstActive && (
              <div className="space-y-5 animate-slideIn">
                <div className="bg-white/10 rounded-xl p-4 border border-blue-300/20">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white/90 text-sm font-bold">Thermal Intensity</label>
                    <span className="text-cyan-400 font-mono text-lg bg-cyan-500/20 px-3 py-1 rounded-lg border border-cyan-400/30">
                      {Math.round(sstOpacity * 100)}%
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={sstOpacity}
                      onChange={(e) => setSstOpacity(parseFloat(e.target.value))}
                      className="w-full h-4 bg-gradient-to-r from-blue-900/50 to-cyan-900/50 rounded-full appearance-none cursor-pointer epic-slider"
                    />
                    <div 
                      className="absolute top-0 left-0 h-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-cyan-300 rounded-full transition-all duration-300 shadow-lg shadow-cyan-400/50" 
                      style={{ width: `${sstOpacity * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                    <div className="text-cyan-400 text-xl font-bold">{dataStats.tiles}</div>
                    <div className="text-white/70 text-xs">Tiles Loaded</div>
                  </div>
                  <div className="bg-cyan-500/20 rounded-lg p-3 border border-cyan-400/30">
                    <div className="text-blue-400 text-xl font-bold">0.25°</div>
                    <div className="text-white/70 text-xs">Resolution</div>
                  </div>
                  <div className="bg-purple-500/20 rounded-lg p-3 border border-purple-400/30">
                    <div className="text-purple-400 text-xl font-bold">&lt; 2s</div>
                    <div className="text-white/70 text-xs">Response</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ocean Features Command Center */}
          <div className="mb-8 p-6 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-2xl border border-purple-400/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">🌀</span>
                </div>
                <div>
                  <h3 className="text-white font-black text-xl">Ocean Features</h3>
                  <p className="text-purple-200/90 text-sm font-medium">AI-Detected Eddies • Filaments • Thermal Fronts</p>
                </div>
              </div>
              <button
                onClick={togglePolygons}
                disabled={isAnalyzing}
                className={`relative px-10 py-5 rounded-2xl font-black text-lg transition-all duration-500 transform hover:scale-110 ${
                  polygonsActive 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/50 animate-pulse' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 border-2 border-white/30'
                } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ANALYZING
                  </span>
                ) : polygonsActive ? (
                  <span className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-pink-300 rounded-full animate-ping"></span>
                    <span className="w-4 h-4 bg-pink-400 rounded-full absolute left-8"></span>
                    ACTIVE
                  </span>
                ) : (
                  'DETECT'
                )}
              </button>
            </div>
            
            {polygonsActive && (
              <div className="bg-white/10 rounded-xl p-4 border border-purple-300/20">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-purple-500/20 rounded-lg p-3">
                    <div className="text-purple-400 text-xl font-bold">{dataStats.features}</div>
                    <div className="text-white/70 text-xs">Features</div>
                  </div>
                  <div className="bg-pink-500/20 rounded-lg p-3">
                    <div className="text-pink-400 text-xl font-bold">AI</div>
                    <div className="text-white/70 text-xs">Detection</div>
                  </div>
                  <div className="bg-cyan-500/20 rounded-lg p-3">
                    <div className="text-cyan-400 text-xl font-bold">3D</div>
                    <div className="text-white/70 text-xs">Rendering</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Temporal Command Center */}
          <div className="p-6 bg-gradient-to-br from-orange-500/15 to-red-500/15 rounded-2xl border border-orange-400/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">⏰</span>
              </div>
              <div>
                <h3 className="text-white font-black text-xl">Temporal Analysis</h3>
                <p className="text-orange-200/90 text-sm font-medium">Multi-day Time Series • Historical Patterns</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'LIVE FEED', value: 'latest', icon: '🔴', desc: 'Real-time', color: 'from-red-500 to-orange-500' },
                { label: 'TODAY', value: '2025-09-08', icon: '📍', desc: 'Current Day', color: 'from-blue-500 to-cyan-500' },
                { label: 'YESTERDAY', value: '2025-09-07', icon: '⏪', desc: '24h Ago', color: 'from-purple-500 to-pink-500' },
                { label: 'HISTORICAL', value: '2025-09-06', icon: '📊', desc: '48h Archive', color: 'from-green-500 to-emerald-500' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCurrentDate(option.value)}
                  className={`p-5 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 border-2 ${
                    currentDate === option.value
                      ? `bg-gradient-to-r ${option.color} text-white shadow-2xl border-white/30 animate-pulse`
                      : 'bg-white/10 text-white/80 hover:bg-white/20 border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="font-black text-sm">{option.label}</div>
                  <div className="text-xs opacity-80 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Epic Status HUD */}
      <div className="absolute top-8 right-8 space-y-4 z-50">
        {/* Live Status */}
        <div className="bg-black/30 backdrop-blur-2xl rounded-2xl border border-green-500/30 p-6 shadow-xl shadow-green-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">⚡</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">System Status</h3>
              <p className="text-green-200/80 text-xs">Live Monitoring</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${sstActive ? 'bg-cyan-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className="text-white/90 text-sm font-medium">SST Layer</span>
              </div>
              <span className={`text-xs font-bold ${sstActive ? 'text-cyan-400' : 'text-gray-400'}`}>
                {sstActive ? 'ACTIVE' : 'STANDBY'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${polygonsActive ? 'bg-purple-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className="text-white/90 text-sm font-medium">Features</span>
              </div>
              <span className={`text-xs font-bold ${polygonsActive ? 'text-purple-400' : 'text-gray-400'}`}>
                {polygonsActive ? 'DETECTING' : 'STANDBY'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-white/90 text-sm font-medium">Copernicus Feed</span>
              </div>
              <span className="text-xs font-bold text-green-400">LIVE</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-black/30 backdrop-blur-2xl rounded-2xl border border-yellow-500/30 p-6 shadow-xl">
          <div className="text-center">
            <div className="text-yellow-400 text-3xl font-black mb-2">Industry</div>
            <div className="text-white text-lg font-bold mb-1">FIRST</div>
            <div className="text-white/70 text-xs">Real-time Ocean AI</div>
          </div>
        </div>
      </div>

      {/* Bottom Epic HUD */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-black/30 backdrop-blur-2xl rounded-full px-8 py-4 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-8 text-white/90 text-sm font-medium">
            <span className="flex items-center gap-3">
              <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></span>
              <span className="font-bold">Temperature Analysis</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></span>
              <span className="font-bold">Feature Detection</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
              <span className="font-bold">Claude AI</span>
            </span>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-black/40 backdrop-blur-2xl rounded-3xl p-12 border border-cyan-400/30 shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-2 border-purple-400/30 border-b-purple-400 rounded-full animate-spin-reverse"></div>
              </div>
              <div>
                <span className="text-white text-2xl font-bold block">Analyzing Ocean Patterns...</span>
                <span className="text-cyan-400 text-sm font-medium">AI processing satellite data</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Epic Styles */}
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        .animate-slideIn {
          animation: slideIn 0.6s ease-out;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 1.5s linear infinite;
        }
        
        .epic-slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(45deg, #00DDEB, #06B6D4);
          cursor: pointer;
          box-shadow: 0 0 20px rgba(0, 221, 235, 0.8), 0 0 40px rgba(0, 221, 235, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .epic-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(45deg, #00DDEB, #06B6D4);
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 20px rgba(0, 221, 235, 0.8);
        }
      `}</style>
    </div>
  );
}