'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { showToast } from '@/components/ui/Toast';

interface GFWVesselLayerProps {
  map: mapboxgl.Map | null;
  showCommercial: boolean;
  selectedInletId: string | null;
  onVesselCountUpdate?: (counts: {
    longliner: number;
    drifting_longline: number;
    trawler: number;
    fishing_events: number;
  }) => void;
  onTracksUpdate?: (tracks: Array<{
    id: string;
    gear_type: string;
    track: Array<[number, number]>;
  }>) => void;
}

// Gear type labels
const gearLabels: Record<string, string> = {
  longliner: 'Longliner',
  drifting_longline: 'Drifting Longline',
  trawler: 'Trawler'
};

// Time ago formatter
function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export default function GFWVesselLayer({
  map,
  showCommercial,
  selectedInletId,
  onVesselCountUpdate,
  onTracksUpdate
}: GFWVesselLayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastBoundsRef = useRef<mapboxgl.LngLatBounds | null>(null);
  
  // Fetch GFW data
  const fetchGFWData = async () => {
    if (!map || !showCommercial) return;
    
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setIsLoading(true);
    
    try {
      // Prefer inlet-based query
      let url = '/api/gfw/vessels';
      if (selectedInletId && selectedInletId !== 'overview') {
        url += `?inletId=${selectedInletId}&days=7`;
      } else {
        // Fallback to bbox
        const bounds = map.getBounds();
        if (!bounds) {
          console.warn('Unable to get map bounds');
          return;
        }
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
        url += `?bbox=${bbox}&days=7`;
      }
      
      const response = await fetch(url, { 
        signal: abortController.signal,
        cache: 'no-store'
      });
      
      if (!response.ok) {
        if (response.status === 503) {
          showToast({
            type: 'warning',
            title: 'GFW Not Configured',
            message: 'Global Fishing Watch service is not configured.',
            duration: 5000
          });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
        return;
      }
      
      const data = await response.json();
      
      // Check if configured
      if (data.configured === false) {
        // Update counts to show not configured
        onVesselCountUpdate({
          longliner: -1,  // Special value to indicate not configured
          driftingLongline: -1,
          trawler: -1,
          fishingEvents: -1
        });
        showToast({
          type: 'warning',
          title: 'GFW Not Available',
          message: 'Global Fishing Watch integration is not configured.',
          duration: 5000
        });
        return;
      }
      
      const { vessels = [], events = [] } = data;
      
      // Show message if no data
      if (vessels.length === 0 && events.length === 0) {
        showToast({
          type: 'info',
          title: 'No Commercial Activity',
          message: 'No commercial vessels detected in this area (last 7 days).',
          duration: 4000
        });
      }
      
      // Transform to GeoJSON
      const geojsonVessels = {
        type: 'FeatureCollection' as const,
        features: vessels.map((v: any) => ({
          type: 'Feature' as const,
          geometry: { 
            type: 'Point' as const, 
            coordinates: [v.last_pos.lon, v.last_pos.lat] 
          },
          properties: { 
            gear: v.gear, 
            id: v.id, 
            name: v.name || 'Unknown Vessel', 
            t: v.last_pos.t 
          }
        }))
      };
      
      const geojsonTracks = {
        type: 'FeatureCollection' as const,
        features: vessels
          .filter((v: any) => v.track?.length >= 2)
          .map((v: any) => ({
            type: 'Feature' as const,
            geometry: { 
              type: 'LineString' as const, 
              coordinates: v.track.map((p: any) => [p.lon, p.lat]) 
            },
            properties: { 
              gear: v.gear, 
              id: v.id 
            }
          }))
      };
      
      const geojsonEvents = {
        type: 'FeatureCollection' as const,
        features: events.map((e: any) => ({
          type: 'Feature' as const,
          geometry: { 
            type: 'Point' as const, 
            coordinates: [e.lon, e.lat] 
          },
          properties: { 
            gear: e.gear, 
            score: e.score, 
            t: e.t 
          }
        }))
      };
      
      // Update sources
      const vesselsSource = map.getSource('gfw-vessels') as mapboxgl.GeoJSONSource;
      if (vesselsSource) {
        vesselsSource.setData(geojsonVessels);
      } else {
        map.addSource('gfw-vessels', { type: 'geojson', data: geojsonVessels });
      }
      
      const tracksSource = map.getSource('gfw-tracks') as mapboxgl.GeoJSONSource;
      if (tracksSource) {
        tracksSource.setData(geojsonTracks);
      } else {
        map.addSource('gfw-tracks', { type: 'geojson', data: geojsonTracks });
      }
      
      const eventsSource = map.getSource('gfw-events') as mapboxgl.GeoJSONSource;
      if (eventsSource) {
        eventsSource.setData(geojsonEvents);
      } else {
        map.addSource('gfw-events', { type: 'geojson', data: geojsonEvents });
      }
      
      // Add layers if not exists
      if (!map.getLayer('gfw-tracks-lines')) {
        map.addLayer({
          id: 'gfw-tracks-lines',
          type: 'line',
          source: 'gfw-tracks',
          paint: {
            'line-color': ['match', ['get', 'gear'],
              'longliner', '#FF6B6B',         // coral red
              'drifting_longline', '#46E6D4', // turquoise
              'trawler', '#4B9BFF',           // ocean blue
              '#9AA3AE'                        // default gray
            ],
            'line-width': ['interpolate', ['linear'], ['zoom'], 
              6, 1.0, 
              10, 2.0, 
              12, 3.0
            ],
            'line-opacity': 0.9
          }
        }, 'fleet-vessels'); // Place below fleet vessels
      }
      
      if (!map.getLayer('gfw-vessels-dots')) {
        map.addLayer({
          id: 'gfw-vessels-dots',
          type: 'circle',
          source: 'gfw-vessels',
          paint: {
            'circle-radius': 4.5,
            'circle-color': ['match', ['get', 'gear'],
              'longliner', '#FF6B6B',
              'drifting_longline', '#46E6D4',
              'trawler', '#4B9BFF',
              '#9AA3AE'
            ],
            'circle-stroke-width': 0.8,
            'circle-stroke-color': '#0a0f14'
          }
        });
      }
      
      if (!map.getLayer('gfw-events-points')) {
        map.addLayer({
          id: 'gfw-events-points',
          type: 'circle',
          source: 'gfw-events',
          paint: {
            'circle-radius': 3.5,
            'circle-color': '#9AA3AE',
            'circle-opacity': 0.75
          }
        });
      }
      
      // Update counts for legend
      const vesselCounts = vessels.reduce((acc: any, v: any) => {
        acc[v.gear] = (acc[v.gear] || 0) + 1;
        return acc;
      }, {});
      
      if (onVesselCountUpdate) {
        onVesselCountUpdate({
          longliner: vesselCounts.longliner || 0,
          drifting_longline: vesselCounts.drifting_longline || 0,
          trawler: vesselCounts.trawler || 0,
          fishing_events: events.length
        });
      }
      
      // Update tracks for VesselTracksLayer
      if (onTracksUpdate) {
        const tracks = vessels
          .filter((v: any) => v.track?.length >= 2)
          .map((v: any) => ({
            id: v.id,
            gear_type: v.gear,
            track: v.track.map((p: any) => [p.lon, p.lat] as [number, number])
          }));
        onTracksUpdate(tracks);
      }
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('GFW fetch error:', error);
        showToast({
          type: 'error',
          title: 'GFW Error',
          message: 'Unable to load commercial vessel data. Retrying...',
          duration: 4000
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up click handler for popups
  useEffect(() => {
    if (!map || !showCommercial) return;
    
    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['gfw-vessels-dots']
      });
      
      if (features.length === 0) return;
      
      const feature = features[0];
      const props = feature.properties;
      
      if (!props) return;
      
      const popupContent = `
        <div style="padding: 8px; min-width: 180px;">
          <div style="display: inline-block; padding: 2px 8px; border-radius: 4px; 
                      background: ${props.gear === 'longliner' ? '#FF6B6B' : 
                                   props.gear === 'drifting_longline' ? '#46E6D4' : 
                                   props.gear === 'trawler' ? '#4B9BFF' : '#9AA3AE'}; 
                      color: white; font-size: 11px; font-weight: bold; margin-bottom: 4px;">
            ${gearLabels[props.gear] || 'Commercial Vessel'}
          </div>
          <div style="font-size: 13px; color: #e6f8ff; margin: 4px 0;">
            ${props.name || 'Unknown Vessel'}
          </div>
          <div style="font-size: 11px; color: #a9bfd1;">
            Last seen: ${timeAgo(props.t)}
          </div>
        </div>
      `;
      
      new mapboxgl.Popup({ offset: 12 })
        .setLngLat((feature.geometry as any).coordinates)
        .setHTML(popupContent)
        .addTo(map);
    };
    
    map.on('click', 'gfw-vessels-dots', handleClick);
    
    return () => {
      map.off('click', 'gfw-vessels-dots', handleClick);
    };
  }, [map, showCommercial]);
  
  // Fetch data when conditions change
  useEffect(() => {
    if (!map || !showCommercial) {
      // Clean up layers when toggled off
      if (map) {
        ['gfw-tracks-lines', 'gfw-vessels-dots', 'gfw-events-points'].forEach(id => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
      }
      
      // Clear refresh timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      
      // Update counts to zero
      if (onVesselCountUpdate) {
        onVesselCountUpdate({
          longliner: 0,
          drifting_longline: 0,
          trawler: 0,
          fishing_events: 0
        });
      }
      
      return;
    }
    
    // Initial fetch
    fetchGFWData();
    
    // Set up refresh timer (5 minutes)
    refreshTimerRef.current = setInterval(fetchGFWData, 5 * 60 * 1000);
    
    // Set up map move handler with debounce
    let moveTimeout: NodeJS.Timeout;
    const handleMapMove = () => {
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        const currentBounds = map.getBounds();
        if (!currentBounds) return;
        
        const lastBounds = lastBoundsRef.current;
        
        // Check if bounds changed meaningfully
        if (!lastBounds || 
            Math.abs(currentBounds.getWest() - lastBounds.getWest()) > 0.01 ||
            Math.abs(currentBounds.getEast() - lastBounds.getEast()) > 0.01 ||
            Math.abs(currentBounds.getNorth() - lastBounds.getNorth()) > 0.01 ||
            Math.abs(currentBounds.getSouth() - lastBounds.getSouth()) > 0.01) {
          lastBoundsRef.current = currentBounds;
          fetchGFWData();
        }
      }, 600);
    };
    
    map.on('moveend', handleMapMove);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimeout(moveTimeout);
      map.off('moveend', handleMapMove);
    };
  }, [map, showCommercial, selectedInletId]);
  
  // Cursor change on hover
  useEffect(() => {
    if (!map || !showCommercial) return;
    
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };
    
    map.on('mouseenter', 'gfw-vessels-dots', handleMouseEnter);
    map.on('mouseleave', 'gfw-vessels-dots', handleMouseLeave);
    
    return () => {
      map.off('mouseenter', 'gfw-vessels-dots', handleMouseEnter);
      map.off('mouseleave', 'gfw-vessels-dots', handleMouseLeave);
    };
  }, [map, showCommercial]);
  
  return null;
}
