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
    if (!map) return;
    
    // Ensure map is fully loaded before any marker operations
    if (!map.loaded()) {
      const handleLoad = () => {
        // Map is now loaded, re-run this effect
      };
      map.once('load', handleLoad);
      return;
    }
    
    if (!showCommercial) {
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

      // Get map bounds but restrict to East Coast 0-200 miles offshore
      let boundsArray: [number, number, number, number];
      
      if (bounds) {
        boundsArray = bounds;
      } else {
        try {
          const mapBounds = map.getBounds();
          if (!mapBounds) {
            // Default to East Coast area 0-200 miles offshore
            boundsArray = [-77, 25, -65, 45]; // Adjusted western boundary
          } else {
            // Constrain bounds to East Coast offshore area
            const west = Math.max(mapBounds.getWest(), -77); // Not further west than coast
            const east = Math.min(mapBounds.getEast(), -65);  // Not further east than 200mi
            const south = Math.max(mapBounds.getSouth(), 25); // Southern limit
            const north = Math.min(mapBounds.getNorth(), 45); // Northern limit
            
            boundsArray = [west, south, east, north];
          }
        } catch (error) {
          // If getBounds fails, use default East Coast offshore area
          boundsArray = [-77, 25, -65, 45];
        }
      }

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
          
          // FILTER: Only show trawlers, longliners, and drifting gear (no freight/cargo ships)
          const vesselType = vessel.type?.toLowerCase() || '';
          const allowedTypes = ['trawl', 'longliner', 'longline', 'drifting'];
          const isAllowedType = allowedTypes.some(type => vesselType.includes(type));
          
          // Skip if not one of our target vessel types
          if (!isAllowedType && vesselType !== 'commercial' && vesselType !== '') {
            return;
          }
          
          // Use most recent position
          const latestPosition = vessel.positions[vessel.positions.length - 1];
          
          // DISTANCE FILTER: Only show vessels 0-200 miles offshore
          // East Coast coastline reference points
          const coastlineLng = latestPosition.lat > 40 ? -74.0 : // NYC/Boston area
                              latestPosition.lat > 35 ? -75.5 :   // Virginia/NC area
                              latestPosition.lat > 30 ? -79.5 :   // Georgia/SC area
                              -80.0;                               // Florida area
          
          // Calculate approximate distance from shore (1 degree longitude ≈ 60 nautical miles at this latitude)
          const milesFromShore = Math.abs(latestPosition.lon - coastlineLng) * 60;
          
          // Skip if too close to shore (< 0 miles) or too far offshore (> 200 miles)
          if (milesFromShore > 200) {
            return; // Skip vessels beyond 200 mile limit
          }
          
          // Skip vessels that appear to be on land (west of coastline)
          if (latestPosition.lon > coastlineLng) {
            return; // Skip vessels on land
          }
          
          // Create custom marker with ABFI branding overlay
          const el = document.createElement('div');
          el.className = 'commercial-vessel-marker';
          el.style.position = 'relative';
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.cursor = 'pointer';
          
          // Color coding for vessel types
          const vesselColor = vesselType.includes('longliner') || vesselType.includes('longline') ? '#9B59B6' : // Purple for longliners
                            vesselType.includes('drifting') ? '#3498DB' : // Blue for drifting gear
                            vesselType.includes('trawl') ? '#FF6B35' :     // Orange for trawlers
                            '#95A5A6'; // Gray for unknown commercial
          
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

        
      } catch (error) {
        
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
