'use client';

import { useEffect, useRef, useState } from 'react';
import PageWithSuspense from '@/components/PageWithSuspense';
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
import ReportCatchButton from '@/components/ReportCatchButton';
import InteractiveTutorial from '@/components/InteractiveTutorial';
import NetworkStatusIndicator from '@/components/NetworkStatusIndicator';
import UnifiedOceanConditions from '@/components/UnifiedOceanConditions';
import OfflineManager from '@/components/OfflineManager';
import CommercialVesselLayer from '@/components/tracking/CommercialVesselLayer';
import { useAppState } from '@/store/appState';
import { EAST_COAST_BOUNDS, OCEAN_FOCUSED_BOUNDS } from '@/lib/imagery/bounds';
import { getInletById, DEFAULT_INLET } from '@/lib/inlets';
import { flyToInlet60nm } from '@/lib/inletBounds';
import '@/styles/mapSmoothing.css';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

function AnalysisModeContent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const tutorialTriggerRef = useRef<(() => void) | null>(null);
  
  // Get selected inlet from global state
  const { selectedInletId } = useAppState();
  
  
  // Track if analysis modal is open to hide BITE button
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  
  // Commercial vessels toggle (OFF by default for energy saving)
  const [showCommercial, setShowCommercial] = useState(false);
  
  // Check if tutorial should be shown (client-side only)
  const [showingTutorial, setShowingTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  
  useEffect(() => {
    // Check tutorial status on client side
    const seen = localStorage.getItem('abfi_tutorial_seen');
    const skip = localStorage.getItem('abfi_skip_tutorial');
    const shouldShow = localStorage.getItem('abfi_show_tutorial');
    
    // Show tutorial if explicitly requested from setup OR if not seen yet
    if (shouldShow === 'true') {
      setShowingTutorial(true);
      localStorage.removeItem('abfi_show_tutorial'); // Clear the flag
    } else {
      setShowingTutorial(!seen && skip !== 'true');
    }
    setTutorialCompleted(seen === 'true');
  }, []);
  
  // Watch for inlet changes and fly to selected inlet with Gulf Stream view
  useEffect(() => {
    if (!map.current || !selectedInletId) return;
    
    const inlet = getInletById(selectedInletId);
    if (inlet) {
      // Use proper Gulf Stream view for each inlet
      flyToInlet60nm(map.current, inlet);
      
    }
  }, [selectedInletId]);
  
  // Get boat name from localStorage
  const [boatName, setBoatName] = useState<string>('');
  
  // Ocean Basemap + Copernicus layers
  const [oceanActive, setOceanActive] = useState(false); // ESRI Ocean Basemap (bathymetry)
  const [sstActive, setSstActive] = useState(false); // OFF by default - saves electricity!
  const [chlActive, setChlActive] = useState(false); // Keep Chlorophyll off initially (performance)
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

  // Initialize map with cleanup
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Clean up any existing map instances first
    const existingCanvas = mapContainer.current.querySelector('.mapboxgl-canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

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
      
      
      // Check if tutorial has been seen
      const tutorialSeen = localStorage.getItem('abfi_tutorial_seen');
      
      if (tutorialSeen === 'true') {
        // Tutorial already seen - go straight to East Coast view
        
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
        if (mapInstance.getStyle()) {
          const layers = mapInstance.getStyle().layers;
          // Layer debug info removed
        }
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
        let firstSymbolId;
        if (mapInstance.getStyle()) {
          const layers = mapInstance.getStyle().layers;
          for (const layer of layers) {
            if (layer.type === 'symbol' || layer.id.includes('label') || layer.id.includes('place')) {
              firstSymbolId = layer.id;
              break;
            }
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

      // Atlantic East Coast coverage
      
      

      // Debug: Check if Copernicus is configured
      // Copernicus credentials are backend-only, frontend doesn't need them
      
      (window as any).map = mapInstance;
    });

    // 🔒 Additional error handling (backup)

    mapInstance.on('sourcedataloading', (e: any) => {
      
    });

    mapInstance.on('sourcedata', (e: any) => {
      if (e.isSourceLoaded) {
        
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
    
  };

  // CHL toggle - Copernicus chlorophyll
  const toggleCHL = () => {
    if (!map.current) return;
    const newState = !chlActive;
    setChlActive(newState);
    setVis(map.current, 'chl-lyr', newState);
    
  };

  // This duplicate inlet handler can be removed - already handled above

  return (
    <div className={`w-full h-screen relative bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 ${sstActive ? 'sst-active' : ''}`} style={{
      backgroundImage: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(3, 7, 18, 1), rgba(15, 23, 42, 0.95))',
      backgroundBlendMode: 'multiply'
    }}>
      {/* Map Container with enhanced rendering - Hidden during tracking for clean separation */}
      <div 
        ref={mapContainer} 
        className={`w-full h-full transition-all duration-700 ${
          showingTutorial
            ? 'blur-md opacity-60' // Start blurred if tutorial will show
            : '' // Keep map visible for analysis
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
        activeTab="analysis"
        onTabChange={() => {}}
      />
      
      {/* ANALYSIS MODE UI */}
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
          <RightZone 
            map={map.current} 
            onModalStateChange={setIsAnalysisModalOpen}
            onStartTutorial={() => tutorialTriggerRef.current?.()}
          />
          
          {/* Inlet Regions - Subtle colored boundaries for each inlet */}
          {map.current && <InletRegions map={map.current} enabled={!oceanActive && !sstActive && !chlActive} opacity={0.16} />}
          
          {/* SST Layer component - ONLY on Analysis tab */}
          {map.current && <SSTLayer map={map.current} on={sstActive} selectedDate={selectedDate} />}
          
          {/* Coastline Smoother - ONLY on Analysis tab */}
          {map.current && <CoastlineSmoother map={map.current} enabled={sstActive} />}
          
          {/* Tutorial Overlay - First tutorial for new users */}
          {!tutorialCompleted && (
            <TutorialOverlay onComplete={() => {
              setShowingTutorial(false);
              setTutorialCompleted(true);
            }} />
          )}
          
          
          {/* Interactive Tutorial - Second tutorial, only after first is complete */}
          {tutorialCompleted && (
            <InteractiveTutorial triggerRef={tutorialTriggerRef} />
          )}
          
          {/* ABFI Button - Hidden during tutorial, only on Analysis tab */}
          {!showingTutorial && (
            <ReportCatchButton map={map.current} disabled={isAnalysisModalOpen} />
          )}
          
          {/* Network Status Indicator - Shows online/offline status */}
          <NetworkStatusIndicator />
          
          {/* Unified Ocean Conditions - Top Right Corner */}
          <UnifiedOceanConditions
            sstActive={sstActive}
            chlActive={chlActive}
            oceanActive={oceanActive}
            onToggleSST={() => setSstActive(!sstActive)}
            onToggleCHL={() => setChlActive(!chlActive)}
            onToggleOcean={() => setOceanActive(!oceanActive)}
          />

          {/* Commercial Vessels Toggle - Bottom Right */}
          <div className="absolute bottom-24 right-4 z-50">
            <button
              onClick={() => setShowCommercial(!showCommercial)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${showCommercial 
                  ? 'bg-orange-500/90 text-white shadow-lg' 
                  : 'bg-black/60 text-white/70 hover:bg-black/80'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showCommercial ? 'Hide' : 'Show'} Commercial Vessels
              </div>
              {showCommercial && (
                <div className="text-[10px] mt-1 text-white/70">
                  Powered by GFW Data
                </div>
              )}
            </button>
          </div>

          {/* Commercial Vessel Layer */}
          <CommercialVesselLayer 
            map={map.current} 
            showCommercial={showCommercial} 
          />

          {/* Offline Manager - Handles offline capabilities */}
          <OfflineManager />
          
      </>
      
      
      {/* Test Data Admin - Only in development */}

    </div>
  );
}

export default function LegendaryOceanPlatform() {
  return (
    <PageWithSuspense>
      <AnalysisModeContent />
    </PageWithSuspense>
  );
}