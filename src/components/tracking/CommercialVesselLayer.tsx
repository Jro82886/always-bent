'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { getInletById } from '@/lib/inlets';

interface CommercialVesselLayerProps {
  map: mapboxgl.Map | null;
  showCommercial: boolean;
  showTracks: boolean;
  selectedInletId: string;
}

interface CommercialVessel {
  id: string;
  name: string;
  type: 'longliner' | 'trawler' | 'driftnetter';
  flag: string;
  length: number | null;
  positions: Array<{
    lat: number;
    lng: number;
    timestamp: string;
    speed?: number;
    course?: number;
  }>;
}

export default function CommercialVesselLayer({ 
  map, 
  showCommercial,
  showTracks,
  selectedInletId
}: CommercialVesselLayerProps) {
  const commercialMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [vessels, setVessels] = useState<CommercialVessel[]>([]);
  const lastFetchRef = useRef<number>(0);

  // Fetch commercial vessels when inlet changes or layer is shown
  useEffect(() => {
    if (!map || !showCommercial || !selectedInletId || selectedInletId === 'overview') {
      setVessels([]);
      return;
    }

    const fetchCommercialVessels = async () => {
      // Throttle API calls - max once per 5 minutes per inlet
      const now = Date.now();
      const cacheKey = `gfw-fetch-${selectedInletId}`;
      const lastFetch = lastFetchRef.current;
      
      if (lastFetch && now - lastFetch < 300000) return; // 5 minutes
      lastFetchRef.current = now;

      try {
        // Get inlet bounds
        const inlet = getInletById(selectedInletId);
        if (!inlet) return;

        // Calculate bbox with some padding
        const padding = 1.0; // degrees
        const bbox = [
          inlet.lng - padding,
          inlet.lat - padding,
          inlet.lng + padding,
          inlet.lat + padding
        ].join(',');

        const response = await fetch(`/api/gfw/vessels?bbox=${bbox}&inletId=${selectedInletId}&days=4`);
        if (!response.ok) throw new Error('Failed to fetch commercial vessels');
        
        const data = await response.json();
        setVessels(data.vessels || []);
      } catch (error) {
        console.error('Error fetching commercial vessels:', error);
        setVessels([]);
      }
    };

    fetchCommercialVessels();
  }, [map, showCommercial, selectedInletId]);

  // Update vessel markers
  useEffect(() => {
    if (!map || !showCommercial) {
      // Clear all markers when hidden
      commercialMarkersRef.current.forEach(marker => marker.remove());
      commercialMarkersRef.current.clear();
      return;
    }

    // Clear existing markers
    commercialMarkersRef.current.forEach(marker => marker.remove());
    commercialMarkersRef.current.clear();

    // Add markers for each vessel
    vessels.forEach(vessel => {
      if (!vessel.positions || vessel.positions.length === 0) return;
      
      // Use most recent position
      const latestPos = vessel.positions[vessel.positions.length - 1];
      
      // Create custom icon based on vessel type
      const el = document.createElement('div');
      el.className = 'commercial-vessel-marker';
      
      // Style based on vessel type
      const colors = {
        longliner: '#ff9500', // orange
        trawler: '#ffeb3b', // yellow
        driftnetter: '#9c27b0' // purple
      };
      
      const color = colors[vessel.type] || '#666';
      
      el.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          ${vessel.type === 'longliner' ? `
            <path d="M12 2L4 7V12C4 16.5 7 20.26 12 21C17 20.26 20 16.5 20 12V7L12 2Z" 
              stroke="${color}" stroke-width="2" fill="${color}" opacity="0.3"/>
            <path d="M12 2L4 7V12C4 16.5 7 20.26 12 21C17 20.26 20 16.5 20 12V7L12 2Z" 
              stroke="${color}" stroke-width="2" fill="none"/>
          ` : vessel.type === 'trawler' ? `
            <rect x="4" y="8" width="16" height="8" rx="2" 
              stroke="${color}" stroke-width="2" fill="${color}" opacity="0.3"/>
            <rect x="4" y="8" width="16" height="8" rx="2" 
              stroke="${color}" stroke-width="2" fill="none"/>
          ` : `
            <circle cx="12" cy="12" r="8" 
              stroke="${color}" stroke-width="2" fill="${color}" opacity="0.3"/>
            <circle cx="12" cy="12" r="8" 
              stroke="${color}" stroke-width="2" fill="none"/>
          `}
        </svg>
      `;
      
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([latestPos.lng, latestPos.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div style="padding: 8px;">
            <strong>${vessel.name}</strong><br/>
            <span style="font-size: 12px; color: #666;">
              ${vessel.type.charAt(0).toUpperCase() + vessel.type.slice(1)}<br/>
              ${vessel.flag} • ${vessel.length ? vessel.length + 'm' : 'Unknown length'}<br/>
              ${latestPos.speed ? `${latestPos.speed.toFixed(1)} kts` : ''}
            </span>
          </div>
        `))
        .addTo(map);
        
      commercialMarkersRef.current.set(vessel.id, marker);
    });
  }, [map, showCommercial, vessels]);

  // Handle track rendering
  useEffect(() => {
    if (!map || !showTracks || vessels.length === 0) {
      // Remove tracks if they exist
      if (map?.getLayer('commercial-tracks')) {
        map.removeLayer('commercial-tracks');
      }
      if (map?.getSource('commercial-tracks')) {
        map.removeSource('commercial-tracks');
      }
      return;
    }

    // Build GeoJSON for all vessel tracks
    const trackFeatures = vessels.map(vessel => {
      if (!vessel.positions || vessel.positions.length < 2) return null;
      
      return {
        type: 'Feature' as const,
        properties: {
          vesselId: vessel.id,
          vesselType: vessel.type,
          vesselName: vessel.name
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: vessel.positions.map(pos => [pos.lng, pos.lat])
        }
      };
    }).filter(Boolean);

    const trackData = {
      type: 'FeatureCollection' as const,
      features: trackFeatures
    };

    // Add or update source
    if (map.getSource('commercial-tracks')) {
      (map.getSource('commercial-tracks') as mapboxgl.GeoJSONSource).setData(trackData);
    } else {
      map.addSource('commercial-tracks', {
        type: 'geojson',
        data: trackData
      });
    }

    // Add layer if it doesn't exist
    if (!map.getLayer('commercial-tracks')) {
      map.addLayer({
        id: 'commercial-tracks',
        type: 'line',
        source: 'commercial-tracks',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#888',
          'line-width': 2,
          'line-dasharray': [2, 2] // Dashed line
        }
      });
    }
  }, [map, showTracks, vessels]);

  return null;
}