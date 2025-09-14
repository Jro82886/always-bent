'use client';

import { useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { getInletColor, INLET_COLORS } from '@/lib/inletColors';

interface SimpleVesselMarkersProps {
  map: mapboxgl.Map | null;
  selectedInlet: string;
}

// Mock vessel data for MVP
const mockVessels = {
  user: {
    id: 'user-vessel',
    name: 'Sea Hunter',
    position: [-75.6, 35.2],
    heading: 45,
    speed: 12
  },
  fleet: [
    { id: 'fleet-1', name: 'Reel Deal', position: [-75.58, 35.22], inlet: 'nc-hatteras' },
    { id: 'fleet-2', name: 'Blue Water', position: [-75.62, 35.18], inlet: 'nc-hatteras' },
    { id: 'fleet-3', name: 'Fish Finder', position: [-75.55, 35.25], inlet: 'nc-hatteras' },
    { id: 'fleet-4', name: 'Lucky Strike', position: [-75.65, 35.15], inlet: 'nc-hatteras' },
    { id: 'fleet-5', name: 'Wave Runner', position: [-75.57, 35.21], inlet: 'nc-hatteras' },
  ],
  commercial: [
    { id: 'gfw-1', name: 'F/V Enterprise', position: [-75.7, 35.3], type: 'Longliner' },
    { id: 'gfw-2', name: 'Lady Grace', position: [-75.5, 35.1], type: 'Trawler' },
    { id: 'gfw-3', name: 'Ocean Pride', position: [-75.8, 35.4], type: 'Seiner' },
  ]
};

export default function SimpleVesselMarkers({ map, selectedInlet }: SimpleVesselMarkersProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Get inlet color for fleet vessels
    const inletColor = getInletColor(selectedInlet);
    const inletGlow = INLET_COLORS[selectedInlet]?.glow || 'rgba(255,255,255,0.3)';

    // Add USER vessel (BRIGHT WITH PULSE)
    const userEl = document.createElement('div');
    userEl.className = 'vessel-marker user-vessel';
    userEl.innerHTML = `
      <div style="
        width: 14px;
        height: 14px;
        background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
        border: 1.5px solid rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        box-shadow: 
          0 0 20px rgba(255, 255, 255, 0.4),
          0 0 40px rgba(14, 165, 233, 0.3),
          inset 0 0 10px rgba(14, 165, 233, 0.2);
        animation: userPulse 2s ease-in-out infinite;
      "></div>
      <div style="
        position: absolute;
        top: -2px;
        left: -2px;
        width: 18px;
        height: 18px;
        border: 1px solid rgba(14, 165, 233, 0.3);
        border-radius: 50%;
        animation: userRipple 2s ease-out infinite;
      "></div>
    `;
    userEl.style.cssText = `
      position: relative;
      cursor: pointer;
      z-index: 100;
    `;

    // Add animations
    if (!document.getElementById('vessel-animations')) {
      const style = document.createElement('style');
      style.id = 'vessel-animations';
      style.textContent = `
        @keyframes userPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.9; }
        }
        @keyframes userRipple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes fleetGlow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    const userMarker = new (window as any).mapboxgl.Marker({
      element: userEl,
      anchor: 'center'
    })
      .setLngLat(mockVessels.user.position)
      .setPopup(new (window as any).mapboxgl.Popup({ 
        offset: 25,
        className: 'vessel-popup'
      })
        .setHTML(`
          <div style="
            padding: 10px;
            background: linear-gradient(135deg, #1e293b, #0f172a);
            border-radius: 8px;
            border: 1px solid rgba(14, 165, 233, 0.3);
          ">
            <strong style="color: #0ea5e9; font-size: 12px; letter-spacing: 1px;">YOUR VESSEL</strong><br/>
            <span style="color: #f1f5f9; font-size: 14px;">${mockVessels.user.name}</span><br/>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
              <span style="color: #94a3b8; font-size: 11px;">
                Speed: <span style="color: #0ea5e9;">${mockVessels.user.speed} kts</span><br/>
                Heading: <span style="color: #0ea5e9;">${mockVessels.user.heading}°</span>
              </span>
            </div>
          </div>
        `))
      .addTo(map);
    
    markersRef.current.push(userMarker);

    // Add FLEET vessels (INLET COLOR WITH SUBTLE GLOW)
    mockVessels.fleet.forEach((vessel, index) => {
      if (vessel.inlet === selectedInlet) {
        const fleetEl = document.createElement('div');
        fleetEl.className = 'vessel-marker fleet-vessel';
        fleetEl.innerHTML = `
          <div style="
            width: 10px;
            height: 10px;
            background: radial-gradient(circle at 30% 30%, ${inletColor}ee, ${inletColor}aa);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            box-shadow: 
              0 0 15px ${inletGlow},
              inset 0 0 5px rgba(0, 0, 0, 0.2);
            animation: fleetGlow 3s ease-in-out infinite;
            animation-delay: ${index * 0.2}s;
          "></div>
        `;
        fleetEl.style.cssText = `
          cursor: pointer;
          z-index: 50;
        `;

        const fleetMarker = new (window as any).mapboxgl.Marker({
          element: fleetEl,
          anchor: 'center'
        })
          .setLngLat(vessel.position)
          .setPopup(new (window as any).mapboxgl.Popup({ 
            offset: 20,
            className: 'vessel-popup'
          })
            .setHTML(`
              <div style="
                padding: 10px;
                background: linear-gradient(135deg, #1e293b, #0f172a);
                border-radius: 8px;
                border: 1px solid ${inletColor}66;
              ">
                <strong style="color: ${inletColor}; font-size: 12px; letter-spacing: 1px;">FLEET VESSEL</strong><br/>
                <span style="color: #f1f5f9; font-size: 14px;">${vessel.name}</span><br/>
                <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
                  <span style="color: #94a3b8; font-size: 11px;">
                    Inlet: <span style="color: ${inletColor};">${selectedInlet.replace('nc-', '').toUpperCase()}</span>
                  </span>
                </div>
              </div>
            `))
          .addTo(map);
        
        markersRef.current.push(fleetMarker);
      }
    });

    // Add COMMERCIAL vessels (ORANGE - Small Triangles)
    mockVessels.commercial.forEach(vessel => {
      const commercialEl = document.createElement('div');
      commercialEl.className = 'vessel-marker commercial-vessel';
      commercialEl.style.cssText = `
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 8px solid #f39c12;
        filter: drop-shadow(0 0 5px rgba(243, 156, 18, 0.6));
        cursor: pointer;
        z-index: 30;
      `;

      const commercialMarker = new (window as any).mapboxgl.Marker({
        element: commercialEl,
        anchor: 'center'
      })
        .setLngLat(vessel.position)
        .setPopup(new (window as any).mapboxgl.Popup({ offset: 20 })
          .setHTML(`
            <div style="padding: 8px;">
              <strong style="color: #f39c12;">COMMERCIAL</strong><br/>
              ${vessel.name}<br/>
              <span style="color: #999; font-size: 11px;">
                Type: ${vessel.type}
              </span>
            </div>
          `))
        .addTo(map);
      
      markersRef.current.push(commercialMarker);
    });

    // Add vessel tracks (optional - can be toggled)
    if (map.getSource('vessel-tracks')) {
      map.removeSource('vessel-tracks');
    }

    // Cleanup function
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [map, selectedInlet]);

  return null;
}
