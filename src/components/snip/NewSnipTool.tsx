'use client';
import { useCallback, useState, useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import RectDraw from './RectDraw';
import { SnipResult } from './types';
import { useAppStore } from '@/lib/store';
import type { SnipAnalysis } from '@/lib/analysis/types';

type Props = {
  map: mapboxgl.Map | null;
};

// Helper to fit bounds with smooth animation
async function fitBoundsToPolygon(map: mapboxgl.Map, polygon: GeoJSON.Polygon): Promise<void> {
  return new Promise((resolve) => {
    const coords = polygon.coordinates[0];
    const bounds = coords.reduce((bounds, coord) => {
      return bounds.extend(coord as [number, number]);
    }, new (window as any).mapboxgl.LngLatBounds(coords[0], coords[0]));

    map.once('moveend', () => {
      console.log('[NewSnipTool] Zoom complete');
      resolve();
    });

    map.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 100, right: 100 },
      duration: 1500,
    });
  });
}

export default function NewSnipTool({ map }: Props) {
  const [arm, setArm] = useState(false);
  
  // Get store actions
  const setAnalysis = useAppStore(s => s.setAnalysis);
  const resetAnalysisTransient = useAppStore(s => s.resetAnalysisTransient);
  const activeLayers = useAppStore(s => s.activeLayers);
  const myTracksEnabled = useAppStore(s => s.myTracksEnabled);
  const fleetTracksEnabled = useAppStore(s => s.fleetTracksEnabled);
  const gfwTracksEnabled = useAppStore(s => s.gfwTracksEnabled);

  const onStart = useCallback(() => {
    if (!map) {
      console.warn('[NewSnipTool] Map not ready');
      return;
    }
    console.log('[NewSnipTool] Starting draw mode');
    resetAnalysisTransient();
    setArm(true);
  }, [map, resetAnalysisTransient]);

  // Expose start function to window for external triggering
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_FLAG_NEW_SNIP === '1') {
      (window as any).startSnipping = onStart;
      console.log('[NewSnipTool] Exposed startSnipping to window');
      return () => {
        delete (window as any).startSnipping;
      };
    }
  }, [onStart]);

  const onCancel = useCallback(() => {
    console.log('[NewSnipTool] Drawing canceled');
    setArm(false);
    resetAnalysisTransient();
  }, [resetAnalysisTransient]);

  const onDone = useCallback(async (res: SnipResult) => {
    console.log('[NewSnipTool] Drawing complete:', res);
    
    // 1) Save pre-zoom camera
    const preZoomCamera = {
      center: map!.getCenter().toArray() as [number, number],
      zoom: map!.getZoom(),
      bearing: map!.getBearing(),
      pitch: map!.getPitch(),
    };

    // 2) Store the polygon info
    setAnalysis({
      preZoomCamera,
      lastSnipPolygon: res.polygon,
      lastSnipBBox: res.bbox,
      lastSnipCenter: res.center,
      isZoomingToSnip: true,
      showReviewCta: false,
      narrative: '',
      pendingAnalysis: null,
    });

    // 3) Zoom to selection
    await fitBoundsToPolygon(map!, res.polygon);

    // 4) Build minimal analysis scaffold
    const timeISO = new Date().toISOString();
    const toggles = {
      sst: !!activeLayers?.sst,
      chl: !!activeLayers?.chl,
      gfw: false, // GFW is disabled for now
      myTracks: myTracksEnabled,
      fleetTracks: fleetTracksEnabled,
      gfwTracks: gfwTracksEnabled,
    };

    // Create initial analysis object (data will be fetched when Review is clicked)
    const analysis: SnipAnalysis = {
      polygon: res.polygon,
      bbox: res.bbox,
      timeISO,
      sst: null,
      chl: null,
      gfw: null,
      toggles,
      notes: undefined,
    };

    // 5) Update state to show Review CTA
    setAnalysis({
      pendingAnalysis: analysis,
      isZoomingToSnip: false,
      showReviewCta: true,
    });

    setArm(false);
  }, [map, setAnalysis, activeLayers, myTracksEnabled, fleetTracksEnabled, gfwTracksEnabled]);

  if (!map) {
    return (
      <button
        disabled
        className="w-full px-4 py-3 rounded-md bg-gray-500/20 border border-gray-500/30 opacity-50 cursor-not-allowed"
      >
        Map loading...
      </button>
    );
  }

  return (
    <>
      <button
        data-snip-button
        onClick={onStart}
        disabled={arm}
        className={`
          w-full px-4 py-3 rounded-md shadow-lg transition-all
          ${arm 
            ? 'bg-emerald-500/30 border-emerald-500/50 animate-pulse cursor-wait' 
            : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 hover:shadow-cyan-500/20'
          }
        `}
        aria-label="Draw Analysis Area"
      >
        {arm ? 'Drawing...' : 'Draw Analysis Area'}
      </button>

      {arm && <RectDraw map={map} onDone={onDone} onCancel={onCancel} />}
    </>
  );
}
