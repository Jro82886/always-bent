'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function LegendaryOceanPlatform() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // Ocean Basemap + SST layers
  const [oceanActive, setOceanActive] = useState(false); // ESRI Ocean Basemap (bathymetry)
  const [sstActive, setSstActive] = useState(false); // NOAA SST (temperature)
  const [selectedDate, setSelectedDate] = useState('2025-09-10'); // Today's date
  const [oceanOpacity, setOceanOpacity] = useState(60);
  const [sstOpacity, setSstOpacity] = useState(85);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'degraded'>('online');

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

      // ESRI Ocean Basemap (bathymetry/depth data)
      mapInstance.addSource('ocean', {
        type: 'raster',
        tiles: [`https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}`],
        tileSize: 256,
        maxzoom: 10,
        minzoom: 0,
        attribution: 'Esri, GEBCO, NOAA, National Geographic, DeLorme, HERE, Geonames.org, and other contributors'
      });

      // NASA GIBS SST - CORRECT WEB MERCATOR FORMAT
      // Dataset: MODIS Aqua L3 SST Thermal 4km Night Daily
      // Coverage: Global with excellent East Coast coverage
      // Style: Built-in NASA thermal colormap (red=cold, yellow=hot)
      // Time: Daily composites optimized for fishing
      // CORRECT WMTS Format: epsg3857/best/{LAYER}/default/{DATE}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png
      mapInstance.addSource('sst', {
        type: 'raster',
        tiles: [`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3_SST_Thermal_4km_Night_Daily/default/${selectedDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`],
        tileSize: 256,
        maxzoom: 9,
        minzoom: 0
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

      // SST Layer (temperature - BRIGHT and VIVID - NASA GIBS)
      mapInstance.addLayer({
        id: 'sst-layer',
        type: 'raster',
        source: 'sst',
        layout: { visibility: 'none' },  // START HIDDEN
        paint: {
          'raster-opacity': 0.9,   // Very high opacity for maximum visibility
          'raster-contrast': 0.5,   // High contrast for thermal data
          'raster-saturation': 1.0  // Full saturation for vibrant colors
        }
      });

      console.log('🌊 ESRI Ocean Basemap layer added (bathymetry) - Atlantic East Coast coverage');
      console.log('🌡️ NASA GIBS SST layer added - EAST COAST OPTIMIZED - BRIGHT red/orange/yellow temperature gradients');

      // 🔒 SAFEGUARD: Add error handlers for tile loading failures
      mapInstance.on('error', (e: any) => {
        console.error('🚨 Map error:', e.error);
        if (e.error?.message?.includes('sst')) {
          console.warn('⚠️ SST tile loading failed - may be temporary NASA GIBS issue');
        }
      });

      mapInstance.on('sourcedataabort', (e: any) => {
        if (e.sourceId === 'sst') {
          console.warn('⚠️ SST tile request aborted - network or service issue');
        }
      });

      // 🔒 SAFEGUARD: Monitor tile loading for SST with connection status
      let sstTileErrors = 0;
      const maxErrors = 5; // Allow up to 5 errors before marking as degraded

      mapInstance.on('sourcedata', (e: any) => {
        if (e.sourceId === 'sst' && e.isSourceLoaded) {
          sstTileErrors = 0; // Reset error counter on successful load
          setConnectionStatus('online');
          console.log('✅ SST tiles loaded successfully');
        }
      });

      // 🔒 Track tile loading errors
      mapInstance.on('error', (e: any) => {
        if (e.sourceId === 'sst' || e.error?.message?.includes('gibs.earthdata.nasa.gov')) {
          sstTileErrors++;
          if (sstTileErrors >= maxErrors) {
            setConnectionStatus('degraded');
            console.warn(`⚠️ NASA GIBS connection degraded (${sstTileErrors} errors)`);
          }
        }
      });

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

  // Handle date changes - Update SST layer (ocean basemap doesn't need dates) with SAFEGUARDS
  useEffect(() => {
    if (!map.current) {
      console.warn('🚨 Date Change: Map not initialized');
      return;
    }

    // SAFEGUARD: Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(selectedDate)) {
      console.error('🚨 Date Change: Invalid date format:', selectedDate);
      return;
    }

    // SAFEGUARD: Only update if SST is active (prevents unnecessary requests)
    if (!sstActive) {
      console.log(`📅 Date changed to: ${selectedDate} - SST layer inactive, no update needed`);
      return;
    }

    try {
      // Update SST layer tiles with new date - NASA GIBS WMTS
      const sstSource = map.current.getSource('sst') as mapboxgl.RasterTileSource;
      if (sstSource && (sstSource as any).setTiles) {
        const tileUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3_SST_Thermal_4km_Night_Daily/default/${selectedDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`;
        (sstSource as any).setTiles([tileUrl]);
        map.current.triggerRepaint();
        console.log(`📅 Date changed to: ${selectedDate} - SST layer updated successfully`);
      } else {
        console.warn('⚠️ Date Change: SST source not available for update');
      }
    } catch (error) {
      console.error('🚨 Date Change failed:', error);
    }
  }, [selectedDate, sstActive]);

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

  // SST toggle - BRIGHT temperature layer with SAFEGUARDS
  const toggleSST = () => {
    if (!map.current) {
      console.warn('🚨 SST Toggle: Map not initialized');
      return;
    }

    const newState = !sstActive;
    setSstActive(newState);

    try {
      // SAFEGUARD: Check if layer exists before manipulating
      if (!map.current.getLayer('sst-layer')) {
        console.error('🚨 SST Toggle: sst-layer not found on map');
        // Reset state if layer doesn't exist
        setSstActive(false);
        return;
      }

      // SAFEGUARD: Check if source exists
      if (!map.current.getSource('sst')) {
        console.error('🚨 SST Toggle: sst source not found on map');
        setSstActive(false);
        return;
      }

      map.current.setLayoutProperty('sst-layer', 'visibility', newState ? 'visible' : 'none');

      if (newState) {
        // SAFEGUARD: Move layer safely
        try {
          map.current.moveLayer('sst-layer'); // Move to top
          map.current.triggerRepaint();
        } catch (moveError) {
          console.warn('⚠️ SST Layer move failed, continuing anyway:', moveError);
        }
      }

      console.log(`🌡️ NASA GIBS SST ${newState ? 'ON' : 'OFF'} - EAST COAST - BRIGHT red/orange/yellow temperature gradients`);

    } catch (error) {
      console.error('🚨 SST Toggle failed:', error);
      // SAFEGUARD: Reset state on error
      setSstActive(false);
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

        {/* 🔒 Connection Status Indicator */}
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          connectionStatus === 'online' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          connectionStatus === 'degraded' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
          'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {connectionStatus === 'online' ? '🟢 NASA GIBS Online' :
           connectionStatus === 'degraded' ? '🟡 NASA GIBS Degraded' :
           '🔴 NASA GIBS Offline'}
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

          {/* SST Toggle (Temperature - BRIGHT!) */}
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-2">🌡️ Sea Surface Temperature</h2>
            <p className="text-sm opacity-80 mb-3">NASA GIBS MODIS SST - East Coast Optimized - Red/Orange/Yellow Temperature</p>

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
                  max="95"
                  value={sstOpacity}
                  onChange={(e) => {
                    const newOpacity = parseInt(e.target.value);
                    // SAFEGUARD: Validate opacity range
                    const clampedOpacity = Math.max(50, Math.min(95, newOpacity));
                    setSstOpacity(clampedOpacity);

                    // SAFEGUARD: Check map and layer exist before updating
                    if (map.current?.getLayer('sst-layer')) {
                      try {
                        map.current.setPaintProperty('sst-layer', 'raster-opacity', clampedOpacity / 100);
                      } catch (error) {
                        console.error('🚨 SST opacity update failed:', error);
                      }
                    } else {
                      console.warn('⚠️ SST layer not available for opacity update');
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