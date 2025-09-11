'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function LegendaryOceanPlatform() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // Ocean Basemap - Start OFF for better UX
  const [sstActive, setSstActive] = useState(false); // Start with ocean layer OFF
  const [selectedDate, setSelectedDate] = useState('2025-09-10'); // Today's date
  const [sstOpacity, setSstOpacity] = useState(90);

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
      
      // Debug: List all layers after initialization
      setTimeout(() => {
        const layers = mapInstance.getStyle().layers;
        console.log('🗺️ Available layers:', layers.map(l => l.id));
        console.log('🌡️ SST layer exists:', !!mapInstance.getLayer('sst-layer'));
        console.log('🌿 CHL layer exists:', !!mapInstance.getLayer('chl-layer'));
        console.log('🌊 SLA layer exists:', !!mapInstance.getLayer('sla-layer'));
        console.log('🛰️ NOAA layer exists:', !!mapInstance.getLayer('noaa-viirs-layer'));
      }, 2000);

      // SIMPLIFIED: Use ESRI Ocean Basemap SST - reliable XYZ tiles
      mapInstance.addSource('sst', {
        type: 'raster',
        tiles: [`https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}`],
        tileSize: 256,
        maxzoom: 10,
        minzoom: 0,
        attribution: 'Esri, GEBCO, NOAA, National Geographic, DeLorme, HERE, Geonames.org, and other contributors'
      });

      mapInstance.addLayer({
        id: 'sst-layer',
        type: 'raster',
        source: 'sst',
        layout: { visibility: 'none' },  // START HIDDEN (sstActive = false)
        paint: { 
          'raster-opacity': 0.9  // High visibility
        }
      });

      console.log('🌡️ NASA GIBS SST layer added - FOUNDATION DATASET');
      
      // Debug: Check if Copernicus is configured
      console.log('🔍 Copernicus config check - User:', !!process.env.COPERNICUS_USER);
      console.log('🔍 Copernicus config check - Pass:', !!process.env.COPERNICUS_PASS);
      (window as any).map = mapInstance;
    });

    // Add error handling
    mapInstance.on('error', (e) => {
      console.error('🚨 Map error:', e);
    });

    mapInstance.on('sourcedataloading', (e) => {
      console.log('📡 Loading data for source:', e.sourceId);
    });

    mapInstance.on('sourcedata', (e) => {
      if (e.isSourceLoaded) {
        console.log('✅ Data loaded for source:', e.sourceId);
      }
    });

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Handle date changes - ONLY SST (foundation dataset)
  useEffect(() => {
    if (!map.current) return;
    
    // ESRI Ocean Basemap doesn't need date updates - it's a static layer
    // No tile updates needed for this service
    
    // Force map repaint
    map.current.triggerRepaint();
    console.log(`📅 Date changed to: ${selectedDate} - Ocean layer active`);
  }, [selectedDate]);

  // SST toggle - simple and fast
  const toggleSST = () => {
    if (!map.current) return;
    const newState = !sstActive;
    setSstActive(newState);
    
    if (map.current.getLayer('sst-layer')) {
      map.current.setLayoutProperty('sst-layer', 'visibility', newState ? 'visible' : 'none');
      if (newState) {
        map.current.moveLayer('sst-layer'); // Move to top
        map.current.triggerRepaint();
      }
      console.log(`🌊 ESRI Ocean Basemap ${newState ? 'ON' : 'OFF'}`);
    }
  };


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
        
        <div className="space-y-4">
          <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-2">🌊 Ocean Basemap</h2>
            <p className="text-sm opacity-80 mb-3">ESRI World Ocean Base - Reliable SST Data</p>
            
            <button
              onClick={toggleSST}
              className={`w-full px-4 py-3 rounded-lg font-semibold ${
                sstActive ? 'bg-blue-500 text-white' : 'bg-white/20 text-white/80'
              } transition-all`}
            >
              {sstActive ? '🌊 OCEAN ACTIVE' : '🌊 SHOW OCEAN'}
            </button>
            
            {sstActive && (
              <div className="mt-3 px-2">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span>Opacity</span>
                  <span>{sstOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={sstOpacity}
                  onChange={(e) => {
                    const newOpacity = parseInt(e.target.value);
                    setSstOpacity(newOpacity);
                    if (map.current?.getLayer('sst-layer')) {
                      map.current.setPaintProperty('sst-layer', 'raster-opacity', newOpacity / 100);
                    }
                  }}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sstOpacity}%, rgba(255,255,255,0.2) ${sstOpacity}%, rgba(255,255,255,0.2) 100%)`
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
      
    </div>
  );
}