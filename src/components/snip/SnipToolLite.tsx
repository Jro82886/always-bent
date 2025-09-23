'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';
import type { SnipAnalysis } from '@/lib/analysis/types';

type SnipState = 'idle' | 'arming' | 'drawing' | 'zooming' | 'ready' | 'analyzing' | 'reviewing';

type Props = {
  map: mapboxgl.Map;
  onOpenAnalysis: (analysis: SnipAnalysis) => void;
  getToggles: () => { 
    sst: boolean; 
    chl: boolean; 
    gfw: boolean; 
    myTracks: boolean; 
    fleetTracks: boolean; 
    gfwTracks: boolean;
  };
};

export default function SnipToolLite({ map, onOpenAnalysis, getToggles }: Props) {
  const [snip, setSnip] = useState<{
    state: SnipState;
    polygon?: GeoJSON.Polygon;
    bbox?: [number, number, number, number];
    center?: { lat: number; lon: number };
    preCam?: { center: [number, number]; zoom: number; bearing: number; pitch: number };
  }>({ state: 'idle' });

  const startPoint = useRef<[number, number] | null>(null);
  const isDrawing = useRef(false);

  // Freeze/unfreeze gestures
  const freezeGestures = useCallback(() => {
    if (!map) return;
    console.log('[SnipLite] Freezing gestures');
    map.dragPan.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
    map.doubleClickZoom.disable();
    map.keyboard.disable();
    map.getCanvas().style.cursor = 'crosshair';
  }, [map]);

  const unfreezeGestures = useCallback(() => {
    if (!map) return;
    console.log('[SnipLite] Unfreezing gestures');
    map.dragPan.enable();
    map.scrollZoom.enable();
    map.boxZoom.enable();
    map.dragRotate.enable();
    map.doubleClickZoom.enable();
    map.keyboard.enable();
    map.getCanvas().style.cursor = '';
  }, [map]);

  // Draw outline
  const drawOutline = useCallback((p1: [number, number], p2: [number, number]) => {
    if (!map) return;
    
    const srcId = 'ab-snip-outline';
    const lyrId = 'ab-snip-outline-layer';
    
    // Create bbox
    const minX = Math.min(p1[0], p2[0]);
    const maxX = Math.max(p1[0], p2[0]);
    const minY = Math.min(p1[1], p2[1]);
    const maxY = Math.max(p1[1], p2[1]);
    
    const polygon: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [[
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY]
      ]]
    };
    
    const data: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: polygon,
        properties: {}
      }]
    };
    
    // Add or update source
    if (!map.getSource(srcId)) {
      map.addSource(srcId, { type: 'geojson', data });
      map.addLayer({
        id: lyrId,
        type: 'line',
        source: srcId,
        paint: {
          'line-color': '#22e1a7',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });
      map.addLayer({
        id: lyrId + '-fill',
        type: 'fill',
        source: srcId,
        paint: {
          'fill-color': '#22e1a7',
          'fill-opacity': 0.1
        }
      }, lyrId);
    } else {
      (map.getSource(srcId) as mapboxgl.GeoJSONSource).setData(data);
    }
    
    return { 
      polygon, 
      bbox: [minX, minY, maxX, maxY] as [number, number, number, number],
      center: { lat: (minY + maxY) / 2, lon: (minX + maxX) / 2 }
    };
  }, [map]);

  // Clear outline
  const clearOutline = useCallback(() => {
    if (!map) return;
    const srcId = 'ab-snip-outline';
    const lyrId = 'ab-snip-outline-layer';
    
    try {
      if (map.getLayer(lyrId + '-fill')) map.removeLayer(lyrId + '-fill');
      if (map.getLayer(lyrId)) map.removeLayer(lyrId);
      if (map.getSource(srcId)) map.removeSource(srcId);
    } catch (e) {
      // Ignore cleanup errors
    }
  }, [map]);

  // Arm the tool
  const arm = useCallback(() => {
    if (!map || snip.state !== 'idle') return;
    console.log('[SnipLite] Arming');
    
    freezeGestures();
    setSnip({ state: 'arming' });
  }, [map, snip.state, freezeGestures]);

  // Handle drawing
  useEffect(() => {
    if (!map || snip.state !== 'arming') return;

    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      e.preventDefault();
      const point = e.lngLat.toArray() as [number, number];
      startPoint.current = point;
      isDrawing.current = true;
      setSnip(prev => ({ ...prev, state: 'drawing' }));
      console.log('[SnipLite] Drawing started at', point);
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawing.current || !startPoint.current) return;
      e.preventDefault();
      const endPoint = e.lngLat.toArray() as [number, number];
      drawOutline(startPoint.current, endPoint);
    };

    const handleMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawing.current || !startPoint.current) return;
      e.preventDefault();
      
      const endPoint = e.lngLat.toArray() as [number, number];
      const result = drawOutline(startPoint.current, endPoint);
      
      if (!result) return;
      
      // Check if box is big enough
      const dx = Math.abs(endPoint[0] - startPoint.current[0]);
      const dy = Math.abs(endPoint[1] - startPoint.current[1]);
      
      if (dx < 0.0001 || dy < 0.0001) {
        console.log('[SnipLite] Box too small, canceling');
        clearOutline();
        unfreezeGestures();
        setSnip({ state: 'idle' });
        return;
      }
      
      // Save pre-zoom camera
      const preCam = {
        center: map.getCenter().toArray() as [number, number],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
      };
      
      console.log('[SnipLite] Drawing complete, zooming to bbox');
      isDrawing.current = false;
      
      // Start zoom
      setSnip({
        state: 'zooming',
        polygon: result.polygon,
        bbox: result.bbox,
        center: result.center,
        preCam
      });
      
      // Fit bounds
      const bounds = new (window as any).mapboxgl.LngLatBounds(
        [result.bbox[0], result.bbox[1]],
        [result.bbox[2], result.bbox[3]]
      );
      
      map.once('moveend', () => {
        console.log('[SnipLite] Zoom complete, ready for review');
        unfreezeGestures();
        setSnip(prev => ({ ...prev, state: 'ready' }));
      });
      
      map.fitBounds(bounds, {
        padding: 48,
        duration: 850
      });
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[SnipLite] Canceled via ESC');
        clearOutline();
        unfreezeGestures();
        setSnip({ state: 'idle' });
      }
    };

    // Add listeners
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
  }, [map, snip.state, drawOutline, clearOutline, freezeGestures, unfreezeGestures]);

  // Handle Review click
  const handleReview = useCallback(async () => {
    if (snip.state !== 'ready' || !snip.polygon || !snip.bbox || !snip.center) return;
    
    console.log('[SnipLite] Starting analysis');
    setSnip(prev => ({ ...prev, state: 'analyzing' }));
    
    const toggles = getToggles();
    const tasks: Promise<any>[] = [];
    
    // Import sampler
    const { sample } = await import('@/lib/analysis/sampler');
    
    // Sample toggled layers
    if (toggles.sst) {
      tasks.push(sample('sst', snip.polygon).catch(e => {
        console.error('[SnipLite] SST sample failed:', e);
        return null;
      }));
    }
    if (toggles.chl) {
      tasks.push(sample('chl', snip.polygon).catch(e => {
        console.error('[SnipLite] CHL sample failed:', e);
        return null;
      }));
    }
    
    // GFW stub for now
    tasks.push(Promise.resolve({ 
      counts: { longliner: 0, drifting_longline: 0, trawler: 0, events: 0 } 
    }));
    
    const results = await Promise.allSettled(tasks);
    
    // Extract results
    let sstData = null, chlData = null, gfwData = null;
    let idx = 0;
    if (toggles.sst) {
      const r = results[idx++];
      if (r.status === 'fulfilled') sstData = r.value;
    }
    if (toggles.chl) {
      const r = results[idx++];
      if (r.status === 'fulfilled') chlData = r.value;
    }
    const gfwResult = results[idx];
    if (gfwResult.status === 'fulfilled') gfwData = gfwResult.value;
    
    // Build analysis
    const analysis: SnipAnalysis = {
      polygon: snip.polygon,
      bbox: snip.bbox,
      timeISO: new Date().toISOString(),
      sst: sstData,
      chl: chlData,
      wind: null,
      swell: null,
      presence: null,
      toggles,
      polygonMeta: {
        bbox: snip.bbox,
        area_sq_km: calculateArea(snip.bbox),
        centroid: snip.center
      },
      obtainedVia: 'snip'
    };
    
    // Build narrative
    const { buildNarrative } = await import('@/lib/analysis/narrative-lite');
    analysis.narrative = buildNarrative(analysis);
    
    console.log('[SnipLite] Analysis complete, opening modal');
    setSnip(prev => ({ ...prev, state: 'reviewing' }));
    onOpenAnalysis(analysis);
  }, [snip, getToggles, onOpenAnalysis]);

  // Calculate rough area
  const calculateArea = (bbox: [number, number, number, number]): number => {
    const [west, south, east, north] = bbox;
    const latKm = 111; // km per degree latitude
    const lonKm = 111 * Math.cos((south + north) / 2 * Math.PI / 180);
    return Math.abs((east - west) * lonKm * (north - south) * latKm);
  };

  // Handle Done/Cancel
  const handleDone = useCallback(() => {
    console.log('[SnipLite] Done, restoring camera');
    clearOutline();
    
    // Restore camera if we have it
    if (snip.preCam) {
      map.easeTo({
        center: snip.preCam.center,
        zoom: snip.preCam.zoom,
        bearing: snip.preCam.bearing,
        pitch: snip.preCam.pitch,
        duration: 800
      });
    }
    
    setSnip({ state: 'idle' });
  }, [map, snip.preCam, clearOutline]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'S' && snip.state === 'idle') {
        e.preventDefault();
        arm();
      }
    };
    
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [snip.state, arm]);

  // Expose arm function to parent
  useEffect(() => {
    (window as any).armSnipTool = arm;
    return () => {
      delete (window as any).armSnipTool;
    };
  }, [arm]);

  return (
    <>
      {/* Draw button */}
      {snip.state === 'idle' && (
        <button
          data-snip-button
          onClick={arm}
          className="w-full px-4 py-3 rounded-md bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 shadow-lg transition-all hover:scale-[1.02]"
          style={{ zIndex: 999999, pointerEvents: 'auto', isolation: 'isolate' }}
        >
          Draw Analysis Area
        </button>
      )}
      
      {/* Status indicator */}
      {snip.state === 'arming' && (
        <div className="text-cyan-400 text-sm animate-pulse">
          Click and drag to draw area...
        </div>
      )}
      
      {snip.state === 'drawing' && (
        <div className="text-cyan-400 text-sm">
          Release to complete
        </div>
      )}
      
      {snip.state === 'zooming' && (
        <div className="text-cyan-400 text-sm animate-pulse">
          Zooming to selection...
        </div>
      )}
      
      {/* Review CTA */}
      {snip.state === 'ready' && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[999999] animate-slide-up">
          <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 shadow-2xl">
            <button
              onClick={handleReview}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-md shadow-lg transition-all hover:scale-[1.02]"
            >
              Review Analysis
            </button>
            <button
              onClick={handleDone}
              className="ml-3 px-4 py-3 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {snip.state === 'analyzing' && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[999999]">
          <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4">
            <div className="text-cyan-400 animate-pulse">Analyzing area...</div>
          </div>
        </div>
      )}
    </>
  );
}
