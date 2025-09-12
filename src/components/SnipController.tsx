"use client";
import { useState, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';
import SnipTool from './SnipTool';
import HotspotMarker from './HotspotMarker';
import AnalysisModal from './AnalysisModal';
import { analyzeSSTPolygon, generateMockSSTData, type AnalysisResult } from '@/lib/analysis/sst-analyzer';
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
    console.log('📏 Polygon coordinates count:', polygon.geometry.coordinates[0]?.length);
    
    if (!map) {
      console.error('❌ No map available for analysis');
      return;
    }
    
    console.log('✅ Map is available, proceeding with analysis');
    setIsAnalyzing(true);
    console.log('🔍 Starting SST analysis for polygon:', polygon);

    try {
      // Get polygon bounds
      const bbox = turf.bbox(polygon);
      const bounds = [[bbox[0], bbox[1]], [bbox[2], bbox[3]]];
      console.log('📍 Polygon bounds:', bounds);
      
      // TODO: Replace with real SST data extraction from map tiles
      // For MVP, using mock data that simulates SST patterns
      const sstData = generateMockSSTData(bounds);
      console.log('📊 Generated mock SST data:', sstData);
      
      // Run Jeff's analysis algorithm
      const analysis = await analyzeSSTPolygon(polygon as GeoJSON.Feature<GeoJSON.Polygon>, sstData);
      
      console.log('✅ Analysis complete:', analysis);
      setCurrentAnalysis(analysis);
      
      // Show the pulsing cyan hotspot
      if (analysis.hotspot) {
        setHotspotPosition(analysis.hotspot.location);
        setShowHotspot(true);
        console.log('💙 Hotspot location:', analysis.hotspot.location);
        
        // Auto-show modal after hotspot appears (part of the flow!)
        setTimeout(() => {
          console.log('🎭 Showing analysis modal');
          setShowModal(true);
        }, 500); // Small delay so user sees the hotspot first
      } else {
        console.warn('⚠️ No hotspot found in analysis');
        // Still show modal even without hotspot
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
      console.log('💾 Saving analysis to Supabase...');
      
      // Prepare data for Supabase
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
        layers_active: ['sst']
      };
      
      const saved = await saveSnipAnalysis(analysisData as any);
      console.log('✅ Analysis saved:', saved);
      
      alert('Analysis saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save analysis:', error);
      alert('Failed to save analysis. Please try again.');
    }
  }, [currentAnalysis]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    // Keep hotspot visible for a moment after closing
    setTimeout(() => {
      setCurrentAnalysis(null);
      setShowHotspot(false);
      setHotspotPosition(null);
      // Clear map overlays
      if (map) {
        clearMapOverlays(map);
      }
      
      // Tell SnipTool to clear the rectangle
      setShouldClearTool(true);
      setTimeout(() => setShouldClearTool(false), 100);
    }, 1000);
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
      
      {/* Test button - remove after debugging */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={testAnalysis}
          className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 z-50"
        >
          🧪 Test Analysis
        </button>
      )}
      
      <HotspotMarker
        map={map}
        position={hotspotPosition}
        visible={showHotspot}
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
      'circle-color': '#ff0000',
      'circle-stroke-width': 3,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': 0.8
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