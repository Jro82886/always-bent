'use client';

import { useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { useTrackingStore } from '@/lib/tracking/trackingStore';

interface TrackingMapLayerProps {
  map: mapboxgl.Map;
}

/**
 * Handles all map rendering for the tracking system
 * - User vessel marker
 * - Fleet vessels
 * - Commercial AIS vessels
 * - Tracking trails
 */
export default function TrackingMapLayer({ map }: TrackingMapLayerProps) {
  const { 
    isTracking, 
    userVessel, 
    nearbyVessels, 
    userTrail,
    mode,
    updateNearbyVessels 
  } = useTrackingStore();
  
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const vesselMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const trailSourceRef = useRef<boolean>(false);

  // Create user vessel marker
  useEffect(() => {
    if (!map || !userVessel) return;

    if (!userMarkerRef.current) {
      // Create custom boat marker
      const el = document.createElement('div');
      el.className = 'user-vessel-marker';
      el.innerHTML = `
        <div style="position: relative; width: 40px; height: 40px;">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent);
            animation: vessel-pulse 2s ease-out infinite;
          "></div>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
          ">
            <path d="M16 4L8 20H24L16 4Z" fill="#3b82f6" stroke="#1e40af" stroke-width="1"/>
            <circle cx="16" cy="12" r="2" fill="#ffffff"/>
          </svg>
        </div>
      `;

      userMarkerRef.current = new (window as any).mapboxgl.Marker({
        element: el,
        anchor: 'center',
        rotationAlignment: 'map'
      })
        .setLngLat([userVessel.lng, userVessel.lat])
        .addTo(map);
    } else {
      // Update position and rotation
      userMarkerRef.current
        .setLngLat([userVessel.lng, userVessel.lat])
        .setRotation(userVessel.heading);
    }
  }, [map, userVessel]);

  // Render tracking trail
  useEffect(() => {
    if (!map || userTrail.length < 2) return;

    const coordinates = userTrail.map(p => [p.lng, p.lat]);

    if (!trailSourceRef.current) {
      // Create trail source and layer
      map.addSource('user-trail', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates
          }
        }
      });

      map.addLayer({
        id: 'user-trail-line',
        type: 'line',
        source: 'user-trail',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-opacity': 0.6
        }
      });

      trailSourceRef.current = true;
    } else {
      // Update trail
      const source = map.getSource('user-trail') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates
          }
        });
      }
    }
  }, [map, userTrail]);

  // Simulate nearby vessels based on mode
  useEffect(() => {
    if (!map || !isTracking || !userVessel) return;

    // Generate mock vessels based on mode
    const mockVessels = [];
    
    if (mode === 'commercial') {
      // Simulate AIS commercial vessels
      for (let i = 0; i < 5; i++) {
        mockVessels.push({
          id: `ais-${i}`,
          name: ['MSC Oscar', 'Ever Given', 'CMA CGM Marco Polo', 'OOCL Hong Kong', 'Madrid Maersk'][i],
          type: 'commercial',
          lat: userVessel.lat + (Math.random() - 0.5) * 0.1,
          lng: userVessel.lng + (Math.random() - 0.5) * 0.1,
          speed: 10 + Math.random() * 10,
          heading: Math.random() * 360,
          timestamp: new Date()
        });
      }
    } else if (mode === 'fleet') {
      // Simulate fleet vessels
      for (let i = 0; i < 3; i++) {
        mockVessels.push({
          id: `fleet-${i}`,
          name: ['Sea Hunter', 'Wave Runner', 'Ocean Spirit'][i],
          type: 'fleet',
          lat: userVessel.lat + (Math.random() - 0.5) * 0.05,
          lng: userVessel.lng + (Math.random() - 0.5) * 0.05,
          speed: 5 + Math.random() * 10,
          heading: Math.random() * 360,
          timestamp: new Date()
        });
      }
    } else {
      // Individual mode - show nearby recreational vessels
      for (let i = 0; i < 2; i++) {
        mockVessels.push({
          id: `nearby-${i}`,
          name: ['Blue Marlin', 'Reel Deal'][i],
          type: 'recreational',
          lat: userVessel.lat + (Math.random() - 0.5) * 0.03,
          lng: userVessel.lng + (Math.random() - 0.5) * 0.03,
          speed: 3 + Math.random() * 7,
          heading: Math.random() * 360,
          timestamp: new Date()
        });
      }
    }

    updateNearbyVessels(mockVessels);

    // Render vessel markers
    mockVessels.forEach(vessel => {
      let marker = vesselMarkersRef.current.get(vessel.id);
      
      if (!marker) {
        // Create new marker
        const el = document.createElement('div');
        const color = vessel.type === 'commercial' ? '#3b82f6' : 
                     vessel.type === 'fleet' ? '#10b981' : '#06b6d4';
        
        el.innerHTML = `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: radial-gradient(circle, ${color}40, transparent);
              animation: vessel-pulse 3s ease-out infinite;
            "></div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 8px;
              height: 8px;
              background: ${color};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 0 10px ${color}80;
            "></div>
          </div>
        `;

        marker = new (window as any).mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([vessel.lng, vessel.lat])
          .setPopup(
            new (window as any).mapboxgl.Popup({ offset: 15 })
              .setHTML(`
                <div style="padding: 6px;">
                  <div style="font-weight: bold; color: ${color}; font-size: 12px;">${vessel.name}</div>
                  <div style="font-size: 10px; color: #666; margin-top: 2px;">
                    ${vessel.type === 'commercial' ? 'Commercial Vessel' : 
                      vessel.type === 'fleet' ? 'Fleet Vessel' : 'Recreational'}
                    <br/>Speed: ${vessel.speed.toFixed(1)} kts
                    <br/>Heading: ${vessel.heading.toFixed(0)}°
                  </div>
                </div>
              `)
          )
          .addTo(map);
        
        vesselMarkersRef.current.set(vessel.id, marker);
      } else {
        // Update existing marker
        marker.setLngLat([vessel.lng, vessel.lat]);
      }
    });

    // Clean up old markers
    vesselMarkersRef.current.forEach((marker, id) => {
      if (!mockVessels.find(v => v.id === id)) {
        marker.remove();
        vesselMarkersRef.current.delete(id);
      }
    });

  }, [map, isTracking, userVessel, mode]);

  // Cleanup on unmount or when tracking stops
  useEffect(() => {
    if (!isTracking) {
      // Remove all vessel markers
      vesselMarkersRef.current.forEach(marker => marker.remove());
      vesselMarkersRef.current.clear();
    }
  }, [isTracking]);

  // Add CSS animations if not already present
  useEffect(() => {
    if (!document.querySelector('#vessel-animations')) {
      const style = document.createElement('style');
      style.id = 'vessel-animations';
      style.textContent = `
        @keyframes vessel-pulse {
          0% {
            width: 24px;
            height: 24px;
            opacity: 0.6;
          }
          100% {
            width: 48px;
            height: 48px;
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return null; // This component only manages map side effects
}
