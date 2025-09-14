'use client';

import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { generateMockFleet, updateVesselPositions, getVesselColor, Vessel } from '@/lib/mockFleet';
import { Ship, Anchor, Navigation, Activity } from 'lucide-react';

interface Props {
  map: mapboxgl.Map | null;
  inletId: string;
  enabled: boolean;
}

export default function VesselTracker({ map, inletId, enabled }: Props) {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [showFleetPanel, setShowFleetPanel] = useState(false);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize fleet when inlet changes
  useEffect(() => {
    if (!enabled || inletId === 'overview') {
      setVessels([]);
      return;
    }
    
    const fleet = generateMockFleet(inletId);
    setVessels(fleet);
  }, [inletId, enabled]);

  // Update vessel positions every 5 seconds
  useEffect(() => {
    if (!enabled || vessels.length === 0) return;
    
    updateIntervalRef.current = setInterval(() => {
      setVessels(prev => updateVesselPositions(prev));
    }, 5000);
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [enabled, vessels.length]);

  // Render vessels on map
  useEffect(() => {
    if (!map || !enabled) {
      // Clean up markers
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      return;
    }

    // Update or create markers for each vessel
    vessels.forEach(vessel => {
      let marker = markersRef.current[vessel.id];
      
      if (!marker) {
        // Create vessel marker element
        const el = document.createElement('div');
        el.className = 'vessel-marker';
        el.style.cssText = `
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        `;
        
        // Add vessel icon with rotation for heading
        const icon = document.createElement('div');
        icon.style.cssText = `
          width: 20px;
          height: 20px;
          background: ${getVesselColor(vessel)};
          border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transform: rotate(${vessel.heading}deg);
          transition: all 0.3s ease;
        `;
        
        // Add direction indicator
        const arrow = document.createElement('div');
        arrow.style.cssText = `
          position: absolute;
          top: -4px;
          width: 0;
          height: 0;
          border-left: 3px solid transparent;
          border-right: 3px solid transparent;
          border-bottom: 6px solid ${getVesselColor(vessel)};
        `;
        icon.appendChild(arrow);
        
        el.appendChild(icon);
        
        // Create marker
        marker = new mapboxgl.Marker(el)
          .setLngLat(vessel.position)
          .addTo(map);
        
        // Add click handler
        el.addEventListener('click', () => {
          setSelectedVessel(vessel);
        });
        
        markersRef.current[vessel.id] = marker;
      } else {
        // Update existing marker
        marker.setLngLat(vessel.position);
        const icon = marker.getElement().querySelector('div');
        if (icon) {
          icon.style.transform = `rotate(${vessel.heading}deg)`;
          icon.style.background = getVesselColor(vessel);
        }
      }
    });

    // Remove markers for vessels that no longer exist
    Object.keys(markersRef.current).forEach(id => {
      if (!vessels.find(v => v.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [map, vessels, enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Fleet Control Button */}
      <button
        onClick={() => setShowFleetPanel(!showFleetPanel)}
        className="absolute top-20 right-4 px-4 py-2 bg-black/70 backdrop-blur-md rounded-full text-cyan-300 text-xs font-medium border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors flex items-center gap-2"
      >
        <Ship size={14} />
        Fleet ({vessels.length})
      </button>

      {/* Fleet Panel */}
      {showFleetPanel && (
        <div className="absolute top-32 right-4 w-80 bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4 max-h-96 overflow-y-auto">
          <h3 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2">
            <Ship size={16} />
            Active Fleet
          </h3>
          <div className="space-y-2">
            {vessels.map(vessel => (
              <button
                key={vessel.id}
                onClick={() => {
                  setSelectedVessel(vessel);
                  if (map) {
                    map.flyTo({
                      center: vessel.position,
                      zoom: 12,
                      duration: 1000
                    });
                  }
                }}
                className="w-full p-2 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getVesselColor(vessel) }}
                    />
                    <span className="text-cyan-100 text-sm font-medium">
                      {vessel.name}
                    </span>
                  </div>
                  <span className="text-cyan-400 text-xs">
                    {vessel.speed.toFixed(1)} kts
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-cyan-300/60 text-xs">
                    {vessel.type}
                  </span>
                  <span className="text-cyan-300/60 text-xs flex items-center gap-1">
                    {vessel.status === 'anchored' && <Anchor size={10} />}
                    {vessel.status === 'fishing' && <Activity size={10} />}
                    {vessel.status === 'transit' && <Navigation size={10} />}
                    {vessel.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Vessel Details */}
      {selectedVessel && (
        <div className="absolute bottom-20 left-4 w-80 bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-cyan-300 font-semibold flex items-center gap-2">
              <Ship size={16} />
              {selectedVessel.name}
            </h3>
            <button
              onClick={() => setSelectedVessel(null)}
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-cyan-300/60">Type:</span>
              <span className="text-cyan-100">{selectedVessel.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-300/60">Status:</span>
              <span className="text-cyan-100 flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getVesselColor(selectedVessel) }}
                />
                {selectedVessel.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-300/60">Speed:</span>
              <span className="text-cyan-100">{selectedVessel.speed.toFixed(1)} knots</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-300/60">Heading:</span>
              <span className="text-cyan-100">{selectedVessel.heading.toFixed(0)}°</span>
            </div>
            {selectedVessel.captain && (
              <div className="flex justify-between">
                <span className="text-cyan-300/60">Captain:</span>
                <span className="text-cyan-100">{selectedVessel.captain}</span>
              </div>
            )}
            {selectedVessel.targetSpecies && (
              <div className="flex justify-between">
                <span className="text-cyan-300/60">Target:</span>
                <span className="text-cyan-100">{selectedVessel.targetSpecies}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-cyan-300/60">Last Update:</span>
              <span className="text-cyan-100">
                {new Date(selectedVessel.lastUpdate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
