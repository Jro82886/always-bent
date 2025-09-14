'use client';

import { useState, useEffect } from 'react';
import { MapShell } from '@/lib/MapRef';
import { useMapbox } from '@/lib/MapCtx';
import NavTabs from '@/components/NavTabs';
import TopHUD from '@/components/TopHUD';
import SimpleVesselMarkers from '@/components/tracking/SimpleVesselMarkers';
import MapLegend from '@/components/MapLegend';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import { flyToInlet60nm } from '@/lib/inletBounds';

export default function TrackingPage() {
  const map = useMapbox();
  const { selectedInletId } = useAppState();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Vessel visibility states
  const [showUser, setShowUser] = useState(true);
  const [showFleet, setShowFleet] = useState(true);
  const [showCommercial, setShowCommercial] = useState(true);
  const [showTracks, setShowTracks] = useState(false);

  // Get user's saved location from welcome screen
  useEffect(() => {
    const savedLocation = localStorage.getItem('abfi_last_location');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setUserLocation(location);
        console.log('Found saved location:', location);
      } catch (e) {
        console.log('No saved location found');
      }
    }
  }, []);

  // Watch for inlet changes and fly to selected inlet
  useEffect(() => {
    if (!map || !selectedInletId) return;
    
    const inlet = getInletById(selectedInletId);
    if (inlet) {
      flyToInlet60nm(map, inlet);
      console.log(`[TRACKING] Flying to inlet: ${inlet.name}`);
    }
  }, [map, selectedInletId]);

  return (
    <MapShell>
      <NavTabs />
      <TopHUD includeAbfi={false} />
      
      {/* Vessel Markers */}
      {map && (
        <SimpleVesselMarkers 
          map={map}
          showUser={showUser}
          showFleet={showFleet}
          showCommercial={showCommercial}
          showTracks={showTracks}
        />
      )}
      
      {/* Right-side Control Panel */}
      <div className="absolute top-24 right-4 z-40 space-y-3">
        {/* Vessel Controls */}
        <div className="bg-black/40 backdrop-blur-md rounded-lg p-3 space-y-2 border border-white/10">
          <h3 className="text-xs font-medium text-white/70 uppercase tracking-wider mb-2">Vessel Display</h3>
          
          {/* User Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-white/80 group-hover:text-white transition-colors">You</span>
            <input
              type="checkbox"
              checked={showUser}
              onChange={(e) => setShowUser(e.target.checked)}
              className="sr-only"
            />
            <div className={`relative w-10 h-5 rounded-full transition-colors ${
              showUser ? 'bg-cyan-400/30' : 'bg-white/10'
            }`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                showUser ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </label>
          
          {/* Fleet Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-white/80 group-hover:text-white transition-colors">Fleet</span>
            <input
              type="checkbox"
              checked={showFleet}
              onChange={(e) => setShowFleet(e.target.checked)}
              className="sr-only"
            />
            <div className={`relative w-10 h-5 rounded-full transition-colors ${
              showFleet ? 'bg-cyan-400/30' : 'bg-white/10'
            }`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                showFleet ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </label>
          
          {/* Commercial Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-white/80 group-hover:text-white transition-colors">Commercial</span>
            <input
              type="checkbox"
              checked={showCommercial}
              onChange={(e) => setShowCommercial(e.target.checked)}
              className="sr-only"
            />
            <div className={`relative w-10 h-5 rounded-full transition-colors ${
              showCommercial ? 'bg-cyan-400/30' : 'bg-white/10'
            }`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                showCommercial ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </label>
          
          {/* Tracks Toggle */}
          <div className="border-t border-white/10 pt-2 mt-2">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-white/80 group-hover:text-white transition-colors">Show Tracks</span>
              <input
                type="checkbox"
                checked={showTracks}
                onChange={(e) => setShowTracks(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-10 h-5 rounded-full transition-colors ${
                showTracks ? 'bg-cyan-400/30' : 'bg-white/10'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  showTracks ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </label>
          </div>
        </div>
        
        {/* Vessel Info Panel */}
        <div className="bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/10">
          <h3 className="text-xs font-medium text-white/70 uppercase tracking-wider mb-2">Vessel Info</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-white/60">Total Vessels:</span>
              <span className="text-white/90 font-medium">24</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Fleet Active:</span>
              <span className="text-cyan-400 font-medium">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Commercial:</span>
              <span className="text-orange-400 font-medium">8</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Compact Legend - Upper right corner */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40">
        <MapLegend 
          mode="tracking"
          showUser={showUser}
          showFleet={showFleet}
          showCommercial={showCommercial}
          showTracks={showTracks}
        />
      </div>
    </MapShell>
  );
}