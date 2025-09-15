'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';

// Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Mock vessel data
const mockVessels = [
  { id: 'user', lat: 26.9, lng: -79.8, type: 'user', name: 'Your Vessel' },
  { id: 'fleet1', lat: 26.85, lng: -79.75, type: 'fleet', name: 'Reel Deal' },
  { id: 'fleet2', lat: 26.95, lng: -79.85, type: 'fleet', name: 'Sea Hunter' },
  { id: 'fleet3', lat: 26.88, lng: -79.9, type: 'fleet', name: 'Lucky Strike' },
  { id: 'commercial1', lat: 26.92, lng: -79.7, type: 'commercial', name: 'Commercial A' },
  { id: 'commercial2', lat: 26.8, lng: -79.82, type: 'commercial', name: 'Commercial B' }
];

export default function TrackingPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { selectedInletId } = useAppState();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-79.8, 26.9],
      zoom: 8,
      pitch: 0,
      bearing: 0
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Hide all polygon layers
      const layersToHide = [
        'polygon-fills', 'polygon-outlines', 'polygon-labels', 'ocean-polygons',
        'sst-polygons', 'chl-polygons', 'edge-polygons', 'temperature-fronts',
        'chlorophyll-edges', 'sst-lyr', 'chl-lyr', 'edge-lines', 'hotspot-markers'
      ];
      
      layersToHide.forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });

      // Add mock vessels
      mockVessels.forEach(vessel => {
        const el = document.createElement('div');
        el.className = 'vessel-marker';
        
        if (vessel.type === 'user') {
          el.style.cssText = 'width: 16px; height: 16px; background: white; border-radius: 50%; box-shadow: 0 0 20px rgba(255,255,255,0.8);';
        } else if (vessel.type === 'fleet') {
          el.style.cssText = 'width: 14px; height: 14px; background: #06b6d4; border-radius: 50%; box-shadow: 0 0 15px rgba(6,182,212,0.6);';
        } else {
          el.style.cssText = 'width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 12px solid #f97316;';
        }

        new mapboxgl.Marker(el)
          .setLngLat([vessel.lng, vessel.lat])
          .addTo(map.current!);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Top Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 backdrop-blur-md rounded-lg px-6 py-3 border border-cyan-500/20">
        <h1 className="text-cyan-400 font-bold">TRACKING MODE - CLEAN MAP</h1>
        <p className="text-white text-sm">Hi Amanda! 🎯 {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Left Panel */}
      <div className="absolute top-20 left-4 z-10 w-80 bg-slate-900/90 backdrop-blur-md rounded-xl border border-cyan-500/20 p-4">
        <h2 className="text-white font-bold mb-4">Fleet Command</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white">
            <div className="w-3 h-3 bg-white rounded-full" />
            <span>Your Vessel</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400">
            <div className="w-3 h-3 bg-cyan-400 rounded-full" />
            <span>Fleet (3)</span>
          </div>
          <div className="flex items-center gap-2 text-orange-400">
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[10px] border-transparent border-b-orange-500" />
            <span>Commercial (2)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
