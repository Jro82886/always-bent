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
  const [slaActive, setSlaActive] = useState(false); // Sea Level Anomaly (Altimetry)
  const [thermoActive, setThermoActive] = useState(false); // Thermocline (Mixed Layer Depth)
  const [noaaActive, setNoaaActive] = useState(false); // NOAA VIIRS 4km Chlorophyll
  const [selectedDate, setSelectedDate] = useState('2025-09-09'); // Today
  
  // SST fallback system
  const [sstBadge, setSstBadge] = useState<string | undefined>(undefined);
  
  // Opacity states for sliders
  const [sstOpacity, setSstOpacity] = useState(90);
  const [chlOpacity, setChlOpacity] = useState(85);
  const [slaOpacity, setSlaOpacity] = useState(80);
  const [noaaOpacity, setNoaaOpacity] = useState(85);
  const [thermoOpacity, setThermoOpacity] = useState(80);

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

      // NASA GIBS MODIS SST - Direct tiles, no proxy needed
      mapInstance.addSource('sst', {
        type: 'raster',
        tiles: [`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3_SST_Thermal_4km_Night_Daily/default/2025-09-07/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`],
        tileSize: 256,
        maxzoom: 9,  // MODIS 4km is limited to Level 9
        minzoom: 0
      });

      mapInstance.addLayer({
        id: 'sst-layer',
        type: 'raster',
        source: 'sst',
        layout: { visibility: 'none' },
        paint: { 
          'raster-opacity': 0.9
        }
      });

      // Add chlorophyll source - ULTRA HIGH RESOLUTION (matching successful SST approach)
      mapInstance.addSource('chl', {
        type: 'raster',
        tiles: [`/api/copernicus/{z}/{x}/{y}?time=${selectedDate}T00:00:00.000Z`],
        tileSize: 512,  // ULTRA HIGH RESOLUTION TILES
        maxzoom: 22,    // MAXIMUM ZOOM for pixel-perfect coastline detail
        minzoom: 0      // Full zoom range
      });

      mapInstance.addLayer({
        id: 'chl-layer',
        type: 'raster',
        source: 'chl',
        layout: { visibility: 'none' },
        paint: { 
          'raster-opacity': 0.85
        }
      });

      // Add Sea Level Anomaly (Altimetry) - Shows eddies, currents, upwelling!
      mapInstance.addSource('sla', {
        type: 'raster',
        tiles: [`/api/copernicus-sla/{z}/{x}/{y}?time=${selectedDate}T00:00:00.000Z`],
        tileSize: 512,  // HIGH RESOLUTION TILES (consistent with others)
        maxzoom: 22,    // MAXIMUM ZOOM (consistent with others)
        minzoom: 0      // Full zoom range
      });

      mapInstance.addLayer({
        id: 'sla-layer',
        type: 'raster',
        source: 'sla',
        layout: { visibility: 'none' },
        paint: { 
          'raster-opacity': 0.8
        }
      });

      // Add NOAA VIIRS Chlorophyll layer - ULTRA HIGH RESOLUTION (4km native!)
      mapInstance.addSource('noaa-viirs', {
        type: 'raster',
        tiles: [`/api/noaa-viirs/{z}/{x}/{y}?time=${selectedDate}`],
        tileSize: 512,  // HIGH RESOLUTION TILES (matching successful SST approach)
        maxzoom: 22,    // MAXIMUM ZOOM for 4km native resolution
        minzoom: 0      // Full zoom range
      });

      mapInstance.addLayer({
        id: 'noaa-viirs-layer',
        type: 'raster',
        source: 'noaa-viirs',
        layout: { visibility: 'none' },
        paint: { 
          'raster-opacity': 0.85
        }
      });

      // Add Thermocline (Mixed Layer Depth) - ABFI secret weapon!
      mapInstance.addSource('thermocline', {
        type: 'raster',
        tiles: [`/api/copernicus-thermocline/{z}/{x}/{y}?time=${selectedDate}T00:00:00.000Z`],
        tileSize: 512,  // HIGH RESOLUTION TILES (consistent with others)
        maxzoom: 22,    // MAXIMUM ZOOM (consistent with others)
        minzoom: 0
      });

      mapInstance.addLayer({
        id: 'thermocline-layer',
        type: 'raster',
        source: 'thermocline',
        layout: { visibility: 'none' },
        paint: { 
          'raster-opacity': 0.8
        }
      });

      console.log('🌿 Chlorophyll layer added successfully');
      console.log('🌊 Sea Level Anomaly layer added successfully');
      console.log('🌡️ Thermocline layer added successfully');
      console.log('🛰️ NOAA VIIRS 4km Chlorophyll layer added successfully');
      
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

  // Handle date changes - update ALL ocean layers (iron-clad system)
  useEffect(() => {
    if (!map.current) return;
    
    // Update chlorophyll tiles
    const chlSource = map.current.getSource('chl') as mapboxgl.RasterTileSource;
    if (chlSource && (chlSource as any).setTiles) {
      (chlSource as any).setTiles([`/api/copernicus/{z}/{x}/{y}?time=${selectedDate}T00:00:00.000Z`]);
    }
    
    // Update phytoplankton tiles  
    const slaSource = map.current.getSource('sla') as mapboxgl.RasterTileSource;
    if (slaSource && (slaSource as any).setTiles) {
      (slaSource as any).setTiles([`/api/copernicus-sla/{z}/{x}/{y}?time=${selectedDate}T00:00:00.000Z`]);
    }
    
    // Update SST tiles (NASA GIBS proxy)
    const sstSource = map.current.getSource('sst') as mapboxgl.RasterTileSource;
    if (sstSource && (sstSource as any).setTiles) {
      (sstSource as any).setTiles([`/api/tiles/sst/{z}/{x}/{y}.png?time=${selectedDate}`]);
    }

    // Update NOAA VIIRS tiles
    const noaaSource = map.current.getSource('noaa-viirs') as mapboxgl.RasterTileSource;
    if (noaaSource && (noaaSource as any).setTiles) {
      (noaaSource as any).setTiles([`/api/noaa-viirs/{z}/{x}/{y}?time=${selectedDate}`]);
    }

    // Update Thermocline tiles
    const thermoSource = map.current.getSource('thermocline') as mapboxgl.RasterTileSource;
    if (thermoSource && (thermoSource as any).setTiles) {
      (thermoSource as any).setTiles([`/api/copernicus-thermocline/{z}/{x}/{y}?time=${selectedDate}T00:00:00.000Z`]);
    }
    
    // Force map repaint for all layers
    map.current.triggerRepaint();
    console.log(`📅 Date changed to: ${selectedDate} - ALL layers updated`);
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
      console.log(`🌡️ NASA MODIS SST ${newState ? 'ON' : 'OFF'}`);
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
        
        <div className="space-y-2">
          <button
            onClick={toggleSST}
            className={`w-full px-4 py-2 rounded ${
              sstActive ? 'bg-blue-500' : 'bg-white/20'
            } transition-colors`}
          >
            🌡️ Temperature {sstActive ? 'ON' : 'OFF'}
          </button>
          {sstActive && (
            <div className="px-2">
              <div className="flex items-center justify-between text-xs mb-1">
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
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sstOpacity}%, rgba(255,255,255,0.2) ${sstOpacity}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <button
            onClick={toggleChlorophyll}
            className={`w-full px-4 py-2 rounded ${
              chlActive ? 'bg-green-500' : 'bg-white/20'
            } transition-colors`}
          >
            🌿 Chlorophyll {chlActive ? 'ON' : 'OFF'}
          </button>
          {chlActive && (
            <div className="px-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Opacity</span>
                <span>{chlOpacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={chlOpacity}
                onChange={(e) => {
                  const newOpacity = parseInt(e.target.value);
                  setChlOpacity(newOpacity);
                  if (map.current?.getLayer('chl-layer')) {
                    map.current.setPaintProperty('chl-layer', 'raster-opacity', newOpacity / 100);
                  }
                }}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${chlOpacity}%, rgba(255,255,255,0.2) ${chlOpacity}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => {
              const newState = !slaActive;
              setSlaActive(newState);
              if (map.current?.getLayer('sla-layer')) {
                map.current.setLayoutProperty('sla-layer', 'visibility', newState ? 'visible' : 'none');
                if (newState) {
                  map.current.moveLayer('sla-layer'); // Move to top
                  map.current.triggerRepaint();
                }
                console.log(`🌊 Sea Level Anomaly ${newState ? 'ON' : 'OFF'}`);
              }
            }}
            className={`w-full px-4 py-2 rounded ${
              slaActive ? 'bg-blue-600' : 'bg-white/20'
            } transition-colors`}
          >
            🌊 Altimetry {slaActive ? 'ON' : 'OFF'}
          </button>
          {slaActive && (
            <div className="px-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Opacity</span>
                <span>{slaOpacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={slaOpacity}
                onChange={(e) => {
                  const newOpacity = parseInt(e.target.value);
                  setSlaOpacity(newOpacity);
                  if (map.current?.getLayer('sla-layer')) {
                    map.current.setPaintProperty('sla-layer', 'raster-opacity', newOpacity / 100);
                  }
                }}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #2563eb ${slaOpacity}%, rgba(255,255,255,0.2) ${slaOpacity}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => {
              const newState = !noaaActive;
              setNoaaActive(newState);
              if (map.current?.getLayer('noaa-viirs-layer')) {
                map.current.setLayoutProperty('noaa-viirs-layer', 'visibility', newState ? 'visible' : 'none');
                if (newState) {
                  map.current.moveLayer('noaa-viirs-layer'); // Move to top
                  map.current.triggerRepaint();
                }
                console.log(`🛰️ NOAA VIIRS 4km ${newState ? 'ON' : 'OFF'}`);
              }
            }}
            className={`w-full px-4 py-2 rounded ${
              noaaActive ? 'bg-cyan-500' : 'bg-white/20'
            } transition-colors`}
          >
            🛰️ NOAA 4km {noaaActive ? 'ON' : 'OFF'}
          </button>
          {noaaActive && (
            <div className="px-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Opacity</span>
                <span>{noaaOpacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={noaaOpacity}
                onChange={(e) => {
                  const newOpacity = parseInt(e.target.value);
                  setNoaaOpacity(newOpacity);
                  if (map.current?.getLayer('noaa-viirs-layer')) {
                    map.current.setPaintProperty('noaa-viirs-layer', 'raster-opacity', newOpacity / 100);
                  }
                }}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${noaaOpacity}%, rgba(255,255,255,0.2) ${noaaOpacity}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
          )}
        </div>
        
        <div className="border-t border-white/20 pt-4">
          <p className="text-xs font-bold text-yellow-400 mb-2">⚡ ABFI EXCLUSIVE</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                const newState = !thermoActive;
                setThermoActive(newState);
                if (map.current?.getLayer('thermocline-layer')) {
                  map.current.setLayoutProperty('thermocline-layer', 'visibility', newState ? 'visible' : 'none');
                  if (newState) {
                    map.current.moveLayer('thermocline-layer');
                    map.current.triggerRepaint();
                  }
                  console.log(`🌡️ Thermocline ${newState ? 'ON' : 'OFF'}`);
                }
              }}
              className={`w-full px-4 py-2 rounded ${
                thermoActive ? 'bg-yellow-500' : 'bg-white/20'
              } transition-colors`}
            >
              🌡️ Thermocline {thermoActive ? 'ON' : 'OFF'}
            </button>
            {thermoActive && (
              <div className="px-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Opacity</span>
                  <span>{thermoOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={thermoOpacity}
                  onChange={(e) => {
                    const newOpacity = parseInt(e.target.value);
                    setThermoOpacity(newOpacity);
                    if (map.current?.getLayer('thermocline-layer')) {
                      map.current.setPaintProperty('thermocline-layer', 'raster-opacity', newOpacity / 100);
                    }
                  }}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #eab308 0%, #eab308 ${thermoOpacity}%, rgba(255,255,255,0.2) ${thermoOpacity}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>
            )}
          </div>
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
      
      {/* SST Legend with fallback badge */}
      {sstActive && sstBadge && (
        <div
          style={{
            position: "absolute",
            right: 12,
            bottom: 12,
            padding: "8px 10px",
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            borderRadius: 8,
            backdropFilter: "blur(6px)",
            fontSize: 12,
            lineHeight: 1.2
          }}
        >
          <div style={{ fontWeight: 600 }}>Sea Surface Temp</div>
          <div style={{ opacity: 0.85 }}>{sstBadge}</div>
        </div>
      )}
    </div>
  );
}