'use client';

import { useMapbox } from '@/lib/MapCtx';
import { useAppState } from '@/store/appState';
import TrackingUI from '@/components/tracking/TrackingUI';
import { useEffect, useState } from 'react';
import { getInletById } from '@/lib/inlets';
import { flyToInlet60nm } from '@/lib/inletBounds';
import { MapShell } from '@/lib/MapRef';

export default function TrackingPage() {
  const map = useMapbox();
  const { selectedInletId } = useAppState();
  
  // Vessel visibility states for TrackingUI
  const [showUser, setShowUser] = useState(true);
  const [showFleet, setShowFleet] = useState(true);
  const [showCommercial, setShowCommercial] = useState(true);
  const [showTracks, setShowTracks] = useState(false);
  
  // Fly to selected inlet when it changes
  useEffect(() => {
    if (!map || !selectedInletId) return;
    
    const inlet = getInletById(selectedInletId);
    if (inlet) {
      flyToInlet60nm(map, inlet);
      console.log(`[TRACKING] Flying to inlet: ${inlet.name}`);
    }
  }, [map, selectedInletId]);

  // Get inlet name for the legend
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;

  return (
    <MapShell>
      {/* Use our beautiful TrackingUI component with the enhanced legend! */}
      {map && (
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
          selectedInletName={inlet?.name || 'No Inlet Selected'}
        />
      )}
    </MapShell>
  );
}