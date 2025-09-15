'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import { flyToInlet60nm } from '@/lib/inletBounds';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import NavTabs from '@/components/NavTabs';
import TrackingUI from '@/components/tracking/TrackingUI';

// Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function TrackingPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { selectedInletId } = useAppState();
  
  // Vessel visibility states
  const [showUser, setShowUser] = useState(true);
  const [showFleet, setShowFleet] = useState(true);
  const [showCommercial, setShowCommercial] = useState(true);
  const [showTracks, setShowTracks] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize clean map for tracking
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Get initial inlet or default
    const inlet = selectedInletId ? getInletById(selectedInletId) : getInletById('fl-jupiter');
    
    // Create a CLEAN map instance - dark style, no layers
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Clean dark basemap
      center: inlet?.center || [-80.0730, 26.9480],
      zoom: inlet?.zoom || 8.3,
      pitch: 0,
      bearing: 0
    });

    map.current = mapInstance;

    // When map loads, ensure it's clean and add vessels
    mapInstance.on('load', () => {
      console.log('[TRACKING] Clean map loaded');
      setMapLoaded(true);
      
      // Add navigation control
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // ENSURE NO OCEAN LAYERS - Remove any that might exist
      const layersToRemove = [
        'sst-lyr', 'chl-lyr', 'sst-polygons', 'chl-polygons',
        'polygon-fills', 'polygon-outlines', 'polygon-labels',
        'ocean-polygons', 'edge-polygons', 'temperature-fronts',
        'chlorophyll-edges', 'edge-lines', 'hotspot-markers',
        'sst-features', 'chl-features', 'abfi-polygons'
      ];
      
      layersToRemove.forEach(layerId => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.removeLayer(layerId);
          console.log(`[TRACKING] Removed layer: ${layerId}`);
        }
      });

      // Add mock vessels
      addMockVessels(mapInstance);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle inlet changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedInletId) return;
    
    const inlet = getInletById(selectedInletId);
    if (inlet) {
      flyToInlet60nm(map.current, inlet);
      console.log(`[TRACKING] Flying to inlet: ${inlet.name}`);
      
      // Update vessel positions for this inlet
      updateVesselPositions(map.current, inlet);
    }
  }, [selectedInletId, mapLoaded]);

  // Add mock vessels to map
  function addMockVessels(mapInstance: mapboxgl.Map) {
    // Clear any existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(m => m.remove());

    // Mock vessel data (positioned around Jupiter Inlet by default)
    const vessels = [
      { id: 'user', lat: 26.9, lng: -79.8, type: 'user', name: 'My Vessel' },
      { id: 'fleet1', lat: 26.85, lng: -79.75, type: 'fleet', name: 'Reel Deal' },
      { id: 'fleet2', lat: 26.95, lng: -79.85, type: 'fleet', name: 'Sea Hunter' },
      { id: 'fleet3', lat: 26.88, lng: -79.9, type: 'fleet', name: 'Lucky Strike' },
      { id: 'commercial1', lat: 26.92, lng: -79.7, type: 'commercial', name: 'Commercial 1' },
      { id: 'commercial2', lat: 26.8, lng: -79.82, type: 'commercial', name: 'Commercial 2' }
    ];

    vessels.forEach(vessel => {
      const el = document.createElement('div');
      el.className = `vessel-marker vessel-${vessel.type}`;
      el.setAttribute('data-vessel-id', vessel.id);
      
      // Style based on vessel type
      if (vessel.type === 'user') {
        el.style.cssText = 'width: 20px; height: 20px; background: white; border-radius: 50%; box-shadow: 0 0 20px rgba(255,255,255,0.8); cursor: pointer;';
        
        // Add pulsing animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulse {
            0% { box-shadow: 0 0 20px rgba(255,255,255,0.8); }
            50% { box-shadow: 0 0 30px rgba(255,255,255,1); }
            100% { box-shadow: 0 0 20px rgba(255,255,255,0.8); }
          }
          .vessel-user { animation: pulse 2s infinite; }
        `;
        if (!document.head.querySelector('style[data-vessels]')) {
          style.setAttribute('data-vessels', 'true');
          document.head.appendChild(style);
        }
      } else if (vessel.type === 'fleet') {
        el.style.cssText = 'width: 16px; height: 16px; background: #06b6d4; border-radius: 50%; box-shadow: 0 0 15px rgba(6,182,212,0.6); cursor: pointer;';
      } else {
        el.style.cssText = 'width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 16px solid #f97316; filter: drop-shadow(0 0 5px rgba(249,115,22,0.5)); cursor: pointer;';
      }

      // Create marker with popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setText(vessel.name);

      new mapboxgl.Marker(el)
        .setLngLat([vessel.lng, vessel.lat])
        .setPopup(popup)
        .addTo(mapInstance);
    });

    console.log('[TRACKING] Added mock vessels to clean map');
  }

  // Update vessel positions when inlet changes
  function updateVesselPositions(mapInstance: mapboxgl.Map, inlet: any) {
    // Remove existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(m => m.remove());

    // Generate new positions around the selected inlet
    const [centerLng, centerLat] = inlet.center;
    
    const vessels = [
      { id: 'user', lat: centerLat + 0.05, lng: centerLng + 0.3, type: 'user', name: 'My Vessel' },
      { id: 'fleet1', lat: centerLat - 0.05, lng: centerLng + 0.25, type: 'fleet', name: 'Reel Deal' },
      { id: 'fleet2', lat: centerLat + 0.1, lng: centerLng + 0.35, type: 'fleet', name: 'Sea Hunter' },
      { id: 'fleet3', lat: centerLat, lng: centerLng + 0.4, type: 'fleet', name: 'Lucky Strike' },
      { id: 'commercial1', lat: centerLat + 0.02, lng: centerLng + 0.2, type: 'commercial', name: 'Commercial 1' },
      { id: 'commercial2', lat: centerLat - 0.08, lng: centerLng + 0.32, type: 'commercial', name: 'Commercial 2' }
    ];

    vessels.forEach(vessel => {
      // Only add if vessel type is shown
      if (
        (vessel.type === 'user' && !showUser) ||
        (vessel.type === 'fleet' && !showFleet) ||
        (vessel.type === 'commercial' && !showCommercial)
      ) {
        return;
      }

      const el = document.createElement('div');
      el.className = `vessel-marker vessel-${vessel.type}`;
      
      if (vessel.type === 'user') {
        el.style.cssText = 'width: 20px; height: 20px; background: white; border-radius: 50%; box-shadow: 0 0 20px rgba(255,255,255,0.8); animation: pulse 2s infinite; cursor: pointer;';
      } else if (vessel.type === 'fleet') {
        el.style.cssText = 'width: 16px; height: 16px; background: #06b6d4; border-radius: 50%; box-shadow: 0 0 15px rgba(6,182,212,0.6); cursor: pointer;';
      } else {
        el.style.cssText = 'width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 16px solid #f97316; filter: drop-shadow(0 0 5px rgba(249,115,22,0.5)); cursor: pointer;';
      }

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setText(vessel.name);

      new mapboxgl.Marker(el)
        .setLngLat([vessel.lng, vessel.lat])
        .setPopup(popup)
        .addTo(mapInstance);
    });
  }

  // Handle vessel visibility toggles
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const inlet = selectedInletId ? getInletById(selectedInletId) : getInletById('fl-jupiter');
    if (inlet) {
      updateVesselPositions(map.current, inlet);
    }
  }, [showUser, showFleet, showCommercial, mapLoaded]);

  // Get inlet name for display
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;

  return (
    <div className="relative w-full h-screen">
      {/* Navigation */}
      <NavTabs />
      
      {/* Clean Map Container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full"
        style={{ background: '#0a0a0a' }}
      />
      
      {/* Tracking UI Overlay */}
      {mapLoaded && (
        <TrackingUI 
          map={map.current}
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
      
      {/* Debug indicator - shows map is clean */}
      <div className="absolute bottom-4 right-4 z-50 bg-green-500/20 border border-green-500 rounded px-2 py-1">
        <span className="text-xs text-green-400">Clean Tracking Map Active</span>
      </div>
    </div>
  );
}