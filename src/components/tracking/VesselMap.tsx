'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapbox } from '@/lib/MapCtx';

interface VesselData {
  id: string;
  name: string;
  type: 'fishing' | 'cargo' | 'tanker' | 'passenger' | 'recreational';
  position: [number, number];
  heading: number;
  speed: number;
  status: 'active' | 'anchored' | 'fishing' | 'distress';
  lastUpdate: Date;
  captain?: string;
  mmsi?: string;
  imo?: string;
  destination?: string;
  eta?: Date;
  draft?: number;
  length?: number;
}

interface VesselMapProps {
  mode: 'individual' | 'fleet' | 'commercial';
  showTrails?: boolean;
  selectedVesselId?: string;
  onVesselSelect?: (vessel: VesselData) => void;
}

export default function VesselMap({ mode, showTrails, selectedVesselId, onVesselSelect }: VesselMapProps) {
  const map = useMapbox();
  const [vessels, setVessels] = useState<VesselData[]>([]);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const trailsRef = useRef<{ [key: string]: [number, number][] }>({});

  // Generate mock vessel data based on mode
  useEffect(() => {
    if (!map) return;

    const generateVessels = () => {
      const baseVessels: VesselData[] = [];
      
      if (mode === 'individual') {
        // Generate nearby recreational vessels
        for (let i = 0; i < 8; i++) {
          baseVessels.push({
            id: `rec-${i}`,
            name: ['Ocean Spirit', 'Blue Wave', 'Sea Hunter', 'Wind Dancer', 'Tide Runner', 'Wave Rider', 'Sea Fox', 'Storm Chaser'][i],
            type: 'recreational',
            position: [
              -74.0 + (Math.random() - 0.5) * 0.2,
              40.7 + (Math.random() - 0.5) * 0.2
            ],
            heading: Math.random() * 360,
            speed: 5 + Math.random() * 10,
            status: Math.random() > 0.3 ? 'active' : 'anchored',
            lastUpdate: new Date(),
            captain: ['John Smith', 'Mary Johnson', 'Bob Wilson', 'Sarah Davis'][Math.floor(Math.random() * 4)]
          });
        }
      } else if (mode === 'fleet') {
        // Generate fleet vessels
        for (let i = 0; i < 24; i++) {
          const isActive = i < 18;
          const isFishing = isActive && i < 6;
          baseVessels.push({
            id: `fleet-${i}`,
            name: `FV ${['Thunder', 'Lightning', 'Storm', 'Wave Runner', 'Sea Fox', 'Ocean Pride', 'Blue Horizon', 'Tide Master'][i % 8]} ${Math.floor(i / 8) + 1}`,
            type: 'fishing',
            position: [
              -74.0 + (Math.random() - 0.5) * 0.5,
              40.7 + (Math.random() - 0.5) * 0.5
            ],
            heading: Math.random() * 360,
            speed: isActive ? (isFishing ? 2 + Math.random() * 3 : 8 + Math.random() * 4) : 0,
            status: isFishing ? 'fishing' : (isActive ? 'active' : 'anchored'),
            lastUpdate: new Date(),
            captain: `Captain ${['Smith', 'Johnson', 'Williams', 'Brown'][i % 4]}`
          });
        }
      } else {
        // Generate commercial vessels
        const types: VesselData['type'][] = ['cargo', 'tanker', 'passenger', 'fishing'];
        for (let i = 0; i < 156; i++) {
          const type = types[Math.floor(Math.random() * types.length)];
          baseVessels.push({
            id: `commercial-${i}`,
            name: `${type === 'cargo' ? 'MV' : type === 'tanker' ? 'MT' : 'MS'} ${['Atlantic', 'Pacific', 'Indian', 'Arctic'][i % 4]} ${['Carrier', 'Dream', 'Star', 'Express'][Math.floor(i / 4) % 4]}`,
            type,
            position: [
              -74.0 + (Math.random() - 0.5) * 1.0,
              40.7 + (Math.random() - 0.5) * 1.0
            ],
            heading: Math.random() * 360,
            speed: 12 + Math.random() * 8,
            status: 'active',
            lastUpdate: new Date(),
            mmsi: `${200000000 + i * 1000}`,
            imo: `${9000000 + i * 12345}`,
            destination: ['New York', 'Boston', 'Philadelphia', 'Baltimore'][i % 4],
            eta: new Date(Date.now() + Math.random() * 86400000),
            draft: 8 + Math.random() * 4,
            length: 150 + Math.random() * 200
          });
        }
      }
      
      return baseVessels;
    };

    setVessels(generateVessels());
  }, [mode, map]);

  // Update vessel positions
  useEffect(() => {
    const interval = setInterval(() => {
      setVessels(prev => prev.map(vessel => {
        if (vessel.status === 'anchored') return vessel;
        
        // Update position based on heading and speed
        const distance = (vessel.speed / 3600) * 5; // 5 second update in nautical miles
        const bearing = (vessel.heading * Math.PI) / 180;
        
        const newLat = vessel.position[1] + (distance * Math.cos(bearing)) / 60;
        const newLng = vessel.position[0] + (distance * Math.sin(bearing)) / (60 * Math.cos(vessel.position[1] * Math.PI / 180));
        
        // Update trails
        if (showTrails) {
          if (!trailsRef.current[vessel.id]) {
            trailsRef.current[vessel.id] = [];
          }
          trailsRef.current[vessel.id].push([newLng, newLat]);
          // Keep only last 50 points
          if (trailsRef.current[vessel.id].length > 50) {
            trailsRef.current[vessel.id].shift();
          }
        }
        
        return {
          ...vessel,
          position: [newLng, newLat] as [number, number],
          heading: vessel.heading + (Math.random() - 0.5) * 5, // Small heading changes
          speed: Math.max(0, vessel.speed + (Math.random() - 0.5) * 0.5),
          lastUpdate: new Date()
        };
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [showTrails]);

  // Render vessels on map
  useEffect(() => {
    if (!map) return;

    // Add vessel trails layer if needed
    if (showTrails && !map.getSource('vessel-trails')) {
      map.addSource('vessel-trails', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'vessel-trails',
        type: 'line',
        source: 'vessel-trails',
        paint: {
          'line-color': [
            'match',
            ['get', 'status'],
            'fishing', '#10b981',
            'active', '#06b6d4',
            'anchored', '#6b7280',
            '#06b6d4'
          ],
          'line-width': 2,
          'line-opacity': 0.6
        }
      });
    }

    // Update trails
    if (showTrails && map.getSource('vessel-trails')) {
      const features = Object.entries(trailsRef.current).map(([id, trail]) => {
        const vessel = vessels.find(v => v.id === id);
        if (!vessel || trail.length < 2) return null;
        
        return {
          type: 'Feature' as const,
          properties: {
            id,
            status: vessel.status
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: trail
          }
        };
      }).filter(Boolean);

      (map.getSource('vessel-trails') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: features as any
      });
    }

    // Update vessel markers
    vessels.forEach(vessel => {
      let marker = markersRef.current[vessel.id];
      
      if (!marker) {
        // Create vessel marker
        const el = document.createElement('div');
        el.className = 'vessel-marker';
        el.style.cssText = `
          width: 32px;
          height: 32px;
          cursor: pointer;
          position: relative;
        `;
        
        // Vessel icon container
        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = `
          width: 100%;
          height: 100%;
          position: relative;
          transform: rotate(${vessel.heading}deg);
          transition: transform 0.5s ease;
        `;
        
        // Vessel body
        const vesselBody = document.createElement('div');
        vesselBody.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 24px;
          background: ${getVesselColor(vessel)};
          border-radius: 50% 50% 40% 40%;
          border: 2px solid rgba(0,0,0,0.3);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        
        // Direction indicator
        const directionIndicator = document.createElement('div');
        directionIndicator.style.cssText = `
          position: absolute;
          top: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 8px solid ${getVesselColor(vessel)};
        `;
        
        iconContainer.appendChild(vesselBody);
        iconContainer.appendChild(directionIndicator);
        el.appendChild(iconContainer);
        
        // Add selection ring
        if (vessel.id === selectedVesselId) {
          const ring = document.createElement('div');
          ring.style.cssText = `
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            border: 2px solid #06b6d4;
            border-radius: 50%;
            animation: pulse 2s infinite;
          `;
          el.appendChild(ring);
        }
        
        marker = new mapboxgl.Marker(el)
          .setLngLat(vessel.position)
          .addTo(map);
        
        el.addEventListener('click', () => {
          onVesselSelect?.(vessel);
        });
        
        markersRef.current[vessel.id] = marker;
      } else {
        // Update existing marker
        marker.setLngLat(vessel.position);
        const iconContainer = marker.getElement().querySelector('div');
        if (iconContainer) {
          iconContainer.style.transform = `rotate(${vessel.heading}deg)`;
        }
      }
    });

    // Clean up old markers
    Object.keys(markersRef.current).forEach(id => {
      if (!vessels.find(v => v.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [map, vessels, selectedVesselId, onVesselSelect, showTrails]);

  return null;
}

function getVesselColor(vessel: VesselData): string {
  if (vessel.status === 'distress') return '#ef4444';
  if (vessel.status === 'anchored') return '#6b7280';
  if (vessel.status === 'fishing') return '#10b981';
  
  switch (vessel.type) {
    case 'fishing': return '#06b6d4';
    case 'cargo': return '#8b5cf6';
    case 'tanker': return '#f59e0b';
    case 'passenger': return '#ec4899';
    case 'recreational': return '#3b82f6';
    default: return '#06b6d4';
  }
}
