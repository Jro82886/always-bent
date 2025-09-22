'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { 
  fetchOnlineVessels, 
  fetchVesselTrail,
  onlineVesselsToGeoJSON,
  vesselTrailToGeoJSON,
  type OnlineVessel 
} from '@/lib/fleet/fleetDataService';

interface FleetLayerProps {
  map: mapboxgl.Map | null;
  showFleet: boolean;
  showFleetTracks: boolean;
  selectedInletId: string;
  onFleetUpdate?: (vessels: OnlineVessel[]) => void;
}

export default function FleetLayer({
  map,
  showFleet,
  showFleetTracks,
  selectedInletId,
  onFleetUpdate
}: FleetLayerProps) {
  const [onlineVessels, setOnlineVessels] = useState<OnlineVessel[]>([]);
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const isPollingPaused = useRef(false);
  
  // Poll for online vessels
  useEffect(() => {
    if (!showFleet || !selectedInletId || selectedInletId === 'overview') {
      setOnlineVessels([]);
      if (onFleetUpdate) onFleetUpdate([]);
      return;
    }
    
    const pollVessels = async () => {
      if (isPollingPaused.current) return;
      
      const vessels = await fetchOnlineVessels(selectedInletId);
      setOnlineVessels(vessels);
      if (onFleetUpdate) onFleetUpdate(vessels);
    };
    
    // Initial fetch
    pollVessels();
    
    // Set up polling every 30 seconds
    pollingInterval.current = setInterval(pollVessels, 30000);
    
    // Pause polling when tab is hidden
    const handleVisibilityChange = () => {
      isPollingPaused.current = document.hidden;
      if (!document.hidden) {
        pollVessels(); // Fetch immediately when tab becomes visible
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showFleet, selectedInletId, onFleetUpdate]);
  
  // Update map layers
  useEffect(() => {
    if (!map || !showFleet) {
      // Clean up layers
      if (map) {
        if (map.getLayer('fleet-vessels')) map.removeLayer('fleet-vessels');
        if (map.getLayer('fleet-vessels-badge')) map.removeLayer('fleet-vessels-badge');
        if (map.getSource('fleet-vessels')) map.removeSource('fleet-vessels');
      }
      return;
    }
    
    const geojson = onlineVesselsToGeoJSON(onlineVessels);
    
    // Add or update source
    const source = map.getSource('fleet-vessels') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geojson);
    } else {
      map.addSource('fleet-vessels', {
        type: 'geojson',
        data: geojson
      });
      
      // Add vessel dots layer
      map.addLayer({
        id: 'fleet-vessels',
        type: 'circle',
        source: 'fleet-vessels',
        paint: {
          'circle-radius': 8,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.8
        }
      });
      
      // Add report badge layer
      map.addLayer({
        id: 'fleet-vessels-badge',
        type: 'circle',
        source: 'fleet-vessels',
        filter: ['==', ['get', 'has_report'], true],
        paint: {
          'circle-radius': 4,
          'circle-color': '#FFD700', // Yellow for report badge
          'circle-translate': [8, -8],
          'circle-translate-anchor': 'viewport'
        }
      });
      
      // Click handler for vessels
      map.on('click', 'fleet-vessels', (e) => {
        if (!e.features?.length) return;
        
        const feature = e.features[0];
        const props = feature.properties;
        
        let popupContent = `
          <div style="padding: 8px; min-width: 200px;">
            <strong>${props.name}</strong><br/>
            <div style="margin: 4px 0; color: #666;">
              ${props.speed ? `${Math.round(props.speed)} kt` : '--'} · 
              ${props.heading ? `${Math.round(props.heading)}°` : '--'}
            </div>
            <small style="opacity: 0.7">
              Last seen: ${new Date(props.last_seen).toLocaleTimeString()}
            </small>
        `;
        
        if (props.has_report && props.latest_report) {
          const report = JSON.parse(props.latest_report);
          popupContent += `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
              <div style="font-size: 12px; color: #FFD700; font-weight: bold;">
                Recent ${report.type === 'bite' ? 'Bite' : 'Snip'} Report
              </div>
              <div style="font-size: 11px; margin: 4px 0;">
                ${report.species?.length ? report.species.join(', ') : 'No species specified'}
              </div>
              <a href="/legendary/community/reports?reportId=${report.id}" 
                 style="display: inline-block; margin-top: 4px; padding: 4px 8px; 
                        background: #FFD700; color: #000; border-radius: 4px; 
                        text-decoration: none; font-size: 11px; font-weight: bold;">
                Open Report
              </a>
            </div>
          `;
        }
        
        if (showFleetTracks) {
          popupContent += `
            <div style="margin-top: 8px;">
              <button onclick="window.dispatchEvent(new CustomEvent('selectVessel', {detail: '${props.id}'}))"
                      style="padding: 4px 8px; background: #0ea5e9; color: white; 
                             border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                Show Track
              </button>
            </div>
          `;
        }
        
        popupContent += '</div>';
        
        new mapboxgl.Popup({ offset: 12, maxWidth: '250px' })
          .setLngLat((feature.geometry as any).coordinates)
          .setHTML(popupContent)
          .addTo(map);
      });
      
      // Cursor change on hover
      map.on('mouseenter', 'fleet-vessels', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      
      map.on('mouseleave', 'fleet-vessels', () => {
        map.getCanvas().style.cursor = '';
      });
    }
  }, [map, showFleet, onlineVessels, showFleetTracks]);
  
  // Handle vessel selection for tracks
  useEffect(() => {
    const handleSelectVessel = (e: CustomEvent) => {
      setSelectedVesselId(e.detail);
    };
    
    window.addEventListener('selectVessel' as any, handleSelectVessel);
    
    return () => {
      window.removeEventListener('selectVessel' as any, handleSelectVessel);
    };
  }, []);
  
  // Fetch and display vessel trail
  useEffect(() => {
    if (!map || !showFleetTracks || !selectedVesselId) {
      // Clean up trail layer
      if (map) {
        if (map.getLayer('vessel-trail')) map.removeLayer('vessel-trail');
        if (map.getSource('vessel-trail')) map.removeSource('vessel-trail');
      }
      return;
    }
    
    const fetchTrail = async () => {
      const trail = await fetchVesselTrail(selectedVesselId);
      if (!trail || trail.points.length < 2) return;
      
      const trailGeoJSON = vesselTrailToGeoJSON(trail);
      
      // Add or update trail source
      const source = map.getSource('vessel-trail') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(trailGeoJSON);
      } else {
        map.addSource('vessel-trail', {
          type: 'geojson',
          data: trailGeoJSON
        });
        
        // Add trail line layer
        map.addLayer({
          id: 'vessel-trail',
          type: 'line',
          source: 'vessel-trail',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3AA3FF', // Blue trail
            'line-width': 3,
            'line-opacity': 0.7
          }
        }, 'fleet-vessels'); // Place below vessel dots
      }
    };
    
    fetchTrail();
  }, [map, showFleetTracks, selectedVesselId]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (map) {
        // Remove all fleet-related layers and sources
        ['fleet-vessels', 'fleet-vessels-badge', 'vessel-trail'].forEach(id => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
        ['fleet-vessels', 'vessel-trail'].forEach(id => {
          if (map.getSource(id)) map.removeSource(id);
        });
      }
    };
  }, [map]);
  
  return null;
}
