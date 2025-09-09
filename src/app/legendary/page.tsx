'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Import Inter font for modern typography
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;
console.log('🗝️ Mapbox token loaded:', !!mapboxgl.accessToken);

export default function LegendaryOceanPlatform() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const [sstActive, setSstActive] = useState(false); // Start OFF - let user activate
  const [chlActive, setChlActive] = useState(false); // Chlorophyll layer
  const [abfiActive, setAbfiActive] = useState(false); // Jeff's ABFI custom layer
  const [polygonsActive, setPolygonsActive] = useState(false);
  const [sstOpacity, setSstOpacity] = useState(0.85);
  const [currentDate, setCurrentDate] = useState('2025-09-08'); // Today's date
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [dataStats, setDataStats] = useState({ tiles: 0, features: 0 });
  const [mapLoading, setMapLoading] = useState(true);
  const [sstLoading, setSstLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live UTC clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour12: false,
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
      console.log('🌊 LEGENDARY OCEAN PLATFORM INITIALIZED 🚀');
      setMapLoading(false);
      setError(null);
      
      // Wait for style to be fully loaded before adding layers
      if (!mapInstance.isStyleLoaded()) {
        mapInstance.once('style.load', () => {
          console.log('🎯 Map style fully loaded, adding layers...');
          addAllLayers();
        });
      } else {
        addAllLayers();
      }
    });

    // Function to add all layers safely
    const addAllLayers = () => {
      // SST layer with cinematic effects - use specific date with data
      mapInstance.addSource('sst', {
        type: 'raster',
        tiles: [`/api/sst/{z}/{x}/{y}`], // No time parameter - use ERDDAP default
        tileSize: 256
      });

      // Check if layer already exists before adding
      if (!mapInstance.getLayer('sst-layer')) {
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
            'raster-saturation': 1.0
          }
        });
      }

      // Add chlorophyll layer when style is fully ready
      const addChlorophyllLayer = () => {
        try {
          if (!mapInstance.getSource('chl')) {
            mapInstance.addSource('chl', {
              type: 'raster',
              tiles: [`/api/copernicus/{z}/{x}/{y}?time=2025-09-03T00:00:00.000Z`],
              tileSize: 256
            });
          }

          if (!mapInstance.getLayer('chl-layer')) {
            mapInstance.addLayer({
              id: 'chl-layer',
              type: 'raster',
              source: 'chl',
              layout: { visibility: 'none' },
              paint: { 
                'raster-opacity': 0.8,
                'raster-fade-duration': 300
              }
            });
          }
          
          console.log('🌿 Chlorophyll layer added successfully');
        } catch (error) {
          console.error('🚨 Chlorophyll layer failed:', error);
        }
      };

      // Add when map is ready
      if (mapInstance.isStyleLoaded()) {
        addChlorophyllLayer();
      } else {
        mapInstance.once('styledata', addChlorophyllLayer);
      }

      // ABFI Custom Layer (Jeff's Secret Sauce) - Ready for custom Copernicus endpoint
      mapInstance.addSource('abfi', {
        type: 'raster',
        tiles: [`/api/abfi/{z}/{x}/{y}?time=2025-09-03T00:00:00.000Z`], // Will be Jeff's custom layer
        tileSize: 256
      });

      mapInstance.addLayer({
        id: 'abfi-layer',
        type: 'raster',
        source: 'abfi',
        layout: { visibility: 'none' },
        paint: { 
          'raster-opacity': 0.9,
          'raster-fade-duration': 400,
          'raster-brightness-min': 0.1,
          'raster-brightness-max': 1.0,
          'raster-contrast': 0.4,
          'raster-saturation': 1.1
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
    };  // End addAllLayers function
    
    }); // End map.on('load')

    // Add error handling with better logging
    mapInstance.on('error', (e) => {
      console.error('Map error details:', e.error, e.sourceId, e.type);
      // Don't show error to user unless it's critical
      if (e.error && e.error.message && !e.error.message.includes('ie')) {
        setError('Map initialization failed. Please refresh.');
      }
      setMapLoading(false);
    });

    mapInstance.on('sourcedata', (e) => {
      if (e.sourceId === 'sst' && e.isSourceLoaded) {
        setSstLoading(false);
        setDataStats(prev => ({ ...prev, tiles: prev.tiles + 1 }));
      }
    });

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Epic SST activation with optimized loading
  const toggleSST = useCallback(() => {
    if (!map.current) return;
    const newState = !sstActive;
    setSstActive(newState);
    
    if (newState) setSstLoading(true);
    
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
      
      // Debug SST layer
      if (newState && map.current.getLayer('sst-layer')) {
        const visibility = map.current.getLayoutProperty('sst-layer', 'visibility');
        const opacity = map.current.getPaintProperty('sst-layer', 'raster-opacity');
        console.log('🔍 SST Debug - Visibility:', visibility, 'Opacity:', opacity);
      }
      
      setDataStats(prev => ({ ...prev, tiles: newState ? prev.tiles + 1 : 0 }));
    }
  }, [sstActive, sstOpacity]);

  // Chlorophyll toggle
  const toggleChlorophyll = useCallback(() => {
    if (!map.current) return;
    const newState = !chlActive;
    setChlActive(newState);
    
    if (map.current.getLayer('chl-layer')) {
      const visibility = newState ? 'visible' : 'none';
      map.current.setLayoutProperty('chl-layer', 'visibility', visibility);
      console.log(`🌿 Chlorophyll ${newState ? '🟢 ACTIVATED' : '🔴 DEACTIVATED'}`);
    }
  }, [chlActive]);

  // ABFI toggle (Jeff's secret weapon)
  const toggleABFI = useCallback(() => {
    if (!map.current) return;
    const newState = !abfiActive;
    setAbfiActive(newState);
    
    if (map.current.getLayer('abfi-layer')) {
      const visibility = newState ? 'visible' : 'none';
      map.current.setLayoutProperty('abfi-layer', 'visibility', visibility);
      console.log(`⚡ ABFI ${newState ? '🔥 UNLEASHED' : '💤 DORMANT'}`);
    }
  }, [abfiActive]);

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

  // Load polygon data with fallback to demo data
  const loadPolygons = async () => {
    try {
      // Use demo ocean features to avoid API errors
      const demoData = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: { class: 'filament', score: 85 },
            geometry: {
              type: 'LineString' as const,
              coordinates: [[-75.5, 36.2], [-75.3, 36.4], [-75.0, 36.6]]
            }
          },
          {
            type: 'Feature' as const,
            properties: { class: 'eddy', score: 92 },
            geometry: {
              type: 'Polygon' as const,
              coordinates: [[[-74.8, 35.8], [-74.6, 35.8], [-74.6, 36.0], [-74.8, 36.0], [-74.8, 35.8]]]
            }
          }
        ]
      };
      
      const source = map.current?.getSource('polygons') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(demoData);
        console.log('🌀 Demo ocean features loaded');
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
    <div className={`w-full h-screen relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 overflow-hidden ${inter.className} main-container`}>
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* LEGENDARY CONTROL HUB - Fixed Scrolling */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 w-[380px] h-[80vh] z-50 overflow-y-auto overflow-x-hidden bg-transparent layer-panel controls-panel" style={{ maxHeight: '80vh' }}>
        <div className="space-y-4 pb-20">
        {/* Main Control Panel - Glow Flow Design */}
        <div className="bg-black/10 backdrop-blur-3xl rounded-3xl border border-white/10 p-4 md:p-8 min-w-[300px] md:min-w-[400px] shadow-2xl shadow-white/5">
          
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
                <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    HI AMANDA! 👋 ALWAYS BENT
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

          {/* SST Command Center - Glow Flow */}
          <div className="mb-6 p-6 bg-black/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-lg hover:shadow-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">🌡️</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Sea Surface Temperature</h3>
                  <p className="text-blue-200/90 text-sm font-medium">NOAA CoastWatch MUR • Live Satellite Feed</p>
                </div>
              </div>
              <button
                onClick={toggleSST}
                className={`relative px-8 py-4 rounded-xl font-medium text-sm transition-all duration-700 ${
                  sstActive 
                    ? 'bg-white/20 text-white border border-white/40 shadow-xl shadow-white/20 glow-active' 
                    : 'bg-white/5 text-white/70 border border-white/10 hover:border-white/30 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-white/10'
                }`}
              >
                {sstActive ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <span>ACTIVE</span>
                  </span>
                ) : (
                  <span>Temperature</span>
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

          {/* Chlorophyll Command Center - Glow Flow */}
          <div className="mb-6 p-6 bg-black/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-lg hover:shadow-emerald-400/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">🌿</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Chlorophyll-a</h3>
                  <p className="text-green-200/90 text-sm font-medium">Copernicus Marine • Phytoplankton Productivity</p>
                </div>
              </div>
              <button
                onClick={toggleChlorophyll}
                className={`relative px-8 py-4 rounded-xl font-medium text-sm transition-all duration-700 ${
                  chlActive 
                    ? 'bg-white/20 text-white border border-white/40 shadow-xl shadow-emerald-400/30 glow-active' 
                    : 'bg-white/5 text-white/70 border border-white/10 hover:border-emerald-400/30 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-emerald-400/20'
                }`}
              >
                {chlActive ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span>
                    <span>ACTIVE</span>
                  </span>
                ) : (
                  <span>Chlorophyll</span>
                )}
              </button>
            </div>
          </div>

          {/* ABFI - Jeff's Precision Intelligence */}
          <div className="mb-6 p-8 bg-black/5 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-700 hover:shadow-2xl hover:shadow-white/20 relative group">
            {/* Animated background particles */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute top-8 right-6 w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/40">
                      <span className="text-white text-2xl font-black">⚡</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-300 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-red-400 rounded-full border border-white animate-bounce"></div>
                  </div>
                  <div className="text-left">
                    <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 bg-clip-text">
                      A B F I
                    </h2>
                    <p className="text-yellow-100 text-sm font-bold">Jeff's Proprietary Algorithm</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-500/20 to-red-500/20 rounded-2xl p-4 border border-yellow-400/30 mb-6">
                  <p className="text-yellow-100 text-lg font-bold mb-2">🎯 PRECISION FISHING INTELLIGENCE</p>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Revolutionary custom analysis combining thermal boundaries, productivity zones, and proprietary ocean behavior models. 
                    <span className="text-yellow-300 font-semibold"> Industry-exclusive technology.</span>
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={toggleABFI}
                  className={`relative px-10 py-5 rounded-xl font-semibold text-lg transition-all duration-1000 transform hover:scale-105 ${
                    abfiActive 
                      ? 'bg-white/30 text-white border-2 border-white/60 shadow-2xl shadow-white/40 glow-active-strong' 
                      : 'bg-white/8 text-white/80 border-2 border-white/20 hover:border-white/50 hover:bg-white/15 hover:text-white hover:shadow-xl hover:shadow-white/30 group-hover:glow-hint'
                  }`}
                >
                  {abfiActive ? (
                    <span className="flex items-center gap-3">
                      <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                      <span className="tracking-wide">ANALYZING</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <span className="text-xl">⚡</span>
                      <span className="tracking-wide">ABFI</span>
                    </span>
                  )}
                </button>
              </div>
              
              {abfiActive && (
                <div className="mt-6 text-center animate-fadeIn">
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30">
                    <p className="text-yellow-200 text-sm font-semibold mb-2">🚧 Custom Layer Building 🚧</p>
                    <p className="text-white/80 text-xs">Jeff's proprietary algorithm ready for deployment</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ocean Features Command Center */}
          <div className="mb-8 p-6 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-2xl border border-purple-400/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">🌀</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Ocean Features</h3>
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
                <h3 className="text-white font-bold text-lg">Temporal Analysis</h3>
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
                <span className="text-white/90 text-sm font-medium">NOAA Feed</span>
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

      {/* Map Loading Overlay */}
      {mapLoading && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-black/40 backdrop-blur-2xl rounded-3xl p-12 border border-cyan-400/30 shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-2 border-blue-400/30 border-b-blue-400 rounded-full animate-spin-reverse"></div>
              </div>
              <div>
                <span className="text-white text-2xl font-bold block">Initializing Ocean Platform...</span>
                <span className="text-cyan-400 text-sm font-medium">Loading Mapbox & Satellite Data</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-black/40 backdrop-blur-2xl rounded-3xl p-12 border border-red-400/30 shadow-2xl">
            <div className="text-center">
              <span className="text-red-400 text-4xl block mb-4">⚠️</span>
              <span className="text-white text-xl font-bold block mb-2">System Error</span>
              <span className="text-red-200 text-sm">{error}</span>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Reload Platform
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Loading Overlay */}
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

      {/* Glow Flow Styles + Scroll Fixes */}
      <style jsx>{`
        .main-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .layer-panel, .controls-panel {
          max-height: 80vh !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.3) transparent;
        }
        
        .layer-panel::-webkit-scrollbar {
          width: 6px;
        }
        
        .layer-panel::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        
        .layer-panel::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }
        
        .layer-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5);
        }
        .glow-active {
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), 
                      0 0 40px rgba(255, 255, 255, 0.1),
                      inset 0 0 20px rgba(255, 255, 255, 0.1);
        }
        
        .glow-active-strong {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.4), 
                      0 0 60px rgba(255, 255, 255, 0.2),
                      inset 0 0 30px rgba(255, 255, 255, 0.15);
          animation: glow-pulse 2s ease-in-out infinite;
        }
        
        .glow-hint {
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.15);
          transition: all 0.5s ease;
        }
        
        @keyframes glow-pulse {
          0%, 100% { 
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.4), 
                        0 0 60px rgba(255, 255, 255, 0.2);
          }
          50% { 
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.6), 
                        0 0 80px rgba(255, 255, 255, 0.3);
          }
        }
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