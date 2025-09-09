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
  const [chlActive, setChlActive] = useState(false);
  const [phycActive, setPhycActive] = useState(false); // Total Phytoplankton
  const [selectedDate, setSelectedDate] = useState('2025-09-09'); // Today

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

      // Add SST source - professional thermal visualization
      mapInstance.addSource('sst', {
        type: 'raster',
        tiles: [`/api/copernicus-sst/{z}/{x}/{y}?time=${selectedDate}T00:00:00.000Z`],
        tileSize: 512,  // High resolution
        maxzoom: 20,    // Ultra-detailed thermal analysis
        minzoom: 0
      });

      mapInstance.addLayer({
        id: 'sst-layer',
        type: 'raster',
        source: 'sst',
        layout: { visibility: 'none' },
        paint: { 
          'raster-opacity': 0.85,          // Prominent thermal visibility
          'raster-fade-duration': 150,
          'raster-resampling': 'linear',
          'raster-brightness-min': 0.0,
          'raster-brightness-max': 1.0,
          'raster-contrast': 0.4,          // Strong thermal contrast
          'raster-saturation': 1.3         // Vivid thermal colors
        }
      });

      // Add chlorophyll source - optimized for coastline clarity
      mapInstance.addSource('chl', {
        type: 'raster',
        tiles: [`/api/copernicus/{z}/{x}/{y}?time=${selectedDate}T00:00:00.000Z`],
        tileSize: 512,  // Higher resolution tiles
        maxzoom: 20,    // Ultra-deep zoom for precise analysis
        minzoom: 0
      });

      mapInstance.addLayer({
        id: 'chl-layer',
        type: 'raster',
        source: 'chl',
        layout: { visibility: 'none' },
        paint: { 
          'raster-opacity': 0.8,
          'raster-fade-duration': 150,     // Smooth transitions
          'raster-resampling': 'linear',   // Anti-aliased coastlines
          'raster-brightness-min': 0.0,   // Full dynamic range
          'raster-brightness-max': 1.0,
          'raster-contrast': 0.3,          // Enhanced definition
          'raster-saturation': 1.2,       // Vibrant but not oversaturated
          'raster-hue-rotate': 0          // Keep natural colors
        }
      });

      // Add Total Phytoplankton layer (another Copernicus layer)
      mapInstance.addSource('phyc', {
        type: 'raster',
        tiles: [`/api/copernicus-phyc/{z}/{x}/{y}?time=${selectedDate}T00:00:00.000Z`],
        tileSize: 256
      });

      mapInstance.addLayer({
        id: 'phyc-layer',
        type: 'raster',
        source: 'phyc',
        layout: { visibility: 'none' },
        paint: { 
          'raster-opacity': 0.8,
          'raster-fade-duration': 300,
          'raster-resampling': 'linear'
        }
      });

      console.log('🌿 Chlorophyll layer added successfully');
      console.log('🦠 Phytoplankton layer added successfully');
      
      // Debug: Check if Copernicus is configured
      console.log('🔍 Copernicus config check - User:', !!process.env.COPERNICUS_USER);
      console.log('🔍 Copernicus config check - Pass:', !!process.env.COPERNICUS_PASS);
      (window as any).map = mapInstance;
    });

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Handle date changes - update chlorophyll tiles
  useEffect(() => {
    if (!map.current || !map.current.getSource('chl')) return;
    
    const source = map.current.getSource('chl') as mapboxgl.RasterTileSource;
    if (source && (source as any).setTiles) {
      (source as any).setTiles([`/api/copernicus/{z}/{x}/{y}?time=${selectedDate}T00:00:00.000Z`]);
      map.current.triggerRepaint();
      console.log(`📅 Date changed to: ${selectedDate}`);
    }
  }, [selectedDate]);

  // SST toggle with forced visibility
  const toggleSST = () => {
    if (!map.current) return;
    const newState = !sstActive;
    setSstActive(newState);
    
    if (map.current.getLayer('sst-layer')) {
      map.current.setLayoutProperty('sst-layer', 'visibility', newState ? 'visible' : 'none');
      if (newState) {
        // Force layer properties to ensure visibility
        map.current.setPaintProperty('sst-layer', 'raster-opacity', 0.8);
        map.current.moveLayer('sst-layer'); // Move to top
        map.current.triggerRepaint();
      }
      console.log(`🌡️ SST ${newState ? 'ON' : 'OFF'} - Forced visible`);
    }
  };

  // Chlorophyll toggle - bulletproof version
  const toggleChlorophyll = () => {
    if (!map.current) return;
    const newState = !chlActive;
    setChlActive(newState);
    
    if (map.current.getLayer('chl-layer')) {
      map.current.setLayoutProperty('chl-layer', 'visibility', newState ? 'visible' : 'none');
      if (newState) {
        // Force layer to be visible and reload tiles
        map.current.setPaintProperty('chl-layer', 'raster-opacity', 0.8);
        map.current.moveLayer('chl-layer');
        // Force tile reload to ensure data appears
        const source = map.current.getSource('chl') as mapboxgl.RasterTileSource;
        if (source && (source as any).setTiles) {
          (source as any).setTiles([`/api/copernicus/{z}/{x}/{y}?time=${selectedDate}T00:00:00.000Z`]);
          map.current.triggerRepaint();
        }
      }
      console.log(`🌿 Chlorophyll ${newState ? 'ON' : 'OFF'} - Layer visibility: ${newState ? 'visible' : 'none'}`);
    } else {
      console.error('🚨 Chlorophyll layer not found!');
    }
  };

  return (
    <div className="w-full h-screen relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Simple Control Panel */}
      <div className="absolute top-8 left-8 bg-black/80 backdrop-blur rounded-2xl p-6 text-white space-y-4">
        <h1 className="text-xl font-bold">
          HI AMANDA! 👋 ALWAYS BENT
        </h1>
        <p className="text-sm opacity-80">Ocean Intelligence Platform</p>
        
        <button
          onClick={toggleSST}
          className={`w-full px-4 py-2 rounded ${
            sstActive ? 'bg-blue-500' : 'bg-white/20'
          } transition-colors`}
        >
          🌡️ Temperature {sstActive ? 'ON' : 'OFF'}
        </button>
        
        <button
          onClick={toggleChlorophyll}
          className={`w-full px-4 py-2 rounded ${
            chlActive ? 'bg-green-500' : 'bg-white/20'
          } transition-colors`}
        >
          🌿 Chlorophyll {chlActive ? 'ON' : 'OFF'}
        </button>
        
        <button
          onClick={() => {
            const newState = !phycActive;
            setPhycActive(newState);
            if (map.current?.getLayer('phyc-layer')) {
              map.current.setLayoutProperty('phyc-layer', 'visibility', newState ? 'visible' : 'none');
              console.log(`🦠 Phytoplankton ${newState ? 'ON' : 'OFF'}`);
            }
          }}
          className={`w-full px-4 py-2 rounded ${
            phycActive ? 'bg-purple-500' : 'bg-white/20'
          } transition-colors`}
        >
          🦠 Phytoplankton {phycActive ? 'ON' : 'OFF'}
        </button>
        
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