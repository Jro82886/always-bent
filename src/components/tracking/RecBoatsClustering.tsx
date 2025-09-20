'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface RecBoatsClusteringProps {
  map: mapboxgl.Map | null;
  showFleet: boolean;
  selectedInletId: string | null;
}

// TypeScript types for vessel features
interface VesselProperties {
  id: string;
  name: string;
  speed?: number;
  course?: number;
  inlet_id?: string;
  last_seen: number;
  captain?: string;
}

interface VesselFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: VesselProperties;
}

interface VesselCollection {
  type: 'FeatureCollection';
  features: VesselFeature[];
}

// Throttle function to prevent UI thrash
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Time ago formatter
function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RecBoatsClustering({ 
  map, 
  showFleet,
  selectedInletId 
}: RecBoatsClusteringProps) {
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sourceAddedRef = useRef(false);
  
  // Throttled update function to prevent UI thrash
  const updateRecData = useRef(
    throttle((features: VesselFeature[]) => {
      if (!map) return;
      
      const source = map.getSource('rec-vessels') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features
        });
      }
    }, 2000) // Update at most every 2 seconds
  ).current;

  // Initialize clustering source and layers
  useEffect(() => {
    if (!map || sourceAddedRef.current) return;

    // Wait for map to be ready
    if (!map.loaded()) {
      map.once('load', () => {
        initializeClusteringLayers();
      });
    } else {
      initializeClusteringLayers();
    }

    function initializeClusteringLayers() {
      if (!map) return;
      
      console.log('Initializing rec boats clustering...');
      
      // Guard against double initialization
      if (map.getSource('rec-vessels')) {
        console.log('Rec vessels source already exists');
        sourceAddedRef.current = true;
        return;
      }
      
      // 1) Source with clustering enabled
      map.addSource('rec-vessels', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 9,      // <=9 clusters; >=10 individual boats
        clusterRadius: 50
      });

      // 2) Cluster circles layer
      map.addLayer({
        id: 'rec-clusters',
        type: 'circle',
        source: 'rec-vessels',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#3B82F6',  // Blue for small clusters
            10,
            '#8B5CF6',  // Purple for medium
            30,
            '#22C55E'   // Green for large
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            14,         // Small clusters
            10,
            18,         // Medium
            30,
            24          // Large
          ],
          'circle-blur': 0.2,
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.3)'
        }
      });

      // 3) Cluster count labels
      map.addLayer({
        id: 'rec-cluster-count',
        type: 'symbol',
        source: 'rec-vessels',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12,
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold']
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 0.75
        }
      });

      // 4) Individual boats layer (slightly bigger for easier clicking)
      map.addLayer({
        id: 'rec-unclustered',
        type: 'circle',
        source: 'rec-vessels',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#00C7B7',  // Teal for boats
          'circle-radius': 6,         // Bigger for easier clicks
          'circle-stroke-width': 1.25,
          'circle-stroke-color': '#001015'
        }
      });

      // 5) Click handlers
      map.on('click', 'rec-clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['rec-clusters']
        });
        
        if (!features.length) return;
        
        const clusterId = features[0].properties?.cluster_id;
        const source = map.getSource('rec-vessels') as mapboxgl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom === null || zoom === undefined) return;
          
          map.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom + 0.5
          });
        });
      });

      // 6) Popup for individual boats
      map.on('click', 'rec-unclustered', (e) => {
        if (!e.features?.length) return;
        
        const feature = e.features[0];
        const props = feature.properties || {};
        
        const popupContent = `
          <div style="padding: 8px;">
            <strong>${props.name || 'Recreational Vessel'}</strong><br/>
            ${props.speed !== undefined ? `${props.speed} kts` : '-'} · ${props.course !== undefined ? `${props.course}°` : '-'}<br/>
            <small style="opacity: 0.7">
              ${props.inlet_id || '-'} • ${props.last_seen ? timeAgo(props.last_seen) : 'Unknown'}
            </small>
          </div>
        `;
        
        if (map) {
          new mapboxgl.Popup({ offset: 12, maxWidth: '250px' })
            .setLngLat((feature.geometry as any).coordinates)
            .setHTML(popupContent)
            .addTo(map);
        }
      });

      // 7) Cursor changes
      ['rec-clusters', 'rec-unclustered'].forEach(layerId => {
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });

      sourceAddedRef.current = true;
      console.log('Rec boats clustering initialized');
      
      // Load initial mock data
      loadMockData();
    }

    return () => {
      // Cleanup intervals
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [map]);

  // Toggle visibility based on showFleet prop
  useEffect(() => {
    if (!map || !sourceAddedRef.current) return;

    const visibility = showFleet ? 'visible' : 'none';
    
    ['rec-clusters', 'rec-cluster-count', 'rec-unclustered'].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    });
    
    console.log('Fleet visibility:', showFleet);
  }, [map, showFleet]);

  // Load mock data for testing
  function loadMockData() {
    if (!map) return;

    // Generate mock vessels along East Coast
    const mockVessels: VesselFeature[] = [];
    
    // Add vessels near major inlets
    const inletCoords = [
      { name: 'Montauk', coords: [-71.94, 41.06], id: 'MONTAUK' },
      { name: 'Fire Island', coords: [-73.28, 40.63], id: 'FIRE_ISLAND' },
      { name: 'Barnegat', coords: [-74.11, 39.77], id: 'BARNEGAT' },
      { name: 'Ocean City', coords: [-75.09, 38.33], id: 'OCEAN_CITY' },
      { name: 'Virginia Beach', coords: [-75.97, 36.85], id: 'VA_BEACH' },
      { name: 'Hatteras', coords: [-75.54, 35.22], id: 'HATTERAS' }
    ];

    inletCoords.forEach(inlet => {
      // Add 5-15 vessels near each inlet
      const vesselCount = Math.floor(Math.random() * 10) + 5;
      
      for (let i = 0; i < vesselCount; i++) {
        const offset = 0.3; // Spread vessels within ~20 miles
        const lat = inlet.coords[1] + (Math.random() - 0.5) * offset;
        const lng = inlet.coords[0] + (Math.random() - 0.5) * offset;
        
        mockVessels.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties: {
            id: `vessel-${inlet.id}-${i}`,
            name: `${inlet.name} Boat ${i + 1}`,
            speed: Math.round(Math.random() * 20 + 5),
            course: Math.round(Math.random() * 360),
            inlet_id: inlet.id,
            last_seen: Date.now() - Math.random() * 3600000, // Within last hour
            captain: `Captain ${Math.random() > 0.5 ? 'Smith' : 'Jones'}`
          }
        });
      }
    });

    // Add some offshore vessels
    for (let i = 0; i < 20; i++) {
      const lat = 25 + Math.random() * 20; // 25-45°N
      const lng = -80 + Math.random() * 15; // 65-80°W
      
      mockVessels.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties: {
          id: `offshore-${i}`,
          name: `Offshore Vessel ${i + 1}`,
          speed: Math.round(Math.random() * 15 + 8),
          course: Math.round(Math.random() * 360),
          inlet_id: undefined,
          last_seen: Date.now() - Math.random() * 7200000, // Within last 2 hours
          captain: `Captain Offshore-${i}`
        }
      });
    }

    updateRecData(mockVessels);
    console.log(`Loaded ${mockVessels.length} mock vessels`);
  }

  // In production, this would fetch real vessel data
  useEffect(() => {
    if (!map || !showFleet) return;

    // Update data every 30 seconds when fleet is visible
    const fetchVesselData = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/vessels/recreational');
        // const data = await response.json();
        // updateRecData(data.features);
        
        // For now, just slightly randomize positions
        if (map.getSource('rec-vessels')) {
          const source = map.getSource('rec-vessels') as mapboxgl.GeoJSONSource;
          // In production, fetch fresh data here
        }
      } catch (error) {
        console.error('Error fetching vessel data:', error);
      }
    };

    fetchVesselData();
    updateIntervalRef.current = setInterval(fetchVesselData, 30000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [map, showFleet]);

  return null; // This component only manages map layers
}
