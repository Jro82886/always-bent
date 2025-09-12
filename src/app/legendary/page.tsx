'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { setVis } from '@/map/layerVis';
import SSTLayer from '@/components/layers/SSTLayer';
import SSTLegend from '@/components/SSTLegend';
import CoastlineSmoother from '@/components/layers/CoastlineSmoother';
import SnipController from '@/components/SnipController';
import { EAST_COAST_BOUNDS } from '@/lib/imagery/bounds';
import '@/styles/mapSmoothing.css';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function LegendaryOceanPlatform() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // Ocean Basemap + Copernicus layers
  const [oceanActive, setOceanActive] = useState(false); // ESRI Ocean Basemap (bathymetry)
  const [sstActive, setSstActive] = useState(false); // Copernicus SST
  const [chlActive, setChlActive] = useState(false); // Copernicus Chlorophyll
  const [selectedDate, setSelectedDate] = useState('today');
  const [oceanOpacity, setOceanOpacity] = useState(60);
  const [sstOpacity, setSstOpacity] = useState(90);
  const [chlOpacity, setChlOpacity] = useState(70);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-75, 36],
      zoom: 6,
      pitch: 0,  // Ensure flat map (no 3D tilt)
      bearing: 0, // Ensure north is up (no rotation)
      cooperativeGestures: true
    });

    const mapInstance = map.current;

    mapInstance.on('load', () => {
      console.log('🌊 LEGENDARY OCEAN PLATFORM INITIALIZED 🚀');
      // Constrain to East Coast AOI
      mapInstance.fitBounds(EAST_COAST_BOUNDS as any, { padding: 40, duration: 0 });
      mapInstance.setMaxBounds(EAST_COAST_BOUNDS as any);
      
      // Ensure map stays flat
      mapInstance.setPitch(0);
      mapInstance.setBearing(0);
      
      // Disable pitch/rotation controls
      mapInstance.dragRotate.disable();
      mapInstance.touchPitch.disable();
      
      // Debug: List layers and confirm presence
      setTimeout(() => {
        const layers = mapInstance.getStyle().layers;
        console.log('🗺️ Available layers:', layers.map(l => l.id));
        console.log('🌊 Ocean layer exists:', !!mapInstance.getLayer('ocean-layer'));
        console.log('🌡️ SST layer exists:', !!mapInstance.getLayer('sst-lyr'));
        console.log('🌿 CHL layer exists:', !!mapInstance.getLayer('chl-lyr'));
      }, 2000);

      // ESRI Ocean Basemap (bathymetry/depth data)
      mapInstance.addSource('ocean', {
        type: 'raster',
        tiles: [`https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}`],
        tileSize: 256,
        maxzoom: 10,
        minzoom: 0,
        attribution: 'Esri, GEBCO, NOAA, National Geographic, DeLorme, HERE, Geonames.org, and other contributors'
      });

      // Ocean Basemap Layer (bathymetry)
      mapInstance.addLayer({
        id: 'ocean-layer',
        type: 'raster',
        source: 'ocean',
        layout: { visibility: 'none' },  // START HIDDEN
        paint: {
          'raster-opacity': 0.6  // Moderate opacity for bathymetry
        }
      });

      // SST now wired by SSTLayer component when toggled

      // Copernicus Chlorophyll - via proxy (left as-is for now)
      if (!mapInstance.getSource('chl-src')) {
        mapInstance.addSource('chl-src', {
          type: 'raster',
          tiles: ['/api/tiles/chl/{z}/{x}/{y}.png'],
          tileSize: 256, // Standard tile size for now
          minzoom: 0,
          maxzoom: 24
        });
      }

      if (!mapInstance.getLayer('chl-lyr')) {
        mapInstance.addLayer({
          id: 'chl-lyr',
          type: 'raster',
          source: 'chl-src',
          layout: { visibility: 'none' },
          paint: { 
            'raster-opacity': 0.7,  // Start at 70% to blend better
            'raster-contrast': 0.2,  // Enhance color differences
            'raster-saturation': 0.3  // Boost the green colors
          },
          minzoom: 0,
          maxzoom: 24
        }, 'land-structure-polygon');  // Place BELOW land layer
      }

      console.log('🌊 ESRI Ocean Basemap layer added (bathymetry) - Atlantic East Coast coverage');
      console.log('🌡️ Copernicus SST layer added - High resolution temperature data');
      console.log('🌿 Copernicus Chlorophyll layer added - High resolution ocean color data');

      // Debug: Check if Copernicus is configured
      // Copernicus credentials are backend-only, frontend doesn't need them
      console.log('🔍 SST tiles configured - using backend API proxy');
      (window as any).map = mapInstance;
    });

    // 🔒 Additional error handling (backup)

    mapInstance.on('sourcedataloading', (e: any) => {
      console.log('📡 Loading data for source:', e.sourceId);
    });

    mapInstance.on('sourcedata', (e: any) => {
      if (e.isSourceLoaded) {
        console.log('✅ Data loaded for source:', e.sourceId);
      }
    });

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Date selection for future Copernicus layers
  useEffect(() => {
    if (!map.current) return;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(selectedDate)) return;
    console.log(`📅 Date changed to: ${selectedDate} - ready for Copernicus layers`);
  }, [selectedDate]);

  // Ocean Basemap toggle (bathymetry)
  const toggleOcean = () => {
    if (!map.current) return;
    const newState = !oceanActive;
    setOceanActive(newState);

    if (map.current.getLayer('ocean-layer')) {
      map.current.setLayoutProperty('ocean-layer', 'visibility', newState ? 'visible' : 'none');
      if (newState) {
        map.current.moveLayer('ocean-layer'); // Move to bottom
        map.current.triggerRepaint();
      }
    }
    console.log(`🌊 ESRI Ocean Basemap ${newState ? 'ON' : 'OFF'}`);
  };

  // Initialize layer defaults
  useEffect(() => {
    if (!map.current) return;
    // Layers start hidden - user must manually toggle
    setTimeout(() => {
      if (map.current) {
        setVis(map.current, 'sst-lyr', false);  // Start SST OFF
        setVis(map.current, 'chl-lyr', false);  // Start CHL OFF
        setSstActive(false);  // SST state OFF
        setChlActive(false);  // CHL state OFF
      }
    }, 1000);
  }, []);

  // SST toggle - Copernicus high-resolution temperature
  const toggleSST = () => {
    if (!map.current) return;
    const newState = !sstActive;
    setSstActive(newState);
    console.log(`🌡️ Copernicus SST ${newState ? 'ON' : 'OFF'}`);
  };

  // CHL toggle - Copernicus chlorophyll
  const toggleCHL = () => {
    if (!map.current) return;
    const newState = !chlActive;
    setChlActive(newState);
    setVis(map.current, 'chl-lyr', newState);
    console.log(`🌿 Copernicus CHL ${newState ? 'ON' : 'OFF'}`);
  };


  return (
    <div className={`w-full h-screen relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 ${sstActive ? 'sst-active' : ''}`}>
      {/* Map Container with enhanced rendering */}
      <div 
        ref={mapContainer} 
        className="w-full h-full" 
        style={{ 
          imageRendering: 'pixelated',
          transform: 'translateZ(0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        } as React.CSSProperties & {
          WebkitImageRendering?: string;
          MozImageRendering?: string;
          msImageRendering?: string;
        }}
      />
      
      {/* Simple Control Panel */}
      <div className="absolute top-8 left-8 bg-black/80 backdrop-blur rounded-2xl p-6 text-white space-y-4">
        <h1 className="text-xl font-bold">
          HI AMANDA! 👋 ALWAYS BENT
        </h1>
        <p className="text-sm opacity-80">Ocean Intelligence Platform</p>

        {/* 🔒 Connection Status Indicator */}
        <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
          🟢 Copernicus Ready
        </div>
        
        <div className="space-y-4">
          {/* Ocean Basemap Toggle (Bathymetry) */}
          <div className="bg-blue-600/20 border border-blue-600/40 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-2">🌊 Ocean Basemap</h2>
            <p className="text-sm opacity-80 mb-3">ESRI Bathymetry - Ocean Depth Data</p>

            <button
              onClick={toggleOcean}
              className={`w-full px-4 py-3 rounded-lg font-semibold ${
                oceanActive ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/80'
              } transition-all`}
            >
              {oceanActive ? '🌊 OCEAN ACTIVE' : '🌊 SHOW OCEAN'}
            </button>

            {oceanActive && (
              <div className="mt-3 px-2">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span>Opacity</span>
                  <span>{oceanOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={oceanOpacity}
                  onChange={(e) => {
                    const newOpacity = parseInt(e.target.value);
                    // SAFEGUARD: Validate opacity range
                    const clampedOpacity = Math.max(20, Math.min(80, newOpacity));
                    setOceanOpacity(clampedOpacity);

                    // SAFEGUARD: Check map and layer exist before updating
                    if (map.current?.getLayer('ocean-layer')) {
                      try {
                        map.current.setPaintProperty('ocean-layer', 'raster-opacity', clampedOpacity / 100);
                      } catch (error) {
                        console.error('🚨 Ocean opacity update failed:', error);
                      }
                    } else {
                      console.warn('⚠️ Ocean layer not available for opacity update');
                    }
                  }}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${oceanOpacity}%, rgba(255,255,255,0.2) ${oceanOpacity}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>
            )}
          </div>

          {/* SST Toggle (Copernicus) */}
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-2">🌡️ Sea Surface Temperature</h2>
            <p className="text-sm opacity-80 mb-3">Copernicus Marine - High Resolution SST</p>

            <button
              onClick={toggleSST}
              className={`w-full px-4 py-3 rounded-lg font-semibold ${
                sstActive ? 'bg-red-500 text-white' : 'bg-white/20 text-white/80'
              } transition-all`}
            >
              {sstActive ? '🌡️ SST ACTIVE' : '🌡️ SHOW SST'}
            </button>

            {sstActive && (
              <div className="mt-3 px-2">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span>Opacity</span>
                  <span>{sstOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={sstOpacity}
                  onChange={(e) => {
                    const newOpacity = parseInt(e.target.value);
                    setSstOpacity(newOpacity);
                    if (map.current?.getLayer('sst-lyr')) {
                      map.current.setPaintProperty('sst-lyr', 'raster-opacity', newOpacity / 100);
                    }
                  }}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${sstOpacity}%, rgba(255,255,255,0.2) ${sstOpacity}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>
            )}
          </div>

          {/* Chlorophyll Toggle (Copernicus) */}
          <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-2">🌿 Chlorophyll</h2>
            <p className="text-sm opacity-80 mb-3">Copernicus Marine - Ocean Color Data</p>

            <button
              onClick={toggleCHL}
              className={`w-full px-4 py-3 rounded-lg font-semibold ${
                chlActive ? 'bg-green-500 text-white' : 'bg-white/20 text-white/80'
              } transition-all`}
            >
              {chlActive ? '🌿 CHL ACTIVE' : '🌿 SHOW CHL'}
            </button>

            {chlActive && (
              <div className="mt-3 px-2">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span>Opacity</span>
                  <span>{chlOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={chlOpacity}
                  onChange={(e) => {
                    const newOpacity = parseInt(e.target.value);
                    setChlOpacity(newOpacity);
                    if (map.current?.getLayer('chl-lyr')) {
                      map.current.setPaintProperty('chl-lyr', 'raster-opacity', newOpacity / 100);
                    }
                  }}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #22c55e 0%, #22c55e ${chlOpacity}%, rgba(255,255,255,0.2) ${chlOpacity}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>
            )}
          </div>
        </div>
        
        
        
        
        <div className="border-t border-white/20 pt-4">
          <p className="text-xs font-bold text-yellow-400 mb-2">⚡ ABFI EXCLUSIVE</p>
        </div>
        
        <div className="border-t border-white/20 pt-4">
          <label className="text-sm font-semibold block mb-3">📅 Ocean Data Date</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { date: '2025-09-09', label: 'Today', desc: 'Latest' },
              { date: '2025-09-08', label: 'Sep 8', desc: 'Yesterday' },
              { date: '2025-09-07', label: 'Sep 7', desc: '2 days ago' },
              { date: '2025-09-06', label: 'Sep 6', desc: '3 days ago' },
              { date: '2025-09-05', label: 'Sep 5', desc: '4 days ago' },
              { date: '2025-09-04', label: 'Sep 4', desc: '5 days ago' }
            ].map(option => (
              <button
                key={option.date}
                onClick={() => setSelectedDate(option.date)}
                className={`p-3 rounded-lg text-left transition-all ${
                  selectedDate === option.date 
                    ? 'bg-white/20 border-2 border-white/40 shadow-lg' 
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs opacity-70">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>
        
        <p className="text-xs opacity-60">
          ⚡ Powered by Claude & Cursor
        </p>
      </div>

      {/* SST Layer component */}
      <SSTLayer map={map.current} on={sstActive} />
      
      {/* Coastline Smoother - active when SST is shown */}
      <CoastlineSmoother map={map.current} enabled={sstActive} />
      
      {/* SST Temperature Legend */}
      <SSTLegend visible={sstActive} />
      
      {/* Snip-It Controller - Handles drawing, analysis, and reporting */}
      <SnipController map={map.current} />

    </div>
  );
}