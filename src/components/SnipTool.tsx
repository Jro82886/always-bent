'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { getVesselTracksInArea } from '@/lib/analysis/trackAnalyzer';
import { analyzeMultiLayer, generateMockSSTData, generateMockCHLData } from '@/lib/analysis/sst-analyzer';
import type { AnalysisResult } from '@/lib/analysis/sst-analyzer';
import { Maximize2, Loader2, Target, TrendingUp, Upload, WifiOff, CheckCircle } from 'lucide-react';
import { getVesselsInBounds, getVesselStyle, getVesselTrackingSummary } from '@/lib/vessels/vesselDataService';
import { getPendingCount, syncBites } from '@/lib/offline/biteSync';

interface SnipToolProps {
  map: mapboxgl.Map | null;
  onAnalysisComplete: (analysis: AnalysisResult) => void;
  isActive?: boolean;
}

// Offline Bites Uploader Component
function OfflineBitesUploader() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine);
    checkPending();
    
    // Listen for online/offline changes
    const handleOnline = () => {
      setIsOnline(true);
      checkPending();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check periodically
    const interval = setInterval(checkPending, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  const checkPending = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  };
  
  const handleUpload = async () => {
    if (!isOnline || pendingCount === 0) return;
    
    setIsUploading(true);
    try {
      await syncBites();
      await checkPending();
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500/90 text-white px-4 py-3 rounded-lg shadow-lg z-[9999] animate-slide-in';
      toast.innerHTML = `
        <div class="font-semibold">Bites Uploaded!</div>
        <div class="text-sm opacity-90">Reports generated in Community</div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Only show if there are pending bites
  if (pendingCount === 0) return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-[1000]">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl p-4 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
        <div className="flex items-center gap-3">
          {!isOnline ? (
            <WifiOff className="text-orange-400" size={20} />
          ) : (
            <Upload className="text-cyan-400" size={20} />
          )}
          
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">
              {pendingCount} Offline Bite{pendingCount > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-gray-400">
              {isOnline ? 'Ready to upload' : 'Waiting for connection'}
            </div>
          </div>
          
          {isOnline && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                'Upload'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Tooltip component that positions itself near the rectangle
function RectangleTooltip({ map, polygon, onDismiss }: { map: mapboxgl.Map | null; polygon: any; onDismiss?: () => void }) {
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!map || !polygon || !mounted) return;

    // Get the bounds of the polygon
    const bounds = turf.bbox(polygon);
    const centerLng = (bounds[0] + bounds[2]) / 2;
    const topLat = bounds[3]; // Top of the rectangle
    
    // Convert to screen coordinates
    const point = map.project([centerLng, topLat]);
    setTooltipPosition({ x: point.x, y: point.y - 20 }); // Position above the rectangle

    // Update position if map moves
    const updatePosition = () => {
      const newPoint = map.project([centerLng, topLat]);
      setTooltipPosition({ x: newPoint.x, y: newPoint.y - 20 });
    };

    map.on('move', updatePosition);
    return () => {
      map.off('move', updatePosition);
    };
  }, [map, polygon, mounted]);

  if (!mounted) return null;

  const tooltip = (
    <div 
      className="absolute cursor-pointer z-[99999]"
      style={{ 
        left: `${tooltipPosition.x}px`, 
        top: `${tooltipPosition.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onDismiss) onDismiss();
      }}
    >
      {/* Arrow pointing down to rectangle */}
      <div className="relative">
        <div className="bg-gradient-to-r from-cyan-900/98 to-blue-900/98 backdrop-blur-xl rounded-xl px-6 py-3 border-2 border-cyan-400 shadow-[0_0_30px_rgba(0,212,255,0.8)] animate-pulse">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              <span className="text-cyan-100 font-bold">Analysis Complete!</span>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            </div>
            <p className="text-cyan-300 font-semibold text-sm">
              👇 Click rectangle for ocean intelligence
            </p>
          </div>
        </div>
        {/* Arrow pointing down */}
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2">
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-cyan-400"></div>
        </div>
      </div>
    </div>
  );

  return createPortal(tooltip, document.body);
}

// Helper functions for map visualizations
function visualizeHotspotOnMap(map: mapboxgl.Map, hotspot: any) {
  console.log('[SNIP-VIZ] visualizeHotspotOnMap called with:', hotspot);
  if (!hotspot || !hotspot.location) {
    console.log('[SNIP-VIZ] No hotspot or location, skipping visualization');
    return;
  }
  
  // Ensure source exists
  if (!map.getSource('snip-hotspots')) {
    console.log('[SNIP-VIZ] Creating snip-hotspots source');
    map.addSource('snip-hotspots', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }
  
  // Add hotspot layer with deep purple/teal gradient
  if (!map.getLayer('snip-hotspots-layer')) {
    map.addLayer({
      id: 'snip-hotspots-layer',
      type: 'circle',
      source: 'snip-hotspots',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'confidence'],
          0.5, 8,
          1.0, 15
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'confidence'],
          0.3, '#334155', // Slate 700
          0.6, '#64748b', // Slate 500 - glowing blue-grey
          0.9, '#475569'  // Slate 600
        ],
        'circle-opacity': 0.9,
        'circle-stroke-color': '#94a3b8', // Slate 400 for glow
        'circle-stroke-width': 2,
        'circle-stroke-opacity': 0.6
      }
    });
    
    // Add subtle pulsing effect layer
    map.addLayer({
      id: 'snip-hotspots-pulse',
      type: 'circle',
      source: 'snip-hotspots',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'confidence'],
          0.5, 15,
          1.0, 30
        ],
        'circle-color': '#64748b', // Glowing slate blue
        'circle-opacity': 0.2,
        'circle-stroke-width': 0
      }
    });
    
    // Move hotspot layers to top
    try {
      map.moveLayer('snip-hotspots-pulse');
      map.moveLayer('snip-hotspots-layer');
    } catch (e) {
      // Layers might not exist yet
    }
  }
  
  // Update data
  const source = map.getSource('snip-hotspots') as mapboxgl.GeoJSONSource;
  source.setData({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        confidence: hotspot.confidence,
        type: hotspot.type,
        description: `${Math.round(hotspot.confidence * 100)}% confidence hotspot`
      },
      geometry: {
        type: 'Point',
        coordinates: hotspot.location
      }
    }]
  });
}

// Visualize vessels within the snipped area
function visualizeVesselsOnMap(map: mapboxgl.Map, vessels: any[], selectedInlet?: string) {
  console.log('[SNIP-VIZ] visualizeVesselsOnMap called with', vessels?.length, 'vessels');
  if (!vessels || vessels.length === 0) {
    console.log('[SNIP-VIZ] No vessels to visualize');
    return;
  }
  
  // Clean up existing vessel layers/markers
  // Remove old vessel tracks if they exist
  if (map.getLayer('vessel-tracks')) map.removeLayer('vessel-tracks');
  if (map.getSource('vessel-tracks')) map.removeSource('vessel-tracks');
  
  // Prepare track data for all vessels
  const trackFeatures: any[] = [];
  
  // Create vessel markers and tracks matching the tracking page style
  vessels.forEach(vessel => {
    console.log('[SNIP-VIZ] Adding vessel:', vessel.name, 'at', vessel.position);
    const style = getVesselStyle(vessel, selectedInlet);
    
    // Add vessel track if available
    if (vessel.track && vessel.track.length > 1) {
      trackFeatures.push({
        type: 'Feature',
        properties: {
          vesselType: vessel.type,
          vesselName: vessel.name
        },
        geometry: {
          type: 'LineString',
          coordinates: vessel.track
        }
      });
    }
    
    // Create vessel marker
    const el = document.createElement('div');
    el.className = `vessel-marker vessel-${vessel.type} snip-vessel-marker`;
    
    // Style based on vessel type matching tracking page
    if (vessel.type === 'user') {
      el.innerHTML = `
        <div style="
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          box-shadow: 0 0 15px ${style.glow};
        "></div>
      `;
    } else if (vessel.type === 'fleet') {
      el.innerHTML = `
        <div style="
          width: 10px;
          height: 10px;
          background: ${style.color};
          border-radius: 50%;
          box-shadow: 0 0 10px ${style.glow};
        "></div>
      `;
    } else if (vessel.type === 'commercial') {
      el.innerHTML = `
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 10px solid ${style.color};
          filter: drop-shadow(0 0 4px ${style.glow});
        "></div>
      `;
    }
    
    // Add marker to map
    new (window as any).mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat(vessel.position)
      .addTo(map);
  });
  
  // Add vessel tracks as lines on the map
  if (trackFeatures.length > 0) {
    map.addSource('vessel-tracks', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: trackFeatures
      }
    });
    
    map.addLayer({
      id: 'vessel-tracks',
      type: 'line',
      source: 'vessel-tracks',
      paint: {
        'line-color': [
          'match',
          ['get', 'vesselType'],
          'user', '#ffffff',
          'fleet', '#60a5fa',
          'commercial', '#f39c12',
          '#888888'
        ],
        'line-width': 1.5,
        'line-opacity': 0.6,
        'line-dasharray': [2, 2]
      }
    });
  }
}

// Edge visualization removed - handled by polygon filter
// But we still process edges for the written analysis
function processEdgesForAnalysis(features: any[]): string {
  if (!features || features.length === 0) return '';
  
  const strongEdges = features.filter(f => f.properties?.score > 0.7);
  const moderateEdges = features.filter(f => f.properties?.score > 0.4 && f.properties?.score <= 0.7);
  
  let edgeAnalysis = '';
  if (strongEdges.length > 0) {
    edgeAnalysis += `Strong temperature edges detected (${strongEdges.length} features). `;
  }
  if (moderateEdges.length > 0) {
    edgeAnalysis += `Moderate edges present (${moderateEdges.length} features). `;
  }
  
  return edgeAnalysis;
}

export default function SnipTool({ map, onAnalysisComplete, isActive = false }: SnipToolProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentArea, setCurrentArea] = useState<number>(0);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [hasAnalysisResults, setHasAnalysisResults] = useState(false);
  const [showCompleteBanner, setShowCompleteBanner] = useState(false);
  
  // Use refs for mouse tracking
  const startPoint = useRef<[number, number] | null>(null);
  const currentPolygon = useRef<any>(null);

  // Start drawing mode
  const startDrawing = useCallback(() => {
    if (!map) {
      console.log('[SNIP] No map available');
      return;
    }

    console.log('[SNIP] Starting drawing mode');
    
    // Ensure source and layers exist before starting
    if (!map.getSource('snip-rectangle')) {
      console.log('[SNIP] Creating snip-rectangle source');
      map.addSource('snip-rectangle', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    }
    
    if (!map.getLayer('snip-rectangle-fill')) {
      console.log('[SNIP] Creating snip-rectangle layers');
      map.addLayer({
        id: 'snip-rectangle-fill',
        type: 'fill',
        source: 'snip-rectangle',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': '#0f172a',
          'fill-opacity': 0.45
        }
      });
      
      map.addLayer({
        id: 'snip-rectangle-outline',
        type: 'line',
        source: 'snip-rectangle',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'line-color': '#334155',
          'line-width': 2,
          'line-opacity': 0.8,
          'line-blur': 0
        }
      });
      
      // Move layers to top
      try {
        map.moveLayer('snip-rectangle-fill');
        map.moveLayer('snip-rectangle-outline');
      } catch (e) {
        console.log('[SNIP] Could not move layers to top');
      }
    }
    
    // Clear any previous analysis before starting new one
    clearDrawing();
    setHasAnalysisResults(false);
    setLastAnalysis(null);
    setShowCompleteBanner(false);
    
    setIsDrawing(true);
    startPoint.current = null;
    
    // Change cursor with enhanced visibility
    const canvas = map.getCanvas();
    canvas.style.cursor = 'crosshair';
    
    // Add visual feedback class to canvas
    canvas.classList.add('snipping-active');
    
    // Add CSS for enhanced cursor if not already present
    if (!document.getElementById('snip-cursor-styles')) {
      const style = document.createElement('style');
      style.id = 'snip-cursor-styles';
      style.textContent = `
        .snipping-active {
          position: relative;
          outline: 2px solid rgba(0, 212, 255, 0.3);
          outline-offset: -2px;
          box-shadow: inset 0 0 20px rgba(0, 212, 255, 0.1);
        }
      `;
      document.head.appendChild(style);
    }
    
    // Disable map interactions
    map.dragPan.disable();
    map.dragRotate.disable();
    map.doubleClickZoom.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    
    // Clear any existing rectangle
    if (map.getSource('snip-rectangle')) {
      const source = map.getSource('snip-rectangle') as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    
    // Update button text
    const button = document.querySelector('button[onclick*="Analyze"]');
    if (button && button.textContent?.includes('Select')) {
      const originalText = button.innerHTML;
      button.innerHTML = `
        <svg class="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" stroke-dasharray="3 3" />
        </svg>
        Drawing... Click and drag
      `;
      // Store original text for restoration
      (window as any).__originalButtonText = originalText;
    }
  }, [map]);

  // Clear drawing
  const clearDrawing = useCallback(() => {
    if (!map) return;
    
    console.log('[SNIP] Clearing drawing');
    setIsDrawing(false);
    setIsAnalyzing(false);
    setCurrentArea(0);
    startPoint.current = null;
    currentPolygon.current = null;
    
    // Reset cursor
    const canvas = map.getCanvas();
    canvas.style.cursor = '';
    canvas.classList.remove('snipping-active');
    
    // Re-enable map interactions
    map.dragPan.enable();
    map.dragRotate.enable();
    map.doubleClickZoom.enable();
    map.scrollZoom.enable();
    map.boxZoom.enable();
    
    // Clear rectangle
    if (map.getSource('snip-rectangle')) {
      const source = map.getSource('snip-rectangle') as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    
    // Clear analysis visualizations
    if (map.getSource('snip-hotspots')) {
      const source = map.getSource('snip-hotspots') as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    
    // Clear vessel tracks layer
    if (map.getLayer('vessel-tracks')) {
      map.removeLayer('vessel-tracks');
    }
    if (map.getSource('vessel-tracks')) {
      map.removeSource('vessel-tracks');
    }
    
    // Remove any vessel markers
    const markers = document.querySelectorAll('.snip-vessel-marker');
    markers.forEach(marker => {
      const parent = marker.parentElement?.parentElement;
      if (parent && parent.classList.contains('mapboxgl-marker')) {
        parent.remove();
      }
    });
    
    // Clear analysis state
    setHasAnalysisResults(false);
    setLastAnalysis(null);
    setShowCompleteBanner(false);
    
    // Restore button text
    const button = document.querySelector('button[onclick*="Analyze"]');
    if (button && (window as any).__originalButtonText) {
      button.innerHTML = (window as any).__originalButtonText;
      delete (window as any).__originalButtonText;
    }
  }, [map]);

  // Throttle timer for rectangle updates
  const updateTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Update rectangle with throttling to reduce excessive updates
  const updateRectangle = useCallback((corner1: [number, number], corner2: [number, number]) => {
    if (!map) return;
    
    // Ensure source exists
    if (!map.getSource('snip-rectangle')) {
      console.log('[SNIP] Source missing, recreating...');
      map.addSource('snip-rectangle', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    }
    
    // Clear any pending update
    if (updateTimer.current) {
      clearTimeout(updateTimer.current);
    }
    
    // Throttle updates to every 16ms (60fps max)
    updateTimer.current = setTimeout(() => {
      const minX = Math.min(corner1[0], corner2[0]);
      const maxX = Math.max(corner1[0], corner2[0]);
      const minY = Math.min(corner1[1], corner2[1]);
      const maxY = Math.max(corner1[1], corner2[1]);
      
      const coords: [number, number][] = [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY]
      ];
      
      const polygon = {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [coords]
        }
      };
      
      // Only set the polygon, no corner points (modern seamless look)
      const source = map.getSource('snip-rectangle') as mapboxgl.GeoJSONSource;
      if (source) {
        // Ensure we only add the polygon, no point features
        source.setData({
          type: 'FeatureCollection',
          features: polygon ? [polygon] : []
        });
      }
      
      // Force layers to stay on top of SST
      try {
        // Check if SST layers exist and move snip layers above them
        const sstLayers = ['sst-lyr', 'sst-layer', 'raster-sst', 'sst-wmts'];
        const hasSST = sstLayers.some(layer => map.getLayer(layer));
        
        if (hasSST) {
          ['snip-rectangle-fill', 'snip-rectangle-outline'].forEach(layerId => {
            if (map.getLayer(layerId)) {
              map.moveLayer(layerId);
            }
          });
        }
      } catch (e) {
        // Silently handle layer reordering issues
      }
      
      // Calculate area
      const polygonFeature = turf.polygon([coords]);
      const areaM2 = turf.area(polygonFeature);
      setCurrentArea(areaM2 / 1000000);
      currentPolygon.current = polygon;
    }, 16);
  }, [map]);

  // Complete drawing and analyze
  const completeDrawing = useCallback(async () => {
    if (!map || !currentPolygon.current) return;
    
    console.log('[SNIP] Completing drawing and analyzing...');
    setIsAnalyzing(true);
    
    try {
      const polygon = currentPolygon.current;
      
      // Step 1: Get vessel data from shared service (source of truth)
      console.log('[SNIP] Step 1: Getting vessel data from tracking system...');
      
      // Get bounds from polygon for vessel detection
      const bbox = turf.bbox(polygon);
      const bounds: [[number, number], [number, number]] = [
        [bbox[0], bbox[1]], // Southwest
        [bbox[2], bbox[3]]  // Northeast
      ];
      
      // Get vessels from the shared data service
      const vesselsInBounds = getVesselsInBounds(bounds);
      const vesselSummary = getVesselTrackingSummary(vesselsInBounds);
      
      console.log('[SNIP] Found vessels in area:', vesselSummary.summary);
      
      // Build vessel data in expected format
      const vesselData = {
        tracks: vesselsInBounds.flatMap(v => v.track || [[v.position[0], v.position[1]]]),
        summary: vesselSummary.summary,
        total: vesselSummary.totalVessels,
        userVessels: vesselSummary.userVessels,
        fleetVessels: vesselSummary.fleetVessels,
        commercialVessels: vesselSummary.commercialVessels
      };
      
      // Step 2: Check active layers
      console.log('[SNIP] Step 2: Checking active layers...');
      const activeLayers = {
        sst: map.getLayer('sst-lyr') && map.getLayoutProperty('sst-lyr', 'visibility') === 'visible',
        chl: map.getLayer('chl-lyr') && map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
        ocean: map.getLayer('ocean-layer') && map.getLayoutProperty('ocean-layer', 'visibility') === 'visible'
      };
      console.log('[SNIP] Active layers:', activeLayers);
      
      // Step 3: Generate ocean data using already calculated bounds
      console.log('[SNIP] Step 3: Generating ocean data...');
      setAnalysisStep('Extracting temperature and chlorophyll data...');
      
      // Generate data (using mock for now) - reuse bounds from Step 1
      const sstData = activeLayers.sst || true ? generateMockSSTData(bounds) : null; // Always generate SST for demo
      const chlData = activeLayers.chl ? generateMockCHLData(bounds) : null;
      
      // Step 4: Run analysis
      console.log('[SNIP] Step 4: Running multi-layer analysis...');
      setAnalysisStep('Detecting edges, fronts, and convergence zones...');
      
      let analysis;
      try {
        analysis = await analyzeMultiLayer(
          polygon as GeoJSON.Feature<GeoJSON.Polygon>,
          sstData,
          chlData
        );
        
        // JEFF'S LOGIC: Only show hotspot if gradient meets threshold (>= 0.5°F/mile)
        if (!analysis.hotspot || !analysis.hotspot.location) {
          console.log('[SNIP] No hotspot - water conditions do not meet Jeff\'s criteria');
          console.log('[SNIP] Temperature range:', analysis.stats.temp_range_f.toFixed(2) + '°F');
          // Educational guidance will be shown in modal
        } else {
          console.log('[SNIP] HOTSPOT DETECTED! Gradient:', analysis.hotspot.gradient_strength.toFixed(2) + '°F/km');
        }
      } catch (analysisError) {
        console.warn('[SNIP] Analysis function error, using basic analysis:', analysisError);
        // Provide basic analysis without fake hotspot
        analysis = {
          polygon: polygon as GeoJSON.Feature<GeoJSON.Polygon>,
          features: [],
          hotspot: null, // Be honest - no hotspot detected
          stats: {
            min_temp_f: 68,
            max_temp_f: 72,
            avg_temp_f: 70,
            temp_range_f: 4, // Low range indicates uniform conditions
            area_km2: currentArea || 100
          }
        };
      }
      
      // Step 5: Add vessel info and visualize on map
      console.log('[SNIP] Step 5: Adding visualizations to map...');
      setAnalysisStep('Mapping hotspots and vessel activity...');
      const analysisWithVessels = {
        ...analysis,
        vesselTracks: vesselData.summary
      };
      
      // Visualize hotspots on map
      if (analysis.hotspot) {
        console.log('[SNIP] Visualizing hotspot at:', analysis.hotspot.location);
        visualizeHotspotOnMap(map, analysis.hotspot);
        
        // Ensure hotspot layers stay on top
        setTimeout(() => {
          try {
            if (map.getLayer('snip-hotspots-pulse')) map.moveLayer('snip-hotspots-pulse');
            if (map.getLayer('snip-hotspots-layer')) map.moveLayer('snip-hotspots-layer');
          } catch (e) {
            console.log('[SNIP] Could not reorder hotspot layers:', e);
          }
        }, 100);
      }
      
      // Visualize vessels within snipped area (matching tracking page style)
      if (vesselsInBounds && vesselsInBounds.length > 0) {
        console.log('[SNIP] Visualizing', vesselsInBounds.length, 'vessels in snipped area');
        // Get selected inlet for fleet colors (from global state if needed)
        const selectedInlet = localStorage.getItem('abfi_selected_inlet') || 'nc-hatteras';
        visualizeVesselsOnMap(map, vesselsInBounds, selectedInlet);
      }
      
      // Process edges for analysis (no visualization - handled by polygon filter)
      if (analysis.features && analysis.features.length > 0) {
        console.log('[SNIP] Processing', analysis.features.length, 'edge features for analysis');
        const edgeInfo = processEdgesForAnalysis(analysis.features);
        if (edgeInfo) {
          console.log('[SNIP] Edge analysis:', edgeInfo);
        }
      }
      
      // Log vessel tracks for analysis
      if (vesselData.tracks && vesselData.tracks.length > 0) {
        console.log('[SNIP] Found', vesselData.tracks.length, 'vessel tracks in area');
        // Tracks will be shown if user enables them on tracking page
      }
      
      // Add edge analysis info to the result
      const finalAnalysis = {
        ...analysisWithVessels,
        edgeAnalysis: analysis.features && analysis.features.length > 0 
          ? processEdgesForAnalysis(analysis.features) 
          : undefined
      };
      
      // Step 6: Store analysis but DON'T show modal yet
      console.log('[SNIP] Step 6: Analysis complete, visualizing results...');
      console.log('[SNIP] Full analysis:', finalAnalysis);
      
      // Store the analysis for later access when clicking
      setLastAnalysis(finalAnalysis);
      setHasAnalysisResults(true);
      setShowCompleteBanner(true);
      
      // DON'T show modal immediately - let user explore visualizations first
      // Modal will show when they click the rectangle
      console.log('[SNIP] Click the highlighted area to view the written analysis');
      
      // Keep rectangle AND visualizations visible
      // Rectangle stays to show the analyzed area
      setIsDrawing(false);
      setIsAnalyzing(false);
      setAnalysisStep('');
      // Don't clear the rectangle or area - keep them visible
      
      // Show a quick popup hint that auto-dismisses
      showQuickHint();
      // The rectangle will only clear when user starts a new selection
    } catch (error) {
      console.error('[SNIP] Analysis error:', error);
      // Create a basic fallback analysis
      const fallbackAnalysis = {
        polygon: currentPolygon.current || { 
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]]
          }
        },
        features: [],
        hotspot: null,
        stats: {
          min_temp_f: 68,
          max_temp_f: 72,
          avg_temp_f: 70,
          temp_range_f: 4,
          area_km2: currentArea || 100
        },
        vesselTracks: { total: 0, recreational: 0, commercial: 0 },
        edgeAnalysis: 'Analysis partially completed. Some features may not be detected.'
      };
      console.log('[SNIP] Using fallback analysis due to error');
      setLastAnalysis(fallbackAnalysis as any);
      setHasAnalysisResults(true);
      setShowCompleteBanner(true);
      onAnalysisComplete(fallbackAnalysis as any);
      setIsAnalyzing(false);
      setIsDrawing(false);
    }
  }, [map, onAnalysisComplete, clearDrawing]);

  // Initialize layers
  useEffect(() => {
    if (!map) return;

    const initLayers = () => {
      console.log('[SNIP] Initializing layers');
      
      // Remove existing
      if (map.getLayer('snip-rectangle-fill')) map.removeLayer('snip-rectangle-fill');
      if (map.getLayer('snip-rectangle-outline')) map.removeLayer('snip-rectangle-outline');
      if (map.getSource('snip-rectangle')) map.removeSource('snip-rectangle');
      
      // Add source
      map.addSource('snip-rectangle', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      
      // Uniform slate-900 rectangle - clean and minimal
      // Fill layer - slate-900 with good transparency
      map.addLayer({
        id: 'snip-rectangle-fill',
        type: 'fill',
        source: 'snip-rectangle',
        filter: ['==', '$type', 'Polygon'], // Only render polygons
        paint: {
          'fill-color': '#0f172a', // slate-900 uniform color
          'fill-opacity': 0.45 // Increased opacity for better visibility
        }
      });
      
      // More visible slate border
      map.addLayer({
        id: 'snip-rectangle-outline',
        type: 'line',
        source: 'snip-rectangle',
        filter: ['==', '$type', 'Polygon'], // Only render polygon outlines
        paint: {
          'line-color': '#334155', // slate-700 - more visible
          'line-width': 2,
          'line-opacity': 0.8, // Higher opacity for visibility
          'line-blur': 0 // Clean edge
        }
      });
      
      // Keep snip layers on top without interfering with other layers
      const moveToTop = () => {
        try {
          // Move all snip-related layers to top in proper order
          const snipLayers = [
            'snip-rectangle-fill', 
            'snip-rectangle-outline',
            'snip-hotspots-pulse',
            'snip-hotspots-layer',
            'vessel-tracks'
          ];
          
          snipLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              // Move each snip layer to the top
              map.moveLayer(layerId);
            }
          });
        } catch (e) {
          // Silently handle any layer reordering issues
        }
      };
      
      // Listen to multiple events to ensure layers stay on top
      const handleLayerChange = () => {
        // Delay to ensure other layers have been added first
        setTimeout(moveToTop, 50);
      };
      
      map.on('style.load', handleLayerChange);
      map.on('styledata', handleLayerChange);
      
      // Also listen for SST layer changes (actual layer ID is sst-lyr)
      const checkSST = setInterval(() => {
        if (map.getLayer('sst-lyr') || map.getLayer('sst-layer') || map.getLayer('raster-sst')) {
          moveToTop();
        }
      }, 1000);
      
      // Initial move to top after layers are ready
      setTimeout(moveToTop, 100);
      setTimeout(moveToTop, 500);
      setTimeout(moveToTop, 1000);
      setTimeout(moveToTop, 2000); // Extra delay for SST layer
      
      return () => {
        map.off('style.load', handleLayerChange);
        map.off('styledata', handleLayerChange);
        clearInterval(checkSST);
      };
    };

    if (map.isStyleLoaded()) {
      const cleanup = initLayers();
      return cleanup;
    } else {
      let cleanup: (() => void) | undefined;
      const handleLoad = () => {
        cleanup = initLayers();
      };
      map.once('style.load', handleLoad);
      return () => {
        if (cleanup) cleanup();
        map.off('style.load', handleLoad);
      };
    }
  }, [map]);

  // Handle clicks on analysis results
  useEffect(() => {
    console.log('[SNIP] Setting up click handlers - hasResults:', hasAnalysisResults, 'hasAnalysis:', !!lastAnalysis);
    if (!map) return;
    
    const handleResultClick = (e: mapboxgl.MapMouseEvent) => {
      // Check if we have analysis results
      if (!hasAnalysisResults || !lastAnalysis) {
        console.log('[SNIP] No analysis results to show yet');
        return;
      }
      
      // Check if click is on the rectangle
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['snip-rectangle-fill']
      });
      
      console.log('[SNIP] Click detected, features found:', features.length);
      
      if (features.length > 0) {
        console.log('[SNIP] Clicked on analysis rectangle, showing report');
        console.log('[SNIP] Analysis data:', lastAnalysis);
        // Hide the complete banner when showing analysis
        setShowCompleteBanner(false);
        // Re-show the analysis modal
        onAnalysisComplete(lastAnalysis);
      }
    };
    
    // Add cursor change on hover over rectangle
    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!hasAnalysisResults) return;
      
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['snip-rectangle-fill']
      });
      
      map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
    };
    
    map.on('click', handleResultClick);
    map.on('mousemove', handleMouseMove);
    
    return () => {
      map.off('click', handleResultClick);
      map.off('mousemove', handleMouseMove);
    };
  }, [map, hasAnalysisResults, lastAnalysis, onAnalysisComplete]);
  
  // Mouse event handlers for drawing
  useEffect(() => {
    if (!map || !isDrawing) return;

    console.log('[SNIP] Setting up drawing handlers, isDrawing:', isDrawing);

    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      console.log('[SNIP] Mouse down for drawing');
      e.preventDefault();
      startPoint.current = [e.lngLat.lng, e.lngLat.lat];
      updateRectangle(startPoint.current, startPoint.current);
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!startPoint.current) return;
      const current: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      updateRectangle(startPoint.current, current);
    };

    const handleMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (!startPoint.current) return;
      
      const endPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const dx = Math.abs(endPoint[0] - startPoint.current[0]);
      const dy = Math.abs(endPoint[1] - startPoint.current[1]);
      
      console.log('[SNIP] Mouse up, distance:', dx, dy);
      
      if (dx > 0.0001 || dy > 0.0001) {
        // Keep rectangle visible and trigger analysis
        updateRectangle(startPoint.current, endPoint);
        
        // Re-enable map interactions but keep rectangle
        map.dragPan.enable();
        map.dragRotate.enable();
        map.doubleClickZoom.enable();
        map.scrollZoom.enable();
        map.boxZoom.enable();
        map.getCanvas().style.cursor = '';
        
        // Trigger analysis while keeping rectangle visible
        completeDrawing();
      } else {
        // Too small, clear everything
        clearDrawing();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearDrawing();
    };

    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleEscape);

    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [map, isDrawing, updateRectangle, completeDrawing, clearDrawing]);

  // Handle programmatic trigger
  useEffect(() => {
    const handleTrigger = () => {
      console.log('[SNIP] Triggered programmatically');
      startDrawing();
    };
    
    // Add to window for easy access
    (window as any).startSnipping = handleTrigger;
    
    return () => {
      delete (window as any).startSnipping;
    };
  }, [startDrawing]);

  // Quick success notification
  const showQuickHint = () => {
    const hint = document.createElement('div');
    hint.className = 'fixed top-20 right-4 z-[99999] pointer-events-none';
    hint.innerHTML = `
      <div class="bg-gradient-to-r from-green-600/95 to-cyan-600/95 backdrop-blur-xl rounded-lg px-4 py-2 
                  border border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.5)] 
                  transform translate-x-full animate-[slideIn_0.3s_ease-out_forwards]">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-white font-semibold text-sm">Analysis complete!</p>
        </div>
      </div>
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        0% { transform: translateX(100%); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        0% { transform: translateX(0); opacity: 1; }
        100% { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(hint);
    
    // Auto remove after 2 seconds with slide out
    setTimeout(() => {
      hint.firstElementChild?.classList.add('animate-[slideOut_0.3s_ease-out_forwards]');
      setTimeout(() => {
        hint.remove();
      }, 300);
    }, 2000);
  };

  return (
    <>
      {/* Offline Bites Upload Section */}
      <OfflineBitesUploader />
      
      <div className="hidden">
        <button
          data-snip-button
          onClick={startDrawing}
          className="hidden"
        >
          Start Snipping
        </button>
        
        {/* Enhanced guide positioned near the rectangle */}
        {showCompleteBanner && hasAnalysisResults && !isAnalyzing && !isDrawing && currentPolygon.current && (
          <RectangleTooltip 
            map={map} 
            polygon={currentPolygon.current}
            onDismiss={() => setShowCompleteBanner(false)}
          />
        )}
      
      {/* Enhanced Status display with better visibility */}
      {(isDrawing || isAnalyzing) && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 pointer-events-none z-[9999]">
          {isDrawing && !isAnalyzing && (
            <div className="bg-black/95 backdrop-blur-md rounded-xl px-6 py-3 flex items-center gap-3 border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(0,212,255,0.5)]">
              <div className="relative">
                <Maximize2 size={18} className="text-cyan-400" />
                <div className="absolute inset-0 animate-ping">
                  <Maximize2 size={18} className="text-cyan-400 opacity-75" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-cyan-300">
                  Click and drag to select area
                </span>
                {currentArea > 0 && (
                  <span className="text-xs text-cyan-400/80">
                    Area: {currentArea.toFixed(1)} km² • {(currentArea * 0.386).toFixed(1)} mi²
                  </span>
                )}
              </div>
              <div className="ml-2 text-xs text-cyan-500/60">
                ESC to cancel
              </div>
            </div>
          )}
          
          {isAnalyzing && (
            <div className="bg-black/95 backdrop-blur-md rounded-xl px-6 py-3 flex items-center gap-3 border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(0,212,255,0.5)]">
              <Loader2 size={18} className="text-cyan-400 animate-spin" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-cyan-300">
                  Analyzing ocean intelligence...
                </span>
                <span className="text-xs text-cyan-400/80">
                  {analysisStep || 'Detecting edges, hotspots, and vessel tracks'}
                </span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-150" />
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
}