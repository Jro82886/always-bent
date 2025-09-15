'use client';

import React, { useEffect } from 'react';
import { useMapbox } from '@/lib/MapCtx';
import TrackingUI from '@/components/tracking/TrackingUI';

export default function TrackingNewPage() {
  const map = useMapbox();
  const [showUser, setShowUser] = React.useState(true);
  const [showFleet, setShowFleet] = React.useState(true);
  const [showCommercial, setShowCommercial] = React.useState(true);
  const [showTracks, setShowTracks] = React.useState(false);
  
  useEffect(() => {
    if (!map) return;
    
    // Hide Analysis layers when entering tracking
    const analysisLayers = ['sst-lyr', 'chl-lyr', 'snip-rectangle-fill', 'snip-rectangle-outline'];
    analysisLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
    
    return () => {
      // Layers will be restored by their own toggles when going back
    };
  }, [map]);
  
  if (!map) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400">Loading tracking...</div>
      </div>
    );
  }
  
  return (
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
    />
  );
}
