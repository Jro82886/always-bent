'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { searchGFWVesselsInArea } from '@/lib/services/gfw';

interface CommercialVesselLayerProps {
  map: mapboxgl.Map | null;
  showCommercial: boolean;
  bounds?: [number, number, number, number];
}

export default function CommercialVesselLayer({ 
  map, 
  showCommercial,
  bounds 
}: CommercialVesselLayerProps) {
  const commercialMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    if (!map || !showCommercial) {
      // Clear all commercial markers when hidden
      commercialMarkersRef.current.forEach(marker => marker.remove());
      commercialMarkersRef.current.clear();
      return;
    }

    const fetchAndDisplayCommercialVessels = async () => {
      // Throttle API calls - max once per 30 seconds
      const now = Date.now();
      if (now - lastFetchRef.current < 30000) return;
      lastFetchRef.current = now;

      // Get map bounds or use default East Coast area
      const mapBounds = bounds || map.getBounds();
      const boundsArray: [number, number, number, number] = bounds || [
        mapBounds.getWest(),
        mapBounds.getSouth(),
        mapBounds.getEast(),
        mapBounds.getNorth()
      ];

      // Get vessels from last 24 hours
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      try {
        const vessels = await searchGFWVesselsInArea(boundsArray, startDate, endDate);
        
        // Clear existing markers
        commercialMarkersRef.current.forEach(marker => marker.remove());
        commercialMarkersRef.current.clear();

        // Add new markers with ABFI branding
        vessels.forEach(vessel => {
          if (vessel.positions.length === 0) return;
          
          // Use most recent position
          const latestPosition = vessel.positions[vessel.positions.length - 1];
          
          // Create custom marker with ABFI branding overlay
          const el = document.createElement('div');
          el.className = 'commercial-vessel-marker';
          el.style.cssText = `
            position: relative;
            width: 32px;
            height: 32px;
            cursor: pointer;
          `;
          
          // Vessel type determines shape and color
          const vesselColor = vessel.type?.includes('Trawler') ? '#FF6B35' :
                            vessel.type?.includes('Longliner') ? '#FF8C42' :
                            vessel.type?.includes('Factory') ? '#DC143C' :
                            '#FFA500'; // Default orange
          
          el.innerHTML = `
            <!-- Commercial Vessel Icon -->
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: ${vessel.length && vessel.length > 100 ? '20px' : '16px'};
              height: ${vessel.length && vessel.length > 100 ? '20px' : '16px'};
              background: ${vesselColor};
              clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
              box-shadow: 0 0 10px ${vesselColor}66;
            "></div>
            
            <!-- ABFI Branding Badge -->
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              width: 16px;
              height: 16px;
              background: linear-gradient(135deg, #00DDEB, #0099CC);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              border: 1px solid rgba(255,255,255,0.3);
              font-size: 8px;
              font-weight: bold;
              color: white;
            ">GFW</div>
            
            <!-- Pulse effect for active vessels -->
            ${vessel.positions.length > 5 ? `
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 40px;
                height: 40px;
                border: 2px solid ${vesselColor}40;
                border-radius: 50%;
                animation: pulse-commercial 3s infinite;
              "></div>
            ` : ''}
          `;

          // Add animation styles if not already added
          if (!document.getElementById('commercial-vessel-animations')) {
            const style = document.createElement('style');
            style.id = 'commercial-vessel-animations';
            style.textContent = `
              @keyframes pulse-commercial {
                0% { 
                  transform: translate(-50%, -50%) scale(1); 
                  opacity: 0.6;
                }
                50% { 
                  transform: translate(-50%, -50%) scale(1.5); 
                  opacity: 0.2;
                }
                100% { 
                  transform: translate(-50%, -50%) scale(1); 
                  opacity: 0.6;
                }
              }
              .commercial-vessel-marker:hover {
                z-index: 1000 !important;
                filter: brightness(1.2);
              }
            `;
            document.head.appendChild(style);
          }

          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
          })
            .setLngLat([latestPosition.lon, latestPosition.lat])
            .setPopup(
              new mapboxgl.Popup({ 
                offset: 25,
                className: 'abfi-commercial-popup'
              }).setHTML(`
                <div style="padding: 8px; min-width: 200px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <div style="
                      width: 32px;
                      height: 32px;
                      background: linear-gradient(135deg, #00DDEB, #0099CC);
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 10px;
                      font-weight: bold;
                      color: white;
                    ">ABFI</div>
                    <div>
                      <div style="font-size: 10px; color: #888; text-transform: uppercase;">
                        Powered by GFW Data
                      </div>
                      <div style="font-weight: bold; color: #333;">
                        ${vessel.name || `MMSI: ${vessel.mmsi}`}
                      </div>
                    </div>
                  </div>
                  
                  <div style="border-top: 1px solid #eee; padding-top: 8px; font-size: 12px; color: #666;">
                    <div>Type: <span style="color: ${vesselColor}; font-weight: 500;">${vessel.type || 'Commercial'}</span></div>
                    ${vessel.flag ? `<div>Flag: ${vessel.flag}</div>` : ''}
                    ${vessel.length ? `<div>Length: ${Math.round(vessel.length)}m</div>` : ''}
                    ${latestPosition.speed ? `<div>Speed: ${latestPosition.speed.toFixed(1)} knots</div>` : ''}
                    <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #eee;">
                      <span style="font-size: 10px; color: #999;">
                        Last seen: ${new Date(latestPosition.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <div style="margin-top: 8px; padding: 4px; background: #f0f9ff; border-radius: 4px; text-align: center;">
                    <span style="font-size: 9px; color: #0099CC; text-transform: uppercase; letter-spacing: 0.5px;">
                      ABFI Intelligence Network
                    </span>
                  </div>
                </div>
              `)
            )
            .addTo(map);

          commercialMarkersRef.current.set(vessel.id, marker);
        });

        console.log(`[GFW] Displayed ${vessels.length} commercial vessels with ABFI branding`);
      } catch (error) {
        console.error('[GFW] Error fetching commercial vessels:', error);
      }
    };

    // Fetch immediately and then every 60 seconds
    fetchAndDisplayCommercialVessels();
    const interval = setInterval(fetchAndDisplayCommercialVessels, 60000);

    return () => {
      clearInterval(interval);
      commercialMarkersRef.current.forEach(marker => marker.remove());
      commercialMarkersRef.current.clear();
    };
  }, [map, showCommercial, bounds]);

  return null;
}
