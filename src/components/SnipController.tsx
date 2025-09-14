"use client";
import { useState, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';
import SnipTool from './SnipTool';
import HotspotMarker from './HotspotMarker';
import AnalysisModal from './AnalysisModal';
import { analyzeMultiLayer, generateMockSSTData, generateMockCHLData, type AnalysisResult } from '@/lib/analysis/sst-analyzer';
import { saveSnipAnalysis } from '@/lib/supabase/ml-queries';
import * as turf from '@turf/turf';

interface SnipControllerProps {
  map: mapboxgl.Map | null;
}

export default function SnipController({ map }: SnipControllerProps) {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hotspotPosition, setHotspotPosition] = useState<[number, number] | null>(null);
  const [showHotspot, setShowHotspot] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [shouldClearTool, setShouldClearTool] = useState(false);

  const handleAnalyze = useCallback(async (polygon: GeoJSON.Feature) => {
    console.log('🎯 handleAnalyze called with polygon:', polygon);
    console.log('📋 Polygon type:', polygon.geometry.type);
    if (polygon.geometry.type === 'Polygon') {
      const polyGeom = polygon.geometry as GeoJSON.Polygon;
      console.log('📏 Polygon coordinates count:', polyGeom.coordinates[0]?.length);
    }
    
    if (!map) {
      console.error('❌ No map available for analysis');
      return;
    }
    
    console.log('✅ Map is available, proceeding with analysis');
    setIsAnalyzing(true);
    
    // Detect which layers are currently active
    const activeLayers = {
      sst: map.getLayer('sst-lyr') && map.getLayoutProperty('sst-lyr', 'visibility') === 'visible',
      chl: map.getLayer('chl-lyr') && map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
      ocean: map.getLayer('ocean-layer') && map.getLayoutProperty('ocean-layer', 'visibility') === 'visible'
    };
    console.log('🔍 Active layers:', activeLayers);
    console.log('🔍 Starting multi-layer analysis for polygon:', polygon);

    try {
      // Get polygon bounds
      const bbox = turf.bbox(polygon);
      const bounds = [[bbox[0], bbox[1]], [bbox[2], bbox[3]]];
      console.log('📍 Polygon bounds:', bounds);
      
      // Query boat activity in the polygon area
      let boatActivity = null;
      try {
        const polygonCoords = (polygon.geometry as GeoJSON.Polygon).coordinates[0];
        const response = await fetch(`/api/tracking/activity?polygon=${encodeURIComponent(JSON.stringify(polygonCoords))}&hours=48`);
        if (response.ok) {
          const data = await response.json();
          boatActivity = data.analysis;
          console.log('🚤 Boat activity:', boatActivity);
        }
      } catch (error) {
        console.error('Failed to fetch boat activity:', error);
      }
      
      // TODO: Replace with real data extraction from map tiles
      // For MVP, using mock data that simulates patterns
      const sstData = activeLayers.sst ? generateMockSSTData(bounds) : null;
      const chlData = activeLayers.chl ? generateMockCHLData(bounds) : null;
      
      console.log('📊 Generated mock data:', { 
        sst: sstData ? `${sstData.length} points` : 'inactive',
        chl: chlData ? `${chlData.length} points` : 'inactive'
      });
      
      // Run multi-layer analysis algorithm
      const analysis = await analyzeMultiLayer(
        polygon as GeoJSON.Feature<GeoJSON.Polygon>, 
        sstData,
        chlData
      );
      
      // Add boat activity to the analysis result
      if (boatActivity) {
        analysis.boatActivity = boatActivity;
        
        // Boost hotspot confidence if there's significant boat activity
        if (analysis.hotspot && boatActivity.unique_boats >= 3) {
          const boostFactor = Math.min(1.3, 1 + (boatActivity.hotspot_weight * 0.3));
          analysis.hotspot.confidence = Math.min(0.95, analysis.hotspot.confidence * boostFactor);
        }
      }
      
      console.log('✅ Analysis complete:', analysis);
      setCurrentAnalysis(analysis);
      
      // Show the pulsing cyan hotspot
      if (analysis.hotspot) {
        setHotspotPosition(analysis.hotspot.location);
        setShowHotspot(true);
        console.log('💙 Hotspot location:', analysis.hotspot.location);
        
        // Show toast notification instead of modal immediately
        showHotspotToast(() => {
          console.log('🎭 User clicked toast - showing analysis modal');
          setShowModal(true);
        });
        
        // Don't auto-show modal - let user click hotspot or toast
      } else {
        console.warn('⚠️ No hotspot found in analysis');
        // For non-hotspot, show educational modal immediately
        setTimeout(() => {
          setShowModal(true);
        }, 500);
      }
      
      // TODO: Add feature overlays for edges/eddies later
      // if (analysis.features.length > 0) {
      //   addFeatureOverlays(map, analysis.features);
      // }
      
    } catch (error) {
      console.error('❌ Analysis failed with error:', error);
      console.error('Error stack:', (error as Error).stack);
      alert(`Analysis failed: ${(error as Error).message}`);
      
      // Clear the rectangle on error
      setShouldClearTool(true);
      setTimeout(() => setShouldClearTool(false), 100);
    } finally {
      console.log('🏁 Analysis finished, setting isAnalyzing to false');
      setIsAnalyzing(false);
      
      // Clear the rectangle after successful analysis too
      setShouldClearTool(true);
      setTimeout(() => setShouldClearTool(false), 100);
    }
  }, [map]);

  const handleSaveAnalysis = useCallback(async () => {
    if (!currentAnalysis) return;
    
    try {
      console.log('💾 Saving analysis...');
      
      // Prepare data for saving
      const isTestMode = process.env.NODE_ENV === 'development' || 
                        window.location.hostname === 'localhost' ||
                        localStorage.getItem('abfi_test_mode') === 'true';
      
      const analysisData = {
        geometry: currentAnalysis.polygon.geometry as GeoJSON.Polygon,
        conditions: {
          sst_min: currentAnalysis.stats.min_temp_f,
          sst_max: currentAnalysis.stats.max_temp_f,
          sst_gradient_max: currentAnalysis.hotspot?.gradient_strength || 0,
          time_of_day: getTimeOfDay()
        },
        detected_features: currentAnalysis.features.map(f => ({
          type: f.type,
          strength: f.properties.grad_f_per_km_mean,
          confidence: f.properties.score
        })),
        report_text: generateReportText(currentAnalysis),
        primary_hotspot: currentAnalysis.hotspot ? {
          type: 'Point' as const,
          coordinates: currentAnalysis.hotspot.location
        } as GeoJSON.Point : undefined,
        hotspot_confidence: currentAnalysis.hotspot?.confidence || 0,
        success_prediction: currentAnalysis.hotspot ? currentAnalysis.hotspot.confidence * 0.85 : 0.5,
        layers_active: ['sst'],
        timestamp: new Date().toISOString(),
        user_id: localStorage.getItem('abfi_username') || 'anonymous',
        is_test_data: isTestMode, // Flag to identify test data
        data_source: isTestMode ? 'test' : 'production'
      };
      
      // Try to save to Supabase if configured
      let saved = false;
      try {
        const result = await saveSnipAnalysis(analysisData as any);
        console.log('✅ Analysis saved to database:', result);
        saved = true;
      } catch (dbError) {
        console.warn('⚠️ Database save failed, saving locally:', dbError);
        // Fallback to localStorage if Supabase is not configured
        const localAnalyses = JSON.parse(localStorage.getItem('abfi_analyses') || '[]');
        localAnalyses.push({
          ...analysisData,
          id: crypto.randomUUID(),
          saved_at: new Date().toISOString()
        });
        localStorage.setItem('abfi_analyses', JSON.stringify(localAnalyses));
        console.log('💾 Analysis saved to local storage');
        saved = true;
      }
      
      if (saved) {
        // Show success feedback
        showSaveSuccessToast();
        
        // Auto-close modal after save to continue snipping
        setTimeout(() => {
          setShowModal(false);
          setCurrentAnalysis(null);
          setShowHotspot(false);
          setHotspotPosition(null);
          setShouldClearTool(true);
          setTimeout(() => setShouldClearTool(false), 100);
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Failed to save analysis:', error);
      alert('Failed to save analysis. Please try again.');
    }
  }, [currentAnalysis]);

  const handleCloseModal = useCallback(() => {
    console.log('🔄 Resetting for new snip');
    
    // 1. Close modal
    setShowModal(false);
    
    // 2. Clear analysis data
    setCurrentAnalysis(null);
    setShowHotspot(false);
    setHotspotPosition(null);
    
    // 3. Clear map overlays if any
    if (map) {
      clearMapOverlays(map);
    }
    
    // 4. Reset the snip tool (single call, no duplicates)
    setShouldClearTool(true);
    setTimeout(() => {
      setShouldClearTool(false);
      console.log('✅ Ready for new snip!');
      
      // Show subtle feedback that tool is ready
      showReadyToSnipToast();
    }, 100);
  }, [map]);

  // Test function to simulate analysis
  const testAnalysis = () => {
    console.log('🧪 TEST: Triggering mock analysis');
    const mockPolygon: GeoJSON.Feature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-74.5, 38.5],
          [-74.0, 38.5],
          [-74.0, 39.0],
          [-74.5, 39.0],
          [-74.5, 38.5]
        ]]
      },
      properties: {}
    };
    handleAnalyze(mockPolygon);
  };

  return (
    <>
      <SnipTool 
        map={map} 
        onAnalyze={handleAnalyze}
        shouldClear={shouldClearTool}
      />
      
      {/* Test buttons - remove after debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
          <button
            onClick={testAnalysis}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700"
          >
            🧪 Test Analysis
          </button>
          <button
            onClick={() => {
              console.log('🔍 Checking SnipTool state...');
              console.log('Map exists:', !!map);
              if (map) {
                console.log('Rectangle source exists:', !!map.getSource('rectangle'));
                console.log('Rectangle layers exist:', !!map.getLayer('rectangle-fill'));
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700"
          >
            🔍 Check State
          </button>
        </div>
      )}
      
      <HotspotMarker
        map={map}
        position={hotspotPosition}
        visible={showHotspot}
        onClick={() => {
          console.log('🎯 Hotspot marker clicked - showing analysis');
          setShowModal(true);
        }}
      />
      
      {isAnalyzing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 rounded-lg p-6 shadow-2xl">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Analyzing Ocean Data...</p>
            <p className="text-sm text-cyan-300 mt-2">Finding the heartbeat of the ocean</p>
          </div>
        </div>
      )}
      
      <AnalysisModal
        analysis={currentAnalysis}
        visible={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveAnalysis}
      />
    </>
  );
}

// Helper function to show ready to snip toast
function showReadyToSnipToast() {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40';
  toast.innerHTML = `
    <div class="bg-gray-800/90 text-cyan-300 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm">
      <span>✂️</span>
      <span>Ready to snip again!</span>
    </div>
  `;
  
  // Add fade-in animation
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s';
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);
  
  // Auto-remove after 2 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Helper function to show save success toast
function showSaveSuccessToast() {
  const toast = document.createElement('div');
  toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50';
  toast.innerHTML = `
    <div class="bg-gradient-to-r from-green-500 to-cyan-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
      <span class="text-2xl">💾</span>
      <span class="font-bold">Analysis Saved to Community!</span>
      <span class="text-sm opacity-90">Helping others find fish 🎣</span>
    </div>
  `;
  
  // Add slide-down animation
  toast.style.transform = 'translate(-50%, -100%)';
  toast.style.transition = 'transform 0.5s';
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translate(-50%, 0)';
  }, 10);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// Helper function to show hotspot toast notification
function showHotspotToast(onClickCallback: () => void) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down';
  toast.innerHTML = `
    <div class="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform">
      <span class="text-2xl animate-pulse">🎯</span>
      <span class="font-bold">Hotspot Detected!</span>
      <span class="text-sm opacity-90">Click to see analysis</span>
    </div>
  `;
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slide-down {
      from { transform: translate(-50%, -100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    .animate-slide-down {
      animation: slide-down 0.5s ease-out;
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(toast);
  
  // Make toast clickable
  toast.addEventListener('click', () => {
    onClickCallback();
    toast.remove();
  });
  
  // Auto-remove after 8 seconds if not clicked
  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s';
      setTimeout(() => toast.remove(), 500);
    }
  }, 8000);
}

// Helper functions
function getTimeOfDay(): 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night' {
  const hour = new Date().getHours();
  if (hour < 6) return 'night';
  if (hour < 9) return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 15) return 'midday';
  if (hour < 18) return 'afternoon';
  if (hour < 21) return 'dusk';
  return 'night';
}

function generateReportText(analysis: AnalysisResult): string {
  const lines = [`Area Analysis Report - ${new Date().toLocaleString()}`];
  
  if (analysis.hotspot) {
    lines.push(`Primary Hotspot: ${analysis.hotspot.location[1].toFixed(4)}°N, ${Math.abs(analysis.hotspot.location[0]).toFixed(4)}°W`);
    lines.push(`Gradient: ${analysis.hotspot.gradient_strength.toFixed(2)}°F/km`);
    lines.push(`Confidence: ${(analysis.hotspot.confidence * 100).toFixed(0)}%`);
  }
  
  lines.push(`Temperature Range: ${analysis.stats.min_temp_f.toFixed(1)}-${analysis.stats.max_temp_f.toFixed(1)}°F`);
  lines.push(`Area: ${analysis.stats.area_km2.toFixed(1)} km²`);
  
  if (analysis.features.length > 0) {
    lines.push(`Detected Features: ${analysis.features.map(f => f.type).join(', ')}`);
  }
  
  return lines.join('\n');
}

function addHotspotMarker(map: mapboxgl.Map, location: [number, number]) {
  // Remove existing hotspot layer if it exists
  if (map.getLayer('hotspot-marker')) {
    map.removeLayer('hotspot-marker');
  }
  if (map.getSource('hotspot-marker')) {
    map.removeSource('hotspot-marker');
  }
  
  // Add new hotspot marker
  map.addSource('hotspot-marker', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: location
      },
      properties: {}
    }
  });
  
  map.addLayer({
    id: 'hotspot-marker',
    type: 'circle',
    source: 'hotspot-marker',
    paint: {
      'circle-radius': 12,
      'circle-color': '#475569',  // Muted slate-grey
      'circle-stroke-width': 3,
      'circle-stroke-color': '#3b82f6',  // Muted blue for stroke
      'circle-opacity': 0.9
    }
  });
  
  // Add pulsing animation
  let radius = 12;
  let increasing = true;
  
  const animateMarker = () => {
    if (!map.getLayer('hotspot-marker')) return;
    
    radius += increasing ? 0.3 : -0.3;
    if (radius > 18) increasing = false;
    if (radius < 12) increasing = true;
    
    map.setPaintProperty('hotspot-marker', 'circle-radius', radius);
    requestAnimationFrame(animateMarker);
  };
  
  animateMarker();
}

function addFeatureOverlays(map: mapboxgl.Map, features: any[]) {
  // Remove existing feature layers
  if (map.getLayer('detected-features')) {
    map.removeLayer('detected-features');
  }
  if (map.getLayer('detected-features-outline')) {
    map.removeLayer('detected-features-outline');
  }
  if (map.getSource('detected-features')) {
    map.removeSource('detected-features');
  }
  
  // Create GeoJSON from features
  const geojson = {
    type: 'FeatureCollection' as const,
    features: features.map(f => ({
      type: 'Feature' as const,
      geometry: f.geometry,
      properties: {
        type: f.type,
        score: f.properties.score
      }
    }))
  };
  
  // Add source
  map.addSource('detected-features', {
    type: 'geojson',
    data: geojson
  });
  
  // Add fill layer
  map.addLayer({
    id: 'detected-features',
    type: 'fill',
    source: 'detected-features',
    paint: {
      'fill-color': [
        'case',
        ['==', ['get', 'type'], 'hard_edge'], '#ff4444',
        ['==', ['get', 'type'], 'edge'], '#ffaa00',
        ['==', ['get', 'type'], 'eddy'], '#00aaff',
        ['==', ['get', 'type'], 'filament'], '#aa00ff',
        '#888888'
      ],
      'fill-opacity': 0.3
    }
  });
  
  // Add outline layer
  map.addLayer({
    id: 'detected-features-outline',
    type: 'line',
    source: 'detected-features',
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'type'], 'hard_edge'], '#ff0000',
        ['==', ['get', 'type'], 'edge'], '#ff8800',
        ['==', ['get', 'type'], 'eddy'], '#0088ff',
        ['==', ['get', 'type'], 'filament'], '#8800ff',
        '#666666'
      ],
      'line-width': 2,
      'line-dasharray': [2, 1]
    }
  });
}

function clearMapOverlays(map: mapboxgl.Map) {
  // Clear the rectangle from snip tool
  if (map.getSource('rectangle')) {
    const source = map.getSource('rectangle') as mapboxgl.GeoJSONSource;
    source.setData({
      type: 'FeatureCollection',
      features: []
    });
  }
  
  // Remove hotspot marker
  if (map.getLayer('hotspot-marker')) {
    map.removeLayer('hotspot-marker');
  }
  if (map.getSource('hotspot-marker')) {
    map.removeSource('hotspot-marker');
  }
  
  // Remove feature overlays
  if (map.getLayer('detected-features')) {
    map.removeLayer('detected-features');
  }
  if (map.getLayer('detected-features-outline')) {
    map.removeLayer('detected-features-outline');
  }
  if (map.getSource('detected-features')) {
    map.removeSource('detected-features');
  }
}