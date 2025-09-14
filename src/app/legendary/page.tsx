'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { setVis } from '@/map/layerVis';
import SSTLayer from '@/components/layers/SSTLayer';
import CoastlineSmoother from '@/components/layers/CoastlineSmoother';
import InletRegions from '@/components/InletRegions';
import TutorialOverlay from '@/components/TutorialOverlay';
import UnifiedCommandBar from '@/components/UnifiedCommandBar';
import LeftZone from '@/components/LeftZone';
import RightZone from '@/components/RightZone';
import CommunityMode from '@/components/community/CommunityMode';
import TrackingMode from '@/components/tracking/TrackingMode';
import TrendsMode from '@/components/trends/TrendsMode';
import { useAppState } from '@/store/appState';
import { EAST_COAST_BOUNDS, OCEAN_FOCUSED_BOUNDS } from '@/lib/imagery/bounds';
import { getInletById, DEFAULT_INLET } from '@/lib/inlets';
import '@/styles/mapSmoothing.css';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function LegendaryOceanPlatform() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // Get selected inlet from global state
  const { selectedInletId } = useAppState();
  
  // Tab state - 'analysis' | 'tracking' | 'community' | 'trends'
  const [activeTab, setActiveTab] = useState<string>('analysis');
  
  // Watch for inlet changes and fly to selected inlet
  useEffect(() => {
    if (!map.current || !selectedInletId) return;
    
    const inlet = getInletById(selectedInletId);
    if (inlet) {
      // Use the same zoom logic as UnifiedCommandBar
      if (inlet.isOverview) {
        const eastCoastBounds: [[number, number], [number, number]] = [
          [-82.0, 24.0],  // Southwest: Florida Keys
          [-65.0, 46.0],  // Northeast: Maine
        ];
        
        map.current.fitBounds(eastCoastBounds, {
          padding: { top: 50, bottom: 50, left: 100, right: 50 },
          duration: 1500,
          essential: true
        });
      } else {
        map.current.flyTo({
          center: inlet.center as [number, number],
          zoom: inlet.zoom,
          duration: 1500,
          essential: true
        });
      }
      
      console.log(`📍 Flying to inlet: ${inlet.name}`);
    }
  }, [selectedInletId]);
  
  // Get boat name from localStorage
  const [boatName, setBoatName] = useState<string>('');
  
  // Ocean Basemap + Copernicus layers
  const [oceanActive, setOceanActive] = useState(false); // ESRI Ocean Basemap (bathymetry)
  const [sstActive, setSstActive] = useState(true); // START WITH SST ON for cinematic view!
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
      style: 'mapbox://styles/mapbox/dark-v11',  // Dark base with grey anchoring
      center: [-40, 35],  // Start with Atlantic Ocean view (like your image)
      zoom: 3.5,  // Zoomed out to see whole North Atlantic with Gulf Stream
      pitch: 0,  // Ensure flat map (no 3D tilt)
      bearing: 0, // Ensure north is up (no rotation)
      cooperativeGestures: false  // Allow normal scroll zoom
    });

    const mapInstance = map.current;
    
    // Add zoom controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    mapInstance.on('load', () => {
      console.log('🌊 LEGENDARY OCEAN PLATFORM INITIALIZED 🚀');
      
      // Check if tutorial has been seen
      const tutorialSeen = localStorage.getItem('abfi_tutorial_seen');
      
      if (tutorialSeen === 'true') {
        // Tutorial already seen - go straight to East Coast view
        console.log('🎣 Tutorial already completed - zooming to East Coast');
        const EAST_COAST_BOUNDS = [[-82, 24], [-66, 45.5]];
        mapInstance.fitBounds(EAST_COAST_BOUNDS as any, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1500,
          essential: true
        });
        
        setTimeout(() => {
          mapInstance.setMaxBounds([[-85, 23], [-64, 47]] as any);
        }, 1600);
      } else {
        // First time - start with Atlantic view for tutorial
        console.log('🌌 First visit - showing Atlantic Ocean view');
        // Tutorial will handle the zoom to East Coast
      }
      
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
          'raster-opacity': 0.6,  // Moderate opacity for bathymetry
          'raster-brightness-min': 0.2,  // Darker for muted look
          'raster-brightness-max': 0.8,  // Less bright
          'raster-saturation': -0.3  // Desaturate for muted colors
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
            'raster-opacity': 0.7,  // Slightly muted
            'raster-contrast': 0.6,  // Softer contrast for muted look
            'raster-saturation': -0.2,  // Desaturate for muted greens/teals
            'raster-brightness-min': 0.1,  // Darker minimum
            'raster-brightness-max': 0.85  // Less bright maximum
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

  // Respond to inlet selection changes
  useEffect(() => {
    if (!map.current) return;
    const inlet = getInletById(selectedInletId) || DEFAULT_INLET;
    
    // Fly to the selected inlet
    map.current.flyTo({
      center: inlet.center as [number, number],
      zoom: inlet.zoom,
      duration: 1500,
      essential: true
    });
    
    console.log(`📍 Flying to inlet: ${inlet.name}`);
  }, [selectedInletId]);

  return (
    <div className={`w-full h-screen relative bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 ${sstActive ? 'sst-active' : ''}`} style={{
      backgroundImage: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(3, 7, 18, 1), rgba(15, 23, 42, 0.95))',
      backgroundBlendMode: 'multiply'
    }}>
      {/* Map Container with enhanced rendering - Hidden during tracking for clean separation */}
      <div 
        ref={mapContainer} 
        className={`w-full h-full transition-all duration-700 ${
          activeTab === 'community' 
            ? 'scale-105 blur-md opacity-30' 
            : activeTab === 'trends'
            ? 'blur-lg opacity-20'
            : activeTab === 'tracking'
            ? 'hidden' // Completely hide analysis map when tracking
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
          
          {/* Inlet Regions - Subtle colored boundaries for each inlet */}
          {map.current && <InletRegions map={map.current} enabled={!oceanActive && !sstActive && !chlActive} opacity={0.16} />}
          
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
      
      {/* TRACKING MODE UI - Uses its own fresh map, no analysis carryover! */}
      {activeTab === 'tracking' && (
        <TrackingMode />
      )}
      
      {/* TRENDS MODE UI - Dashboard (No map interaction) */}
      {activeTab === 'trends' && (
        <TrendsMode />
      )}
      
      {/* Test Data Admin - Only in development */}

    </div>
  );
}