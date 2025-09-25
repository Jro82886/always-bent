'use client';

import { useEffect, useRef, useState } from 'react';
import PageWithSuspense from '@/components/PageWithSuspense';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/styles/mapbox-controls.css';
import '@/styles/analysis-snip.css';
import '@/styles/analysis-debug.css'; // TEMP debug CSS
import { setVis } from '@/map/layerVis';
import SSTLayer from '@/components/layers/SSTLayer';
import CHLLayer from '@/components/layers/CHLLayer';
import CoastlineSmoother from '@/components/layers/CoastlineSmoother';
import InletRegions from '@/components/InletRegions';
import NewUserTutorial from '@/components/NewUserTutorial';
import HeaderBar from '@/components/CommandBridge/HeaderBar';
import LeftZone from '@/components/LeftZone';
import RightZone from '@/components/RightZone';
// Weather now integrated into UnifiedCommandCenter
import OfflineManager from '@/components/OfflineManager';
import SettingsPanel from '@/components/SettingsPanel';
// CommercialVesselLegend now integrated into LeftZone
import { useAppState } from '@/lib/store';
import { OCEAN_FOCUSED_BOUNDS } from '@/lib/imagery/bounds';
import { getInletById, DEFAULT_INLET } from '@/lib/inlets';
import { useInletFromURL } from '@/hooks/useInletFromURL';
import '@/styles/mapSmoothing.css';
// CLEAN SNIP OVERLAY - Working version
import CleanSnipOverlay from '@/components/snip/CleanSnipOverlay';
// import AnalysisModal from '@/components/AnalysisModal'; // LEGACY REMOVED
import DynamicAnalysisModal from '@/components/DynamicAnalysisModal';
import SnipTool from '@/components/SnipTool';

// Mapbox token will be set in useEffect to avoid SSR issues

// East Coast bounding box for consistent zoom across app
const EAST_COAST_BOUNDS = [
  [-82.0, 24.0], // SW corner (Florida Keys / Gulf side buffer)
  [-65.0, 45.0], // NE corner (Maine + offshore buffer)
] as [[number, number], [number, number]];

function AnalysisModeContent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // Get selected inlet and date from global state
  const { selectedInletId, isoDate, activeRaster, setActiveRaster } = useAppState();
  
  // Sync inlet from URL on mount
  useInletFromURL();
  
  // Track if analysis modal is open to hide BITE button
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  
  // Get analysis state from store
  const { analysis, setAnalysis, resetAnalysisTransient } = useAppState();
  
  // NUCLEAR OVERLAY - Only show when drawing
  const [showSnipOverlay, setShowSnipOverlay] = useState(false); // OFF by default!
  
  // Commercial vessels toggle (OFF by default for energy saving)
  const [showCommercial, setShowCommercial] = useState(false);
  
  // Check if tutorial should be shown (client-side only)
  const [showingTutorial, setShowingTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  
  useEffect(() => {
    // Check tutorial status on client side
    const completed = localStorage.getItem('abfi_tutorial_completed');
    const neverShow = localStorage.getItem('abfi_tutorial_never_show');
    const shouldShow = localStorage.getItem('abfi_show_tutorial');
    
    // Show tutorial if explicitly requested from setup OR if not completed yet
    if (shouldShow === 'true') {
      setShowingTutorial(true);
      localStorage.removeItem('abfi_show_tutorial'); // Clear the flag
    } else {
      setShowingTutorial(!completed && neverShow !== 'true');
    }
    setTutorialCompleted(completed === 'true');
  }, []);
  
  // Watch for inlet changes and prevent auto camera moves after initial mount
  const didInitRef = useRef(false);
  useEffect(() => {
    if (!map.current || !selectedInletId) return;

    // Optional kill switch via env flag
    const allowAuto = String(process.env.NEXT_PUBLIC_INLET_AUTO_ZOOM || '').toLowerCase() === 'true';

    const inlet = getInletById(selectedInletId);

    // Only apply camera move on very first mount (initial positioning)
    if (!didInitRef.current) {
      didInitRef.current = true;
      if (!allowAuto) return; // respect disabled auto-zoom even on first run

      if (inlet && inlet.lat && inlet.lng) {
        map.current.flyTo({
          center: [inlet.lng, inlet.lat],
          zoom: inlet.zoom || 10,
          duration: 1200
        });
      } else if (selectedInletId === 'overview') {
        map.current.fitBounds(EAST_COAST_BOUNDS, {
          padding: 40,
          duration: 1200
        });
      }
      return;
    }

    // After first render: do nothing (selector should not change the view)
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

    // Set Mapbox token here to avoid SSR issues
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

    // Clean up any existing map instances first
    const existingCanvas = mapContainer.current.querySelector('.mapboxgl-canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',  // Dark base with grey anchoring
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
        // Use same bounds as Tracking for consistency
        mapInstance.fitBounds(EAST_COAST_BOUNDS, {
          padding: 40,  // Same padding as Tracking
          duration: 1500,
          essential: true
        });
      } else {
        // First time - show tutorial with Atlantic view, then zoom to East Coast
        // Start with wider view for tutorial
        mapInstance.setCenter([-40, 35]);
        mapInstance.setZoom(3.5);
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

      // Chlorophyll - use live WMTS if available
      if (!mapInstance.getSource('chl-src')) {
        const chlWmtsTemplate = process.env.NEXT_PUBLIC_CHL_WMTS_TEMPLATE;
        let chlUrl: string;
        
        if (chlWmtsTemplate) {
          // Use live Copernicus WMTS - default to yesterday's data
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const timeStr = yesterday.toISOString().split('T')[0];
          chlUrl = chlWmtsTemplate.replace('{TIME}', timeStr);
        } else {
          // Fall back to proxy endpoint
          chlUrl = '/api/tiles/chl/{z}/{x}/{y}.png';
        }
        
        mapInstance.addSource('chl-src', {
          type: 'raster',
          tiles: [chlUrl],
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
      (globalThis as any).mapboxMap = mapInstance; // DEV: expose for debugging
      console.log("[DEBUG] mapboxMap exposed on window");
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
        // Ensure proper layer ordering: ocean (bottom) -> SST -> CHL (top)
        const firstSymbolLayer = map.current.getStyle().layers.find(layer => layer.type === 'symbol');
        if (firstSymbolLayer) {
          map.current.moveLayer('ocean-layer', firstSymbolLayer.id);
        }
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

  // CHL toggle - handled by CHLLayer component now
  const toggleCHL = () => {
    setChlActive(!chlActive);
  };

  // This duplicate inlet handler can be removed - already handled above

  // Keyboard failsafe for snip tool
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        const btn = document.querySelector('[data-snip-button]') as HTMLButtonElement;
        btn?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`analysis-root w-full h-screen relative bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 ${sstActive ? 'sst-active' : ''}`} style={{
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

      {/* Map chrome overlay containers */}
      <div className="map-chrome">
        <div className="map-chrome__topRight">
          {/* Move gear/settings button to top-right overlay */}
          <SettingsPanel />
        </div>
        <div className="map-chrome__bottom">
          {/* bottom stacking CTAs reserved */}
        </div>
      </div>
      
      {/* Unified Command Bar - Navigation + Boat Info */}
      {/* Command Bridge Header */}
      <HeaderBar activeMode="analysis" />
      
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
            showCommercial={showCommercial}
            setShowCommercial={setShowCommercial}
          />
          
          {/* RIGHT ZONE - Action Controls (Over Ocean) */}
          <RightZone 
            map={map.current} 
            onModalStateChange={setIsAnalysisModalOpen}
          />
          
          {/* Inlet Regions - Subtle colored boundaries for each inlet */}
          {map.current && <InletRegions map={map.current} enabled={!oceanActive && !sstActive && !chlActive} opacity={0.16} />}
          
          {/* SST Layer component - ONLY on Analysis tab */}
          {map.current && <SSTLayer map={map.current} on={sstActive} selectedDate={selectedDate} />}
          
          {/* CHL Layer component - Chlorophyll concentration */}
          {map.current && <CHLLayer map={map.current} on={chlActive} selectedDate={selectedDate} />}
          
          {/* Coastline Smoother - ONLY on Analysis tab */}
          {map.current && <CoastlineSmoother map={map.current} enabled={sstActive} />}
          
          {/* Review CTA - Shows after snip completes */}
          {analysis?.showReviewCta && analysis?.pendingAnalysis && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-cyan-500/30 p-4">
              <div className="flex items-center gap-4">
                <span className="text-gray-300">
                  Area selected • Ready to analyze
                </span>
                <button
                  onClick={async () => {
                    console.log('[Analysis] Review clicked, fetching data and building narrative');
                    
                    if (!analysis?.pendingAnalysis) return;
                    
                    // Fetch SST/CHL data using the live API
                    const updatedAnalysis = { ...analysis.pendingAnalysis };
                    
                    // Determine which layers to fetch based on toggles
                    const layers: string[] = [];
                    if (updatedAnalysis.toggles.sst || sstActive) layers.push('sst');
                    if (updatedAnalysis.toggles.chl || chlActive) layers.push('chl');
                    
                    if (layers.length > 0) {
                      try {
                        // Call the live rasters/sample API
                        const response = await fetch('/api/rasters/sample', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            polygon: updatedAnalysis.polygon,
                            timeISO: isoDate || new Date().toISOString(),
                            layers
                          })
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          console.log('[Analysis] Live data fetched:', data);
                          
                          // Map the response to the expected format
                          if (data.stats?.sst) {
                            updatedAnalysis.sst = {
                              mean: data.stats.sst.mean_f,
                              min: data.stats.sst.min_f,
                              max: data.stats.sst.max_f,
                              gradient: data.stats.sst.gradient_f,
                              p10: data.stats.sst.p10_f,
                              p50: data.stats.sst.p50_f,
                              p90: data.stats.sst.p90_f,
                              stddev: data.stats.sst.stddev_f,
                              units: '°F' as const
                            };
                          }
                          
                          if (data.stats?.chl) {
                            updatedAnalysis.chl = {
                              mean: data.stats.chl.mean,
                              min: data.stats.chl.min,
                              max: data.stats.chl.max,
                              gradient: data.stats.chl.gradient,
                              p10: data.stats.chl.p10,
                              p50: data.stats.chl.p50,
                              p90: data.stats.chl.p90,
                              stddev: data.stats.chl.stddev,
                              units: 'mg/m³' as const
                            };
                          }
                        }
                      } catch (error) {
                        console.error('[Analysis] Failed to fetch live data:', error);
                      }
                    }
                    
                    // Build narrative with fetched data
                    const { buildNarrative } = require('@/lib/analysis/narrative-builder');
                    const narrative = buildNarrative(updatedAnalysis);
                    updatedAnalysis.narrative = narrative;
                    
                    console.log('[Analysis] Data processed, narrative built');
                    console.log('[Analysis] SST data:', updatedAnalysis.sst);
                    console.log('[Analysis] CHL data:', updatedAnalysis.chl);
                    
                    // Update state with complete analysis INCLUDING SST/CHL data
                    setAnalysis({
                      pendingAnalysis: updatedAnalysis
                    });
                    
                    // Small delay to ensure state is updated before opening modal
                    setTimeout(() => {
                      setIsAnalysisModalOpen(true);
                    }, 100);
                  }}
                  className="px-4 py-2 bg-emerald-500/90 hover:bg-emerald-500 text-slate-900 font-semibold rounded-lg 
                           shadow-[0_0_20px_#00e1a780] transition-all transform hover:scale-105"
                >
                  Review analysis
                </button>
                <button
                  onClick={() => {
                    // Reset the analysis state
                    resetAnalysisTransient();
                  }}
                  className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* LEGACY MODAL DISABLED - Using DynamicAnalysisModal only */}
          {false && isAnalysisModalOpen && analysis?.pendingAnalysis && (
            <AnalysisModal
              analysis={{
                ...analysis.pendingAnalysis,
                narrative: analysis.pendingAnalysis.narrative || 'Analyzing ocean conditions...'
              }}
              visible={true}
              onClose={() => {
                setIsAnalysisModalOpen(false);
                // Reset the analysis state
                resetAnalysisTransient();
              }}
            />
          )}
          
          {/* Dynamic Analysis Modal - ALWAYS SHOW REAL DATA */}
          {(() => {
            const vm = useAppState((s) => s.analysisVM);
            const isOpen = useAppState((s) => s.isDynamicModalOpen);
            
            // Only render if we have valid VM data
            if (!vm || !isOpen) return null;
            
            return (
              <DynamicAnalysisModal
                vm={vm}
                sstOn={activeRaster === 'sst'}
                chlOn={activeRaster === 'chl'}
                isOpen={isOpen}
                onClose={() => {
                  const { closeDynamicModal, resetAnalysisTransient } = useAppState.getState();
                  closeDynamicModal();
                  resetAnalysisTransient();
                }}
                onEnableLayers={() => {
                  setActiveRaster('sst'); // Enable SST
                  // Note: This UI only supports one layer at a time currently
                  // For full SST+CHL, would need UI updates
                }}
              />
            );
          })()}
          
          {/* Clean Snip Overlay - Only renders when active */}
          {map.current && (
            <CleanSnipOverlay
              map={map.current}
              isActive={showSnipOverlay}
              onComplete={(bbox) => {
                console.log('[Analysis] Snip complete, bbox:', bbox);
                setShowSnipOverlay(false);
                
                // Zoom to the drawn area
                setTimeout(() => {
                  map.current?.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { 
                    padding: 80, 
                    duration: 1000 
                  });
                }, 100);
                
                // TODO: Show Review CTA after zoom completes
                setTimeout(() => {
                  console.log('[Analysis] Ready for review');
                  // Open your analysis modal here
                }, 1200);
              }}
              onCancel={() => {
                console.log('[Analysis] Snip canceled');
                setShowSnipOverlay(false);
              }}
            />
          )}
          
          {/* New User Tutorial - Shows once after welcome */}
          {showingTutorial && !tutorialCompleted && map.current && (
            <NewUserTutorial onComplete={() => {
              setShowingTutorial(false);
              setTutorialCompleted(true);
              
              // Dramatic East Coast overview zoom after tutorial
              if (map.current) {
                // First, ensure inlet regions are visible
                const inletLayer = map.current.getLayer('inlet-regions-glow');
                if (inletLayer) {
                  map.current.setPaintProperty('inlet-regions-glow', 'circle-opacity', 0.09);
                  map.current.setPaintProperty('inlet-regions-core', 'circle-opacity', 0.15);
                }
                
                // Dramatic spin and zoom to East Coast
                map.current.flyTo({
                  center: [-75, 35], // Center of East Coast
                  zoom: 4.8, // Wider view to show Maine to Florida Keys
                  bearing: -15, // Slight angle for drama
                  pitch: 25, // Tilt for 3D effect
                  duration: 3000, // 3 second animation
                  essential: true,
                  easing: (t: number) => {
                    // Custom easing for dramatic effect
                    return t < 0.5 
                      ? 4 * t * t * t 
                      : 1 - Math.pow(-2 * t + 2, 3) / 2;
                  }
                });
                
                // After initial zoom, settle into perfect view
                setTimeout(() => {
                  map.current?.flyTo({
                    center: [-76, 36], // Perfect center for full East Coast view
                    zoom: 5.2, // Show entire coast from Maine to Florida Keys
                    bearing: 0,
                    pitch: 0,
                    duration: 2000,
                    essential: true
                  });
                }, 3000);
              }
            }} />
          )}
          
          {/* Settings Panel moved to top-right via map chrome */}
          
          {/* Weather Conditions - Only show after tutorial is complete */}
          {/* Weather now integrated into UnifiedCommandCenter */}

          {/* Commercial Vessels Toggle - Moved to LeftZone */}

          {/* Commercial Vessel Legend - Now integrated into LeftZone */}

          {/* Offline Manager - Handles offline capabilities */}
          <OfflineManager />
          
          {/* SnipTool - Handles polygon drawing for analysis */}
          {map.current && (
            <SnipTool 
              map={map.current}
              onAnalysisComplete={(analysis) => {
                // Analysis complete handler - modal will open from SnipTool
                console.log('[Analysis] Complete:', analysis);
              }}
            />
          )}
          
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
