'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { getVesselTracksInArea } from '@/lib/analysis/trackAnalyzer';
import { analyzeMultiLayer, generateMockSSTData, generateMockCHLData } from '@/lib/analysis/sst-analyzer';
import type { AnalysisResult } from '@/lib/analysis/sst-analyzer';
import { extractPixelData, analyzePixelData } from '@/lib/analysis/pixel-extractor';
import { extractRealTileData } from '@/lib/analysis/tile-data-extractor';
import { generateComprehensiveAnalysis } from '@/lib/analysis/comprehensive-analyzer';
import { buildNarrative } from '@/lib/analysis/narrative-builder';
import type { SnipAnalysis, LayerToggles, SnipReportPayload, ScalarStats } from '@/lib/analysis/types';
import { sampleScalars, clipGFW } from '@/lib/analysis/fetchers';
import { fetchWindSwell } from '@/lib/analysis/fetchWindSwell';
import { clipFleetPresence } from '@/lib/analysis/clipFleetPresence';
import { computePolygonMeta } from '@/lib/analysis/computePolygonMeta';
import { fitBoundsToPolygon } from '@/lib/map/fitBoundsToPolygon';
import { frontStrength, inSstBand, inChlMidBand } from '@/lib/analysis/hotspot-utils';
import { THRESHOLDS } from '@/config/ocean-thresholds';
import { Maximize2, Loader2, Target, TrendingUp, Upload, WifiOff, CheckCircle } from 'lucide-react';
import { getVesselsInBoundsAsync, getVesselStyle, getVesselTrackingSummary } from '@/lib/vessels/vesselDataService';
import { getPendingCount, syncBites } from '@/lib/offline/biteSync';
import { useAppState } from '@/lib/store';
import { showToast } from '@/components/ui/Toast';

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
function RectangleTooltip({ map, polygon, onDismiss, analysis }: { 
  map: mapboxgl.Map | null; 
  polygon: any; 
  onDismiss?: () => void;
  analysis?: any;
}) {
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
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-lg px-5 py-3 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <div className="flex flex-col items-center gap-2">
            {/* Temperature Range Display */}
            {analysis?.stats && (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3">
                  <div className="text-blue-400 text-xs font-medium">MIN</div>
                  <div className="text-2xl font-bold text-white">
                    {analysis.stats.min_temp_f.toFixed(1)}°F
                  </div>
                  <div className="text-gray-400 text-lg">→</div>
                  <div className="text-2xl font-bold text-white">
                    {analysis.stats.max_temp_f.toFixed(1)}°F
                  </div>
                  <div className="text-red-400 text-xs font-medium">MAX</div>
                </div>
                <div className="text-cyan-400 text-xs">
                  {(analysis.stats.max_temp_f - analysis.stats.min_temp_f).toFixed(1)}°F range
                  {analysis.hotspot && ' • Hotspot detected!'}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              <span className="text-cyan-100 font-semibold text-sm">Analysis Complete!</span>
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            </div>
            <div className="flex items-center gap-2 text-cyan-300/80 text-xs">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Click rectangle for ocean intelligence</span>
            </div>
          </div>
        </div>
        {/* Arrow pointing down */}
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2">
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-cyan-500/30"></div>
        </div>
      </div>
    </div>
  );

  return createPortal(tooltip, document.body);
}

// Helper functions for map visualizations
function visualizeHotspotOnMap(map: mapboxgl.Map, hotspot: any) {
  
  if (!hotspot || !hotspot.location) {
    
    return;
  }
  
  // Ensure source exists
  if (!map.getSource('snip-hotspots')) {
    
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
  
  if (!vessels || vessels.length === 0) {
    
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
    
    const style = getVesselStyle(vessel);
    
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
  const [status, setStatus] = useState<'idle' | 'drawing' | 'analyzing'>('idle');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentArea, setCurrentArea] = useState<number>(0);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [hasAnalysisResults, setHasAnalysisResults] = useState(false);
  const [showCompleteBanner, setShowCompleteBanner] = useState(false);
  const [isZoomedToSnip, setIsZoomedToSnip] = useState(false);
  const [previousView, setPreviousView] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);
  
  // Get app state for date and layer toggles
  const { 
    isoDate, 
    selectedInletId,
    myTracksEnabled,
    fleetTracksEnabled,
    gfwTracksEnabled 
  } = useAppState();
  
  // Use refs for mouse tracking
  const startPoint = useRef<[number, number] | null>(null);
  const currentPolygon = useRef<any>(null);

  // Helper function to calculate polygon area in km²
  const polygonAreaKm2 = (geom: GeoJSON.Polygon): number => {
    const ring = geom.coordinates[0];
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      area += (xj + xi) * (yj - yi);
    }
    const m2 = Math.abs(area) / 2 * (111_320 ** 2 * Math.cos((ring[0][1] * Math.PI) / 180));
    return m2 / 1_000_000;
  };

  // Start drawing mode
  const startDrawing = useCallback(() => {
    if (!map) {
      return;
    }

    setStatus('drawing');
    
    // Ensure source and layers exist before starting
    if (!map.getSource('snip-rectangle')) {
      
      map.addSource('snip-rectangle', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    }
    
    if (!map.getLayer('snip-rectangle-fill')) {
      
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
    
    // Expose stop function for hard reset
    (window as any).__abfiStopDrawing = () => stopDrawing();
    
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

  // Stop drawing mode (for external use)
  const stopDrawing = useCallback(() => {
    if (!map) return;
    
    setIsDrawing(false);
    startPoint.current = null;
    
    // Reset cursor
    const canvas = map.getCanvas();
    canvas.style.cursor = '';
    canvas.classList.remove('snipping-active');
    
    // Remove rectangle layers/source if present
    try {
      if (map.getLayer('snip-rectangle-outline')) map.removeLayer('snip-rectangle-outline');
      if (map.getLayer('snip-rectangle-fill')) map.removeLayer('snip-rectangle-fill');
      if (map.getSource('snip-rectangle')) map.removeSource('snip-rectangle');
    } catch {}
    
    // Re-enable map interactions
    map.dragPan.enable();
    map.dragRotate.enable();
    map.doubleClickZoom.enable();
    map.scrollZoom.enable();
    map.boxZoom.enable();
  }, [map]);

  // Clear drawing
  const clearDrawing = useCallback(() => {
    if (!map) return;
    
    
    setIsDrawing(false);
    setIsAnalyzing(false);
    setCurrentArea(0);
    startPoint.current = null;
    currentPolygon.current = null;
    
    // Remove persistent tooltip if exists
    if ((window as any).__snippingTooltip) {
      (window as any).__snippingTooltip.remove();
      delete (window as any).__snippingTooltip;
    }
    
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
    
    const polygon = currentPolygon.current;
    
    // Check minimum area
    const areaKm2 = polygonAreaKm2(polygon.geometry);
    if (areaKm2 < 0.5) {
      setTooltip('Try a larger area for better signal.');
      setTimeout(() => setTooltip(null), 2200);
      setStatus('idle');
      return;
    }
    
    setStatus('analyzing');
    setIsAnalyzing(true);
    
    // Set timeout guard
    const timeout = setTimeout(() => {
      setStatus('idle');
      setIsAnalyzing(false);
    }, 6000);
    
    try {
      // NEW CLEAN ANALYSIS FLOW
      const timeISO = isoDate || new Date().toISOString();
      const bbox = turf.bbox(polygon) as [number, number, number, number];
      
      // Check active layers
      const activeLayers = {
        sst: map.getLayer('sst-lyr') && map.getLayoutProperty('sst-lyr', 'visibility') === 'visible',
        chl: map.getLayer('chl-lyr') && map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
        gfw: map.getLayer('gfw-vessels-dots') && map.getLayoutProperty('gfw-vessels-dots', 'visibility') === 'visible'
      };
      
      const toggles: LayerToggles = {
        sst: activeLayers.sst || false,
        chl: activeLayers.chl || false,
        gfw: activeLayers.gfw || false,
        myTracks: myTracksEnabled,
        fleetTracks: fleetTracksEnabled,
        gfwTracks: gfwTracksEnabled
      };

      // Run fetches in parallel honoring toggles
      setAnalysisStep('Analyzing ocean data...');
      
      const want: Array<'sst'|'chl'> = [];
      if (toggles.sst) want.push('sst');
      if (toggles.chl) want.push('chl');

      const [scalarRes, windSwellRes, fleetRes] = await Promise.allSettled([
        want.length ? sampleScalars({ polygon: polygon.geometry, timeISO, layers: want }) : Promise.resolve({} as { sst?: ScalarStats | null; chl?: ScalarStats | null }),
        fetchWindSwell(polygon.geometry),
        clipFleetPresence(polygon.geometry, selectedInletId || 'overview', 96),
      ]);

      // Process results safely
      const scalarData = scalarRes.status === 'fulfilled' ? scalarRes.value : {};
      const windSwellData = windSwellRes.status === 'fulfilled' ? windSwellRes.value : { wind: null, swell: null };
      const fleetData = fleetRes.status === 'fulfilled' ? fleetRes.value : {
        myVesselInArea: false,
        fleetVessels: 0,
        fleetVisitsDays: 0,
        gfw: null
      };

      // Compute polygon metadata
      const polygonMeta = computePolygonMeta(polygon.geometry);

      // Build analysis object
      const analysis: SnipAnalysis = {
        polygon: polygon.geometry,
        timeISO,
        sst: toggles.sst ? (scalarData.sst ?? { mean: null, min: null, max: null, gradient: null, units: '°F', reason: 'NoData' }) : undefined,
        chl: toggles.chl ? (scalarData.chl ?? { mean: null, min: null, max: null, gradient: null, units: 'mg/m³', reason: 'NoData' }) : undefined,
        wind: windSwellData.wind,
        swell: windSwellData.swell,
        presence: fleetData,
        toggles,
        polygonMeta,
        obtainedVia: 'snip'
      };

      // Build context for narrative
      const ctx = {
        weather: windSwellData.wind && windSwellData.swell ? {
          wind_kn: windSwellData.wind.speed_kn ?? undefined,
          wind_dir_deg: windSwellData.wind.direction_deg ?? undefined,
          swell_ft: windSwellData.swell.height_ft ?? undefined,
          swell_period_s: windSwellData.swell.period_s ?? undefined,
        } : undefined,
        fleetRecentCount: fleetData.fleetVessels,
        userInside: fleetData.myVesselInArea,
      };

      // Compute narrative
      const narrative = buildNarrative(analysis, ctx);

      // Zoom to polygon first, then open modal
      fitBoundsToPolygon(map, polygon.geometry, {
        padding: 44,
        maxZoom: 12.5,
        durationMs: 1500,
        minAreaKm2: 0.3,
        onDone: () => {
          // Store analysis - create AnalysisResult for legacy compatibility
          const finalAnalysis: AnalysisResult = {
        polygon: polygon,
        features: [], // No features for MVP
        hotspot: null, // No hotspot detection for MVP
        stats: {
          avg_temp_f: analysis.sst?.mean ?? 0,
          min_temp_f: analysis.sst?.min ?? 0,
          max_temp_f: analysis.sst?.max ?? 0,
          temp_range_f: (analysis.sst?.max ?? 0) - (analysis.sst?.min ?? 0),
          area_km2: turf.area(polygon) / 1000000
        },
        layerAnalysis: {
          sst: analysis.sst ? {
            active: true,
            description: `SST: ${analysis.sst.mean?.toFixed(1) ?? 'N/A'}°F`
          } : undefined,
          chl: analysis.chl ? {
            active: true,
            description: `CHL: ${analysis.chl.mean?.toFixed(2) ?? 'N/A'} mg/m³`,
            avg_chl_mg_m3: analysis.chl.mean ?? undefined,
            max_chl_mg_m3: analysis.chl.max ?? undefined
          } : undefined
        },
        narrative,
        type: 'snip' as const,
        id: crypto.randomUUID(),
        user_id: 'current-user',
        created_at: new Date().toISOString()
      } as any;
      
      setLastAnalysis(finalAnalysis);
      setHasAnalysisResults(true);
      
      // Trigger modal
      if (onAnalysisComplete) {
        onAnalysisComplete(finalAnalysis);
      }
      
          // Clean up drawing
          clearTimeout(timeout);
          setStatus('idle');
          setIsAnalyzing(false);
          setIsDrawing(false);
          clearDrawing();
        }
      });
      
      // END NEW CLEAN ANALYSIS FLOW
    } catch (error) {
      console.error('Error during analysis:', error);
      clearTimeout(timeout);
      setStatus('idle');
      setIsAnalyzing(false);
      setIsDrawing(false);
      showToast({
        type: 'error',
        title: 'Analysis Failed',
        message: 'Unable to complete analysis. Please try again.',
        duration: 5000
      });
    }
  }, [map, onAnalysisComplete, clearDrawing, isoDate, selectedInletId, myTracksEnabled, fleetTracksEnabled, gfwTracksEnabled]);
      
  /* LEGACY CODE - KEPT FOR REFERENCE BUT NOT EXECUTED
      const polygon_legacy = currentPolygon.current;
      
      // Step 1: Get vessel data from shared service (source of truth)
      
      
      // Get bounds from polygon for vessel detection
      const bbox = turf.bbox(polygon);
      const bounds: [[number, number], [number, number]] = [
        [bbox[0], bbox[1]], // Southwest
        [bbox[2], bbox[3]]  // Northeast
      ];
      
      // Get vessels from the shared data service
      setAnalysisStep('Fetching vessel data...');
      const vesselResult = await getVesselsInBoundsAsync(bounds);
      const vesselsInBounds = vesselResult.vessels;
      const vesselSummary = getVesselTrackingSummary(vesselsInBounds, vesselResult.error);
      
      
      
      // Get vessel tracks and reports from the area
      let vesselTracksData;
      try {
        vesselTracksData = await getVesselTracksInArea(
          polygon as GeoJSON.Feature<GeoJSON.Polygon>,
          map,
          7 // Look back 7 days for reports
        );
      } catch (error) {
        
        vesselTracksData = { tracks: [], summary: '', reports: [] };
      }
      
      // Build vessel data in expected format
      const vesselData = {
        tracks: vesselsInBounds.flatMap(v => v.track || [[v.position[0], v.position[1]]]),
        summary: vesselTracksData.summary || vesselSummary,
        total: vesselsInBounds.length,
        userVessels: vesselsInBounds.filter(v => v.type === 'user').length,
        fleetVessels: vesselsInBounds.filter(v => v.type === 'fleet').length,
        commercialVessels: vesselsInBounds.filter(v => v.type === 'commercial').length,
        reports: vesselTracksData.reports || []
      };
      
      // Step 2: Check active layers
      
      const activeLayers = {
        sst: map.getLayer('sst-lyr') && map.getLayoutProperty('sst-lyr', 'visibility') === 'visible',
        chl: map.getLayer('chl-lyr') && map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
        ocean: map.getLayer('ocean-layer') && map.getLayoutProperty('ocean-layer', 'visibility') === 'visible',
        gfw: vesselsInBounds.some(v => v.type === 'commercial') // Check if any commercial vessels found
      };
      
      // Step 2.5: Call the new endpoints in parallel
      setAnalysisStep('Analyzing ocean data...');
      
      const [samplerRes, gfwRes, fleetRes] = await Promise.allSettled([
        // Ocean data sampling (SST/CHL)
        activeLayers.sst || activeLayers.chl
          ? fetch('/api/rasters/sample', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                polygon: polygon.geometry,
                time: isoDate || new Date().toISOString(),
                layers: ['sst', 'chl'].filter(k => activeLayers[k as 'sst'|'chl'])
              })
            }).then(r => r.json())
          : Promise.resolve(null),
          
        // GFW commercial vessels (4 days)
        activeLayers.gfw
          ? fetch('/api/gfw/clip?days=4', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                polygon: polygon.geometry,
                gears: ['longliner','drifting_longline','trawler']
              })
            }).then(r => r.json())
          : Promise.resolve(null),
          
        // Fleet and user presence (always check)
        fetch('/api/fleet/clip', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            polygon: polygon.geometry,
            inletId: selectedInletId || 'overview',
            days: 7
          })
        }).then(r => r.json())
      ]);
      
      // Process sampler results
      let sstStats = null;
      let chlStats = null;
      if (samplerRes.status === 'fulfilled' && samplerRes.value) {
        const samplerData = samplerRes.value;
        if (samplerData.meta?.noDataAvailable) {
          showToast({
            type: 'error',
            title: 'Ocean Data Unavailable',
            message: samplerData.message || 'No live data is available at this time, please check an alternate day',
            duration: 7000
          });
        } else {
          sstStats = samplerData.sst;
          chlStats = samplerData.chl;
        }
      }
      
      // Process GFW results
      let gfwData = null;
      if (gfwRes.status === 'fulfilled' && gfwRes.value) {
        gfwData = gfwRes.value;
      }
      
      // Process fleet/user results
      let presenceData = { user: { present: false }, fleet: { count: 0, vessels: [], consecutiveDays: 0, daysWithPresence: [] } };
      if (fleetRes.status === 'fulfilled' && fleetRes.value) {
        presenceData = fleetRes.value;
      }
      
      // Step 3: Extract REAL ocean data from tiles!
      
      setAnalysisStep('Extracting real temperature and chlorophyll data...');
      
      let sstData = null;
      let chlData = null;
      let pixelAnalysis = null;
      
      try {
        // First try the enhanced tile data extraction for REAL data
        const realData = await extractRealTileData(map, polygon, {
          sstEnabled: activeLayers.sst || true,
          chlEnabled: activeLayers.chl,
          sampleDensity: 20
        });
        
        if (realData.isRealData) {
          // SUCCESS! We got REAL ocean data from tiles!
          if (realData.sst.length > 0) {
            sstData = realData.sst.map(p => ({
              lat: p.lat,
              lng: p.lng,
              temp_f: p.value,
              timestamp: p.timestamp
            }));
          }
          
          if (realData.chl.length > 0) {
            chlData = realData.chl.map(p => ({
              lat: p.lat,
              lng: p.lng,
              chl_mg_m3: p.value
            }));
          }
        } else {
          // Fallback to WebGL pixel extraction
          const extractedData = await extractPixelData(map, polygon, {
            sstLayerId: 'sst-lyr',
            chlLayerId: 'chl-lyr',
            sampleDensity: 20
          });
          
          if (extractedData.sst.length > 0 || extractedData.chl.length > 0) {
            pixelAnalysis = analyzePixelData(extractedData);
            
            if (extractedData.sst.length > 0) {
              sstData = extractedData.sst.map(p => ({
                lat: p.lat,
                lng: p.lng,
                temp_f: p.value,
                timestamp: p.timestamp
              }));
            }
            
            if (extractedData.chl.length > 0) {
              chlData = extractedData.chl.map(p => ({
                lat: p.lat,
                lng: p.lng,
                chl_mg_m3: p.value
              }));
            }
          }
        }
      } catch (pixelError) {
        // Silent fallback to mock data
      }
      
      // Fallback to generated data if pixel extraction failed
      if (!sstData && (activeLayers.sst || true)) {
        // WARNING: Using MOCK data - real extraction failed
        sstData = generateMockSSTData(bounds);
      }
      if (!chlData && activeLayers.chl) {
        // WARNING: Using MOCK data - real extraction failed
        chlData = generateMockCHLData(bounds);
      }
      
      // Step 4: Run analysis with real or generated data
      
      setAnalysisStep('Detecting edges, fronts, and convergence zones...');
      
      let analysis;
      try {
        analysis = await analyzeMultiLayer(
          polygon as GeoJSON.Feature<GeoJSON.Polygon>,
          sstData,
          chlData
        );
        
        // If we have real pixel analysis, merge the stats
        if (pixelAnalysis) {
          analysis.stats = {
            ...analysis.stats,
            min_temp_f: pixelAnalysis.stats.sstMin || analysis.stats.min_temp_f,
            max_temp_f: pixelAnalysis.stats.sstMax || analysis.stats.max_temp_f,
            avg_temp_f: pixelAnalysis.stats.sstAvg || analysis.stats.avg_temp_f,
            temp_range_f: (pixelAnalysis.stats.sstMax || 0) - (pixelAnalysis.stats.sstMin || 0) || analysis.stats.temp_range_f
          };
          
          // Store gradient info separately
          (analysis as any).gradient_strength = pixelAnalysis.stats.sstGradient;
          (analysis as any).data_source = 'REAL_TILES';
          
          // Use real hotspots if detected
          if (pixelAnalysis.hotspots.length > 0) {
            const bestHotspot = pixelAnalysis.hotspots[0];
            analysis.hotspot = {
              location: [bestHotspot.lng, bestHotspot.lat],
              gradient_strength: bestHotspot.strength,
              confidence: 0.95, // High confidence for real data
              optimal_approach: bestHotspot.type === 'temperature_break' ? 'North-South' : 'East-West'
            };
          }
          
          
        }
        
        // JEFF'S LOGIC: Only show hotspot if gradient meets threshold (>= 0.5°F/mile)
        if (!analysis.hotspot || !analysis.hotspot.location) {
          // No significant gradient detected
          // Educational guidance will be shown in modal
        } else {
          // Hotspot detected with significant gradient
        }
      } catch (analysisError) {
        
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
      
      // Step 5: Generate comprehensive analysis
      
      setAnalysisStep('Generating comprehensive analysis...');
      
      // Generate the comprehensive written analysis
      const comprehensiveAnalysis = await generateComprehensiveAnalysis(
        polygon as GeoJSON.Feature<GeoJSON.Polygon>,
        sstData,
        vesselData,
        analysis,
        selectedInletId || undefined
      );
      
      // Update analysis with comprehensive data
      const analysisWithVessels = {
        ...analysis,
        vesselTracks: vesselData.summary,
        comprehensiveAnalysis: comprehensiveAnalysis
      };
      
      // Use comprehensive hotspot if better than original
      if (comprehensiveAnalysis.hotspot && 
          (!analysis.hotspot || comprehensiveAnalysis.hotspot.confidence > (analysis.hotspot.confidence * 100))) {
        analysis.hotspot = {
          location: comprehensiveAnalysis.hotspot.location,
          confidence: comprehensiveAnalysis.hotspot.confidence / 100,
          gradient_strength: analysis.hotspot?.gradient_strength || 1.0,
          optimal_approach: 'Multi-factor analysis'
        };
      }
      
      // Visualize hotspots on map
      if (analysis.hotspot) {
        
        visualizeHotspotOnMap(map, analysis.hotspot);
        
        // Ensure hotspot layers stay on top
        setTimeout(() => {
          try {
            if (map.getLayer('snip-hotspots-pulse')) map.moveLayer('snip-hotspots-pulse');
            if (map.getLayer('snip-hotspots-layer')) map.moveLayer('snip-hotspots-layer');
          } catch (e) {
            
          }
        }, 100);
      }
      
      // Visualize vessels within snipped area (matching tracking page style)
      if (vesselsInBounds && vesselsInBounds.length > 0) {
        
        // Get selected inlet for fleet colors (from global state if needed)
        const selectedInlet = localStorage.getItem('abfi_selected_inlet') || 'nc-hatteras';
        visualizeVesselsOnMap(map, vesselsInBounds, selectedInlet);
      }
      
      // Process edges for analysis (no visualization - handled by polygon filter)
      if (analysis.features && analysis.features.length > 0) {
        
        const edgeInfo = processEdgesForAnalysis(analysis.features);
        if (edgeInfo) {
          
        }
      }
      
      // Log vessel tracks for analysis
      if (vesselData.tracks && vesselData.tracks.length > 0) {
        
        // Tracks will be shown if user enables them on tracking page
      }
      
      // Hotspots will be computed later when needed
      const hotspots: any[] = [];
      
      // Check for SST front
      if (sstStats && sstStats.gradient) {
        const sstFrontStrength = frontStrength(sstStats.gradient);
        if (sstFrontStrength) {
          hotspots.push({
            type: 'front',
            strength: sstFrontStrength,
            geometry: polygon.geometry, // TODO: compute actual front geometry
            notes: `SST gradient ${sstStats.gradient.toFixed(2)}°C/km`
          });
        }
      }
      
      // Check for SST band
      if (sstStats && inSstBand(sstStats.mean)) {
        hotspots.push({
          type: 'sst-band',
          strength: 'moderate',
          geometry: polygon.geometry,
          notes: `SST in target range (${THRESHOLDS.SST.TARGET_MIN}-${THRESHOLDS.SST.TARGET_MAX}°C)`
        });
      }
      
      // Check for CHL band
      if (chlStats && inChlMidBand(chlStats.mean)) {
        hotspots.push({
          type: 'chl-band',
          strength: 'moderate',
          geometry: polygon.geometry,
          notes: `CHL in favorable range (${THRESHOLDS.CHL.MID_BAND_MIN}-${THRESHOLDS.CHL.MID_BAND_MAX} mg/m³)`
        });
      }
      
      // Build the SnipAnalysis object
      const snippedBounds = turf.bbox(polygon);
      const snipAnalysis: SnipAnalysis = {
        polygon: polygon.geometry,
        bbox: snippedBounds as [number, number, number, number],
        timeISO: new Date().toISOString(),
        sst: sstStats,
        chl: chlStats,
        gfw: gfwData,
        toggles: {
          sst: activeLayers.sst || false,
          chl: activeLayers.chl || false,
          gfw: activeLayers.gfw || false,
          myTracks: myTracksEnabled,
          fleetTracks: fleetTracksEnabled,
          gfwTracks: gfwTracksEnabled
        },
        notes: undefined
      };
      
      // Generate narrative from the analysis
      const narrative = buildNarrative(snipAnalysis);
      
      // Add legacy fields for compatibility with existing modal
      const finalAnalysis = {
        ...analysis,
        ...snipAnalysis,
        polygon: polygon as GeoJSON.Feature<GeoJSON.Polygon>, // Ensure polygon is Feature type
        vesselTracks: vesselData.summary,
        comprehensiveAnalysis: comprehensiveAnalysis,
        edgeAnalysis: analysis.features && analysis.features.length > 0 
          ? processEdgesForAnalysis(analysis.features) 
          : undefined,
        vessels: vesselsInBounds,
        stats: {
          ...analysis.stats,
          ...(sstStats ? {
            avg_temp_f: sstStats.mean * 9/5 + 32,
            min_temp_f: sstStats.min * 9/5 + 32,
            max_temp_f: sstStats.max * 9/5 + 32,
            temp_range_f: (sstStats.max - sstStats.min) * 9/5
          } : {})
        },
        samplerStats: { sst: sstStats, chl: chlStats },
        layers_on: [
          ...(activeLayers.sst ? ['sst'] : []),
          ...(activeLayers.chl ? ['chl'] : []),
          ...(activeLayers.gfw ? ['gfw'] : [])
        ]
      };
      
      // Step 6: Store analysis but DON'T show modal yet
      
      // Store the analysis for later access when clicking
      setLastAnalysis(finalAnalysis);
      setHasAnalysisResults(true);
      setShowCompleteBanner(true);
      
      // DON'T show modal immediately - let user explore visualizations first
      // Modal will show when they click the rectangle
      
      
      // Keep rectangle AND visualizations visible
      // Rectangle stays to show the analyzed area
      setIsDrawing(false);
      setIsAnalyzing(false);
      setAnalysisStep('');
      // Don't clear the rectangle or area - keep them visible
      
      // Show persistent tooltip and quick hint
      showQuickHint();
      
      // Make the rectangle clickable to show the analysis
      map.on('click', 'snip-rectangle-fill', () => {
        if (lastAnalysis && onAnalysisComplete) {
          onAnalysisComplete(lastAnalysis);
        }
      });
      
      // Change cursor on hover
      map.on('mouseenter', 'snip-rectangle-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      
      map.on('mouseleave', 'snip-rectangle-fill', () => {
        map.getCanvas().style.cursor = '';
      });
      
      // Zoom to the snipped area for better visualization
      setTimeout(() => {
        if (currentPolygon.current) {
          // Save current view before zooming
          const currentCenter = map.getCenter();
          const currentZoom = map.getZoom();
          setPreviousView({
            center: [currentCenter.lng, currentCenter.lat],
            zoom: currentZoom
          });
          setIsZoomedToSnip(true);
          
          const bounds = turf.bbox(currentPolygon.current);
          
          // Calculate padding based on current viewport
          const padding = {
            top: 100,
            bottom: 100,
            left: 350,  // Account for left panel
            right: 400  // Account for right panel and analysis
          };
          
          // Animate zoom to the snipped area
          map.fitBounds(
            [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
            {
              padding: padding,
              duration: 1500,
              essential: true
            }
          );
          
          
          
          // Add a visual indicator that we're analyzing this specific area
          setTimeout(() => {
            // Flash the rectangle to show it's being analyzed
            const currentOpacity = map.getPaintProperty('snip-rectangle-fill', 'fill-opacity') || 0.45;
            
            // Pulse effect with slate blue-grey
            map.setPaintProperty('snip-rectangle-fill', 'fill-opacity', 0.7);
            map.setPaintProperty('snip-rectangle-outline', 'line-width', 4);
            map.setPaintProperty('snip-rectangle-outline', 'line-color', '#475569'); // slate-600 to match
            
            setTimeout(() => {
              map.setPaintProperty('snip-rectangle-fill', 'fill-opacity', currentOpacity);
              map.setPaintProperty('snip-rectangle-outline', 'line-width', 2);
              map.setPaintProperty('snip-rectangle-outline', 'line-color', '#334155');
            }, 500);
          }, 1000);
        }
      }, 300);
      
      // The rectangle will only clear when user starts a new selection
    } catch (error) {
      
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
      
      setLastAnalysis(fallbackAnalysis as any);
      setHasAnalysisResults(true);
      setShowCompleteBanner(true);
      onAnalysisComplete(fallbackAnalysis as any);
      setIsAnalyzing(false);
      setIsDrawing(false);
    }
  }, [map, onAnalysisComplete, clearDrawing]);
  END LEGACY CODE */

  // Zoom out to previous view
  const zoomOut = useCallback(() => {
    if (!map || !previousView) return;
    
    
    
    map.flyTo({
      center: previousView.center,
      zoom: previousView.zoom,
      duration: 1200,
      essential: true
    });
    
    setIsZoomedToSnip(false);
    setPreviousView(null);
  }, [map, previousView]);

  // Initialize layers
  useEffect(() => {
    if (!map) return;

    const initLayers = () => {
      
      
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
    
    if (!map) return;
    
    const handleResultClick = (e: mapboxgl.MapMouseEvent) => {
      // Check if we have analysis results
      if (!hasAnalysisResults || !lastAnalysis) {
        
        return;
      }
      
      // Check if click is on the rectangle
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['snip-rectangle-fill']
      });
      
      
      
      if (features.length > 0) {
        
        
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

    

    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      
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
      if (e.key === 'Escape') {
        if (isZoomedToSnip && previousView) {
          // If zoomed in, zoom out first
          zoomOut();
        } else {
          // Otherwise clear drawing
          clearDrawing();
        }
      }
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
  }, [map, isDrawing, updateRectangle, completeDrawing, clearDrawing, isZoomedToSnip, previousView, zoomOut]);

  // Handle programmatic trigger
  useEffect(() => {
    const handleTrigger = () => {
      
      startDrawing();
    };
    
    // Add to window for easy access
    (window as any).startSnipping = handleTrigger;
    
    return () => {
      delete (window as any).startSnipping;
    };
  }, [startDrawing]);

  // Quick success notification with persistent tooltip
  const showQuickHint = () => {
    // Show the persistent tooltip on the rectangle
    if (currentPolygon.current && map) {
      const bounds = turf.bbox(currentPolygon.current);
      const center = [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
      
      // Remove any existing tooltip first
      const existingTooltip = document.getElementById('snip-analysis-tooltip');
      if (existingTooltip) existingTooltip.remove();
      
      // Create a persistent tooltip that stays visible
      const tooltipEl = document.createElement('div');
      tooltipEl.id = 'snip-analysis-tooltip';
      tooltipEl.className = 'snip-tooltip';
      tooltipEl.style.cssText = `
        position: absolute;
        background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        pointer-events: auto;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        transition: all 0.2s ease;
      `;
      tooltipEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; font-weight: 600;">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span style="color: #06b6d4;">Analysis Complete</span>
        </div>
        <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">
          Click to view ocean intelligence report
        </div>
      `;
      
      // Add hover effect
      tooltipEl.addEventListener('mouseenter', () => {
        tooltipEl.style.transform = 'scale(1.05)';
        tooltipEl.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
      });
      
      tooltipEl.addEventListener('mouseleave', () => {
        tooltipEl.style.transform = 'scale(1)';
        tooltipEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      });
      
      // Click to open analysis
      tooltipEl.addEventListener('click', () => {
        if (lastAnalysis && onAnalysisComplete) {
          onAnalysisComplete(lastAnalysis);
        }
      });
      
      // Create a marker at the center of the rectangle
      const tooltipMarker = new mapboxgl.Marker({
        element: tooltipEl,
        anchor: 'bottom'
      })
        .setLngLat(center as [number, number])
        .addTo(map);
      
      // Store marker reference for cleanup
      (window as any).__snippingTooltip = tooltipMarker;
    }
    
    // Skip duplicate banner - we already have the tooltip
    
  };

  return (
    <>
      {/* Zoom Out Button - Only show when zoomed in */}
      {isZoomedToSnip && previousView && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={zoomOut}
            className="bg-slate-800/90 hover:bg-slate-700/90 text-white px-4 py-2 rounded-lg 
                     border border-slate-600 backdrop-blur-sm transition-all
                     flex items-center gap-2 shadow-lg"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
              <path d="M10 6L8 4L6 6M8 4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 8C3 5.239 5.239 3 8 3C10.761 3 13 5.239 13 8C13 10.761 10.761 13 8 13C5.239 13 3 10.761 3 8Z" 
                    stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Return to Overview
          </button>
        </div>
      )}
      
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
        {/* Completion banner removed - analysis modal handles notification */}
      
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