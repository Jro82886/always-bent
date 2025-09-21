'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { getInletById } from '@/lib/inlets';
import { showToast } from '@/components/ui/Toast';

interface CommercialVesselLayerProps {
  map: mapboxgl.Map | null;
  showCommercial: boolean;
  showTracks: boolean;
  selectedInletId: string;
  onVesselCountsUpdate?: (counts: {
    longliner: number;
    drifting_longline: number;
    trawler: number;
    fishing_events: number;
  }) => void;
}

interface CommercialVessel {
  id: string;
  name: string;
  type: 'longliner' | 'drifting_longline' | 'trawler' | 'unknown';
  flag: string;
  length: number | null;
  positions: Array<{
    lat: number;
    lng: number;
    timestamp: string;
    speed?: number;
    course?: number;
  }>;
  fishingEvents?: Array<{
    start: string;
    end: string;
    lat?: number;
    lng?: number;
  }>;
}

export default function CommercialVesselLayer({ 
  map, 
  showCommercial,
  showTracks,
  selectedInletId,
  onVesselCountsUpdate
}: CommercialVesselLayerProps) {
  const commercialMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [vessels, setVessels] = useState<CommercialVessel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);

  // Fetch commercial vessels when inlet changes or layer is shown
  useEffect(() => {
    if (!map || !showCommercial || !selectedInletId || selectedInletId === 'overview') {
      setVessels([]);
      // Reset counts when hidden
      if (onVesselCountsUpdate) {
        onVesselCountsUpdate({
          longliner: 0,
          drifting_longline: 0,
          trawler: 0,
          fishing_events: 0
        });
      }
      return;
    }

    const fetchCommercialVessels = async () => {
      // Throttle API calls - max once per 5 minutes per inlet
      const now = Date.now();
      const cacheKey = `gfw-fetch-${selectedInletId}`;
      const lastFetch = lastFetchRef.current;
      
      if (lastFetch && now - lastFetch < 300000) return; // 5 minutes
      lastFetchRef.current = now;

      setIsLoading(true);
      
      try {
        // Get inlet bounds
        const inlet = getInletById(selectedInletId);
        if (!inlet) return;

        // Calculate bbox with some padding
        const padding = 1.0; // degrees
        const bbox = [
          inlet.lng! - padding,
          inlet.lat! - padding,
          inlet.lng! + padding,
          inlet.lat! + padding
        ].join(',');

        const response = await fetch(`/api/gfw/vessels?bbox=${bbox}&inletId=${selectedInletId}&days=7`);
        const data = await response.json();
        
        if (!response.ok) {
          // Handle specific error cases
          if (data.message === 'GFW server down, try back later') {
            console.error('GFW server is down');
            showToast({
              type: 'error',
              title: 'Vessel Tracking Unavailable',
              message: 'GFW server is down. Please try again later.',
              duration: 7000
            });
          } else if (data.message === 'Vessel tracking service not available') {
            console.error('GFW API not configured');
            showToast({
              type: 'warning',
              title: 'Commercial Vessels Unavailable',
              message: 'Vessel tracking service is not configured.',
              duration: 7000
            });
          }
          setVessels([]);
          setIsLoading(false);
          return;
        }
        
        const vesselsFound = data.vessels || [];
        setVessels(vesselsFound);
        
        // Calculate vessel counts
        const counts = {
          longliner: 0,
          drifting_longline: 0,
          trawler: 0,
          fishing_events: 0
        };
        
        vesselsFound.forEach((vessel: CommercialVessel) => {
          if (vessel.type === 'longliner') counts.longliner++;
          else if (vessel.type === 'drifting_longline') counts.drifting_longline++;
          else if (vessel.type === 'trawler') counts.trawler++;
          
          // Count fishing events
          if (vessel.fishingEvents && vessel.fishingEvents.length > 0) {
            counts.fishing_events += vessel.fishingEvents.length;
          }
        });
        
        // Report counts to parent
        if (onVesselCountsUpdate) {
          onVesselCountsUpdate(counts);
        }
        
        // Show info toast if no vessels found
        if (vesselsFound.length === 0 && showCommercial) {
          showToast({
            type: 'info',
            title: 'No Commercial Vessels',
            message: 'No commercial vessels detected in this area.',
            duration: 5000
          });
        }
      } catch (error) {
        console.error('Error fetching commercial vessels:', error);
        setVessels([]);
      } finally {
        setIsLoading(false);
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
      
      // Style based on vessel type - distinct colors
      const colors = {
        longliner: '#FF6B6B', // coral red
        drifting_longline: '#4ECDC4', // turquoise
        trawler: '#45B7D1', // ocean blue
        unknown: '#95A5A6' // gray
      };
      
      const color = colors[vessel.type] || '#666';
      
      el.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          ${vessel.type === 'longliner' ? `
            <!-- Longliner: Hook and line icon -->
            <path d="M12 2v10m0 0c0 2-2 4-4 4s-4-2-4-4 2-4 4-4m4 4c0 2 2 4 4 4s4-2 4-4-2-4-4-4" 
              stroke="${color}" stroke-width="2" fill="none"/>
            <circle cx="12" cy="12" r="2" fill="${color}"/>
          ` : vessel.type === 'drifting_longline' ? `
            <!-- Drifting longline: Wavy line with hooks -->
            <path d="M3 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" 
              stroke="${color}" stroke-width="2" fill="none"/>
            <circle cx="6" cy="16" r="1.5" fill="${color}"/>
            <circle cx="12" cy="16" r="1.5" fill="${color}"/>
            <circle cx="18" cy="16" r="1.5" fill="${color}"/>
          ` : vessel.type === 'trawler' ? `
            <!-- Trawler: Net icon -->
            <path d="M12 3v6l-4 4v5h8v-5l-4-4V3" 
              stroke="${color}" stroke-width="2" fill="${color}" opacity="0.3"/>
            <path d="M8 18c0 1.5 1.8 3 4 3s4-1.5 4-3" 
              stroke="${color}" stroke-width="2" fill="none"/>
          ` : `
            <!-- Unknown: Simple boat -->
            <path d="M5 17L12 7l7 10M5 17h14" 
              stroke="${color}" stroke-width="2" fill="${color}" opacity="0.3"/>
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
    }).filter(feature => feature !== null) as GeoJSON.Feature[];

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