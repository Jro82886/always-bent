'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { setVis } from '@/map/layerVis';
import SSTLayer from '@/components/layers/SSTLayer';
import CoastlineSmoother from '@/components/layers/CoastlineSmoother';
import TutorialOverlay from '@/components/TutorialOverlay';
import UnifiedCommandBar from '@/components/UnifiedCommandBar';
import LeftZone from '@/components/LeftZone';
import RightZone from '@/components/RightZone';
import CommunityMode from '@/components/community/CommunityMode';
import TrackingMode from '@/components/tracking/TrackingMode';
import TrendsMode from '@/components/trends/TrendsMode';
import { EAST_COAST_BOUNDS, OCEAN_FOCUSED_BOUNDS } from '@/lib/imagery/bounds';
import '@/styles/mapSmoothing.css';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function LegendaryOceanPlatform() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // Tab state - 'analysis' | 'tracking' | 'community' | 'trends'
  const [activeTab, setActiveTab] = useState<string>('analysis');
  
  // Get boat name from localStorage
  const [boatName, setBoatName] = useState<string>('');
  
  // Ocean Basemap + Copernicus layers
  const [oceanActive, setOceanActive] = useState(false); // ESRI Ocean Basemap (bathymetry)
  const [sstActive, setSstActive] = useState(false); // Copernicus SST
  const [chlActive, setChlActive] = useState(false); // Copernicus Chlorophyll
  const [selectedDate, setSelectedDate] = useState('today');
  const [oceanOpacity, setOceanOpacity] = useState(60);
  const [sstOpacity, setSstOpacity] = useState(90);
  const [chlOpacity, setChlOpacity] = useState(70);
  const [edgeMode, setEdgeMode] = useState(false); // Edge enhancement mode
  
  // Get boat name on mount
  useEffect(() => {
    const storedBoatName = localStorage.getItem('abfi_boat_name');
    if (storedBoatName) {
      setBoatName(storedBoatName);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',  // Dark base for contrast with layers
      center: [-72, 37],  // Shifted east to show more ocean
      zoom: 5.5,  // Slightly zoomed out to see more water
      pitch: 0,  // Ensure flat map (no 3D tilt)
      bearing: 0, // Ensure north is up (no rotation)
      cooperativeGestures: false  // Allow normal scroll zoom
    });

    const mapInstance = map.current;
    
    // Add zoom controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    mapInstance.on('load', () => {
      console.log('🌊 LEGENDARY OCEAN PLATFORM INITIALIZED 🚀');
      // Use ocean-focused bounds for better fishing view
      mapInstance.fitBounds(OCEAN_FOCUSED_BOUNDS as any, { 
        padding: { top: 20, bottom: 20, left: 100, right: 20 },  // More padding on left to push view east
        duration: 0 
      });
      mapInstance.setMaxBounds(EAST_COAST_BOUNDS as any);  // Still constrain to full East Coast
      
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

      // Chlorophyll - back to Copernicus proxy
      if (!mapInstance.getSource('chl-src')) {
        mapInstance.addSource('chl-src', {
          type: 'raster',
          tiles: ['/api/tiles/chl/{z}/{x}/{y}.png'],  // Back to Copernicus
          tileSize: 256, // Standard tile size
          minzoom: 0,
          maxzoom: 24
        });
      }

      if (!mapInstance.getLayer('chl-lyr')) {
        // Find the first label layer to place chlorophyll underneath
        const layers = mapInstance.getStyle().layers;
        let firstSymbolId;
        for (const layer of layers) {
          if (layer.type === 'symbol' || layer.id.includes('label') || layer.id.includes('place')) {
            firstSymbolId = layer.id;
            break;
          }
        }
        
        mapInstance.addLayer({
          id: 'chl-lyr',
          type: 'raster',
          source: 'chl-src',
          layout: { visibility: 'none' },
          paint: { 
            'raster-opacity': 0.8,  // Bumped up to see edges better
            'raster-contrast': 0.8,  // MORE contrast to see green edges!
            'raster-saturation': 0.8,  // MORE saturation for greens to pop!
            'raster-brightness-min': 0,  // Min must be 0 or higher
            'raster-brightness-max': 1  // Max must be 1 or lower
          },
          minzoom: 0,
          maxzoom: 24
        }, firstSymbolId);  // Place below labels and land
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
      // Clean up layers and sources before removing map
      try {
        // Remove custom layers if they exist
        const layersToRemove = ['ocean-layer', 'sst-lyr', 'chl-lyr'];
        layersToRemove.forEach(layerId => {
          if (mapInstance.getLayer(layerId)) {
            mapInstance.removeLayer(layerId);
          }
        });
        
        // Remove sources
        const sourcesToRemove = ['ocean', 'sst-src', 'chl-src'];
        sourcesToRemove.forEach(sourceId => {
          if (mapInstance.getSource(sourceId)) {
            mapInstance.removeSource(sourceId);
          }
        });
        
        // Finally remove the map - it handles its own event cleanup
        mapInstance.remove();
        map.current = null;
      } catch (error) {
        console.warn('Error during map cleanup:', error);
        // Still try to remove the map
        try {
          mapInstance.remove();
          map.current = null;
        } catch (e) {
          // Ignore
        }
      }
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
        className={`w-full h-full transition-all duration-500 ${
          activeTab === 'community' || activeTab === 'trends' 
            ? 'blur-sm opacity-40' 
            : ''
        }`} 
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
      
      {/* Unified Command Bar - Navigation + Boat Info */}
      <UnifiedCommandBar 
        map={map.current} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* ANALYSIS MODE UI */}
      {activeTab === 'analysis' && (
        <>
          {/* LEFT ZONE - Intelligence & Planning (Over Land) */}
          <LeftZone
            oceanActive={oceanActive}
            sstActive={sstActive}
            chlActive={chlActive}
            setOceanActive={setOceanActive}
            setSstActive={setSstActive}
            setChlActive={setChlActive}
            oceanOpacity={oceanOpacity}
            sstOpacity={sstOpacity}
            chlOpacity={chlOpacity}
            setOceanOpacity={setOceanOpacity}
            setSstOpacity={setSstOpacity}
            setChlOpacity={setChlOpacity}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            map={map.current}
          />
          
          {/* RIGHT ZONE - Action Controls (Over Ocean) */}
          <RightZone map={map.current} />
          
          {/* SST Layer component - ONLY on Analysis tab */}
          {map.current && <SSTLayer map={map.current} on={sstActive} selectedDate={selectedDate} />}
          
          {/* Coastline Smoother - ONLY on Analysis tab */}
          {map.current && <CoastlineSmoother map={map.current} enabled={sstActive} />}
          
          {/* Tutorial Overlay */}
          <TutorialOverlay />
        </>
      )}
      
      {/* COMMUNITY MODE UI - Overlays on blurred map */}
      {activeTab === 'community' && (
        <div className="absolute inset-0 z-20 top-16 md:top-20 pointer-events-auto">
          <CommunityMode />
        </div>
      )}
      
      {/* TRACKING MODE UI */}
      {activeTab === 'tracking' && (
        <TrackingMode map={map.current} />
      )}
      
      {/* TRENDS MODE UI - Dashboard (No map interaction) */}
      {activeTab === 'trends' && (
        <TrendsMode />
      )}

    </div>
  );
}