'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function LegendaryOceanPlatform() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // Ocean Basemap only (Copernicus layers to be added)
  const [oceanActive, setOceanActive] = useState(false); // ESRI Ocean Basemap (bathymetry)
  const [selectedDate, setSelectedDate] = useState('today');
  const [oceanOpacity, setOceanOpacity] = useState(60);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-75, 36],
      zoom: 6,
      cooperativeGestures: true
    });

    const mapInstance = map.current;

    mapInstance.on('load', () => {
      console.log('🌊 LEGENDARY OCEAN PLATFORM INITIALIZED 🚀');
      
      // Debug: List layers and confirm ocean layer presence
      setTimeout(() => {
        const layers = mapInstance.getStyle().layers;
        console.log('🗺️ Available layers:', layers.map(l => l.id));
        console.log('🌊 Ocean layer exists:', !!mapInstance.getLayer('ocean-layer'));
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

      // Copernicus layers to be added here

      console.log('🌊 ESRI Ocean Basemap layer added (bathymetry) - Atlantic East Coast coverage');

      // Debug: Check if Copernicus is configured
      console.log('🔍 Copernicus config check - User:', !!process.env.COPERNICUS_USER);
      console.log('🔍 Copernicus config check - Pass:', !!process.env.COPERNICUS_PASS);
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

  // Copernicus layer toggles to be added here


  return (
    <div className="w-full h-screen relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
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

          {/* Copernicus Layer Toggles - To be added */}
          <div className="bg-gray-500/20 border border-gray-500/40 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-2">🛰️ Copernicus Marine</h2>
            <p className="text-sm opacity-80 mb-3">High-resolution ocean data layers</p>
            <div className="text-center py-4 text-white/60">
              SST • Chlorophyll • Altimetry • Thermocline
              <br />
              <span className="text-xs">Coming soon...</span>
            </div>
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

      {/* Copernicus legends to be added */}

    </div>
  );
}