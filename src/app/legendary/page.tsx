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

      // Add SST source
      mapInstance.addSource('sst', {
        type: 'raster',
        tiles: ['/api/sst/{z}/{x}/{y}'],
        tileSize: 256
      });

      mapInstance.addLayer({
        id: 'sst-layer',
        type: 'raster',
        source: 'sst',
        layout: { visibility: 'none' },
        paint: { 'raster-opacity': 0.8 }
      });

      // Add chlorophyll source with dynamic date
      mapInstance.addSource('chl', {
        type: 'raster',
        tiles: [`/api/copernicus/{z}/{x}/{y}?time=${selectedDate}T00:00:00.000Z`],
        tileSize: 256
      });

      mapInstance.addLayer({
        id: 'chl-layer',
        type: 'raster',
        source: 'chl',
        layout: { visibility: 'none' },
        paint: { 
          'raster-opacity': 0.8,
          'raster-fade-duration': 300,
          'raster-resampling': 'linear'  // Smooth interpolation
        }
      });

      console.log('🌿 Chlorophyll layer added successfully');
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

  // SST toggle
  const toggleSST = () => {
    if (!map.current) return;
    const newState = !sstActive;
    setSstActive(newState);
    
    if (map.current.getLayer('sst-layer')) {
      map.current.setLayoutProperty('sst-layer', 'visibility', newState ? 'visible' : 'none');
      console.log(`🌡️ SST ${newState ? 'ON' : 'OFF'}`);
    }
  };

  // Chlorophyll toggle with debugging
  const toggleChlorophyll = () => {
    if (!map.current) return;
    const newState = !chlActive;
    setChlActive(newState);
    
    if (map.current.getLayer('chl-layer')) {
      map.current.setLayoutProperty('chl-layer', 'visibility', newState ? 'visible' : 'none');
      if (newState) {
        // Force layer to be visible and on top
        map.current.setPaintProperty('chl-layer', 'raster-opacity', 0.9);
        map.current.moveLayer('chl-layer');
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
        
        <div className="border-t border-white/20 pt-4">
          <label className="text-sm opacity-80 block mb-2">📅 Date Selection</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
          >
            <option value="2025-09-09">Today (Sep 9)</option>
            <option value="2025-09-08">Yesterday (Sep 8)</option>
            <option value="2025-09-07">2 Days Ago (Sep 7)</option>
            <option value="2025-09-06">3 Days Ago (Sep 6)</option>
            <option value="2025-09-05">4 Days Ago (Sep 5)</option>
          </select>
        </div>
        
        <p className="text-xs opacity-60">
          ⚡ Powered by Claude & Cursor
        </p>
      </div>
    </div>
  );
}