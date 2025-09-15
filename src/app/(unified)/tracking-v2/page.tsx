'use client';

import React, { useEffect } from 'react';
import { useMapbox } from '@/lib/MapCtx';
import { modeManager } from '@/lib/modeManager';
import TrackingUI from '@/components/tracking/TrackingUI';
import { useAppState } from '@/store/appState';

export default function TrackingV2Page() {
  const map = useMapbox(); // Same map as Analysis!
  const { selectedInletId } = useAppState();
  
  // Vessel visibility states
  const [showUser, setShowUser] = React.useState(true);
  const [showFleet, setShowFleet] = React.useState(true);
  const [showCommercial, setShowCommercial] = React.useState(true);
  const [showTracks, setShowTracks] = React.useState(false);
  
  // Switch to tracking mode
  useEffect(() => {
    if (!map) return;
    
    console.log('[TrackingV2] Switching to tracking mode');
    modeManager.setMap(map);
    modeManager.switchMode('tracking');
    
    // Hide Analysis-specific layers
    const analysisLayers = [
      'sst-lyr', 
      'chl-lyr', 
      'snip-rectangle-fill', 
      'snip-rectangle-outline',
      'edge-lines',
      'hotspot-markers',
      // Polygon layers to hide
      'polygon-fills',
      'polygon-outlines',
      'polygon-labels',
      'ocean-polygons',
      'sst-polygons',
      'chl-polygons',
      'edge-polygons',
      'temperature-fronts',
      'chlorophyll-edges'
    ];
    
    analysisLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
    
    return () => {
      console.log('[TrackingV2] Leaving tracking mode');
      // ModeManager will restore Analysis state when going back
    };
  }, [map]);
  
  if (!map) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400">Loading vessel tracking...</div>
      </div>
    );
  }
  
  return (
    <>
      {/* Modern Tracking UI */}
      <TrackingUI 
        map={map} 
        showUser={showUser}
        showFleet={showFleet}
        showCommercial={showCommercial}
        showTracks={showTracks}
        setShowUser={setShowUser}
        setShowFleet={setShowFleet}
        setShowCommercial={setShowCommercial}
        setShowTracks={setShowTracks}
        selectedInlet={selectedInletId}
      />
    </>
  );
}
