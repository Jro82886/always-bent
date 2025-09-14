'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import SimpleVesselMarkers from '@/components/tracking/SimpleVesselMarkers';
import MapLegend from '@/components/MapLegend';
import { getInletColor, INLET_COLORS } from '@/lib/inletColors';
import { INLETS } from '@/lib/inlets';

// Initialize Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function CleanTrackingPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedInlet, setSelectedInlet] = useState('nc-hatteras');
  const [showTracks, setShowTracks] = useState(true);
  const [showFleet, setShowFleet] = useState(true);
  const [showCommercial, setShowCommercial] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-75.6, 35.2], // Hatteras
      zoom: 9,
      pitch: 0,
      bearing: 0
    });

    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update CSS variables for inlet colors
  useEffect(() => {
    const color = getInletColor(selectedInlet);
    const glow = INLET_COLORS[selectedInlet]?.glow || 'rgba(255,255,255,0.3)';
    document.documentElement.style.setProperty('--inlet-color', color);
    document.documentElement.style.setProperty('--inlet-glow', glow);
  }, [selectedInlet]);

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
        {/* Inlet Selector */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-lg px-4 py-3 border border-slate-700/50">
          <label className="text-xs text-slate-400 block mb-1">Select Inlet</label>
          <select
            value={selectedInlet}
            onChange={(e) => setSelectedInlet(e.target.value)}
            className="bg-slate-800/50 text-white px-3 py-1 rounded border border-slate-600/50 text-sm focus:outline-none focus:border-cyan-500/50"
          >
            {INLETS.filter(inlet => inlet.id !== 'overview').map(inlet => (
              <option key={inlet.id} value={inlet.id}>
                {inlet.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: getInletColor(selectedInlet),
                boxShadow: `0 0 10px ${INLET_COLORS[selectedInlet]?.glow}`
              }}
            />
            <span className="text-xs text-slate-300">Fleet Color</span>
          </div>
        </div>

        {/* Title */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-lg px-6 py-3 border border-slate-700/50">
          <h1 className="text-lg font-semibold text-white">Vessel Tracking</h1>
          <p className="text-xs text-slate-400">Real-time fleet intelligence</p>
        </div>
      </div>

      {/* Right Control Panel */}
      <div className="absolute top-24 right-4 z-20 w-72">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Vessel Visibility</h3>
          
          {/* Toggle Controls */}
          <div className="space-y-2">
            <label className="flex items-center justify-between p-2 rounded hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full border border-cyan-400/50" />
                <span className="text-sm text-slate-300">Your Vessel</span>
              </div>
              <input type="checkbox" checked disabled className="toggle" />
            </label>

            <label className="flex items-center justify-between p-2 rounded hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getInletColor(selectedInlet) }}
                />
                <span className="text-sm text-slate-300">Fleet Vessels</span>
              </div>
              <input 
                type="checkbox" 
                checked={showFleet}
                onChange={(e) => setShowFleet(e.target.checked)}
                className="toggle"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-transparent border-b-orange-500" />
                <span className="text-sm text-slate-300">Commercial</span>
              </div>
              <input 
                type="checkbox" 
                checked={showCommercial}
                onChange={(e) => setShowCommercial(e.target.checked)}
                className="toggle"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-slate-400" />
                <span className="text-sm text-slate-300">Show Tracks</span>
              </div>
              <input 
                type="checkbox" 
                checked={showTracks}
                onChange={(e) => setShowTracks(e.target.checked)}
                className="toggle"
              />
            </label>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/30 rounded p-2">
                <div className="text-lg font-bold text-white">1</div>
                <div className="text-xs text-slate-400">You</div>
              </div>
              <div className="bg-slate-800/30 rounded p-2">
                <div className="text-lg font-bold text-white">5</div>
                <div className="text-xs text-slate-400">Fleet</div>
              </div>
              <div className="bg-slate-800/30 rounded p-2">
                <div className="text-lg font-bold text-white">3</div>
                <div className="text-xs text-slate-400">GFW</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Legend - Upper Right Corner */}
      <MapLegend position="top-right" collapsed={true} />

      {/* Vessel Markers */}
      {mapReady && (
        <SimpleVesselMarkers 
          map={map.current} 
          selectedInlet={selectedInlet}
        />
      )}

      {/* Custom Toggle Styles */}
      <style jsx>{`
        .toggle {
          appearance: none;
          width: 36px;
          height: 20px;
          background: #475569;
          border-radius: 10px;
          position: relative;
          cursor: pointer;
          transition: background 0.3s;
        }
        .toggle:checked {
          background: #0ea5e9;
        }
        .toggle:after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s;
        }
        .toggle:checked:after {
          transform: translateX(16px);
        }
      `}</style>
    </div>
  );
}
