'use client';

import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface OceanFeaturesLayerProps {
  map: mapboxgl.Map | null;
  showThermalFronts: boolean;
  showChlorophyllEdges: boolean;
  showEddies: boolean;
  date?: string;
}

type FeatureCollection = {
  type: 'FeatureCollection';
  features: any[];
  metadata?: any;
};

export default function OceanFeaturesLayer({
  map,
  showThermalFronts,
  showChlorophyllEdges,
  showEddies,
  date = new Date().toISOString().split('T')[0]
}: OceanFeaturesLayerProps) {
  const [thermalFronts, setThermalFronts] = useState<FeatureCollection | null>(null);
  const [chlorophyllEdges, setChlorophyllEdges] = useState<FeatureCollection | null>(null);
  const [eddies, setEddies] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchAbortController = useRef<AbortController | null>(null);

  // Fetch ocean features based on map bounds
  useEffect(() => {
    if (!map) return;

    const fetchFeatures = async () => {
      // Abort any pending requests
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }

      fetchAbortController.current = new AbortController();
      setLoading(true);

      try {
        const bounds = map.getBounds();
        if (!bounds) return;
        const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

        // Fetch all features in parallel
        const promises: Promise<FeatureCollection>[] = [];

        if (showThermalFronts) {
          promises.push(
            fetch(`/api/ocean-features/fronts?bbox=${bbox}&date=${date}`, {
              signal: fetchAbortController.current.signal
            }).then(res => res.json())
          );
        }

        if (showChlorophyllEdges) {
          promises.push(
            fetch(`/api/ocean-features/edges?bbox=${bbox}&date=${date}`, {
              signal: fetchAbortController.current.signal
            }).then(res => res.json())
          );
        }

        if (showEddies) {
          promises.push(
            fetch(`/api/ocean-features/eddies?bbox=${bbox}&date=${date}`, {
              signal: fetchAbortController.current.signal
            }).then(res => res.json())
          );
        }

        const results = await Promise.all(promises);

        // Update state with fetched data
        let resultIndex = 0;
        if (showThermalFronts) {
          setThermalFronts(results[resultIndex++]);
        }
        if (showChlorophyllEdges) {
          setChlorophyllEdges(results[resultIndex++]);
        }
        if (showEddies) {
          setEddies(results[resultIndex++]);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch ocean features:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    // Fetch on map move/zoom (debounced)
    let debounceTimer: NodeJS.Timeout;
    const handleMapMove = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchFeatures, 500);
    };

    map.on('moveend', handleMapMove);
    map.on('zoomend', handleMapMove);

    // Initial fetch
    fetchFeatures();

    return () => {
      map.off('moveend', handleMapMove);
      map.off('zoomend', handleMapMove);
      clearTimeout(debounceTimer);
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }
    };
  }, [map, showThermalFronts, showChlorophyllEdges, showEddies, date]);

  // Add thermal fronts layer
  useEffect(() => {
    if (!map || !showThermalFronts) return;

    const sourceId = 'ocean-thermal-fronts';
    const layerId = 'ocean-thermal-fronts-layer';

    // Add source if it doesn't exist
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: thermalFronts || { type: 'FeatureCollection', features: [] }
      });
    }

    // Add layer if it doesn't exist
    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#FF6B35', // Warm orange-red for thermal fronts
          'line-width': 2,
          'line-opacity': 0.8
        }
      });
    }

    // Update source data
    if (thermalFronts) {
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(thermalFronts);
      }
    }

    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [map, thermalFronts, showThermalFronts]);

  // Add chlorophyll edges layer
  useEffect(() => {
    if (!map || !showChlorophyllEdges) return;

    const sourceId = 'ocean-chlorophyll-edges';
    const layerId = 'ocean-chlorophyll-edges-layer';

    // Add source if it doesn't exist
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: chlorophyllEdges || { type: 'FeatureCollection', features: [] }
      });
    }

    // Add layer if it doesn't exist
    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#4ECDC4', // Turquoise for chlorophyll
          'fill-opacity': 0.3
        }
      });

      // Add outline
      map.addLayer({
        id: `${layerId}-outline`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#4ECDC4',
          'line-width': 1.5,
          'line-opacity': 0.8
        }
      });
    }

    // Update source data
    if (chlorophyllEdges) {
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(chlorophyllEdges);
      }
    }

    return () => {
      if (map.getLayer(`${layerId}-outline`)) {
        map.removeLayer(`${layerId}-outline`);
      }
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [map, chlorophyllEdges, showChlorophyllEdges]);

  // Add eddies layer
  useEffect(() => {
    if (!map || !showEddies) return;

    const sourceId = 'ocean-eddies';
    const layerId = 'ocean-eddies-layer';

    // Add source if it doesn't exist
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: eddies || { type: 'FeatureCollection', features: [] }
      });
    }

    // Add layer if it doesn't exist
    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': [
            'match',
            ['get', 'eddy_type'],
            'warm_core', '#FF4444', // Red for warm core eddies
            'cold_core', '#4444FF', // Blue for cold core eddies
            '#888888' // Gray for unknown
          ],
          'fill-opacity': 0.25
        }
      });

      // Add outline
      map.addLayer({
        id: `${layerId}-outline`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': [
            'match',
            ['get', 'eddy_type'],
            'warm_core', '#FF4444',
            'cold_core', '#4444FF',
            '#888888'
          ],
          'line-width': 2,
          'line-opacity': 0.8,
          'line-dasharray': [2, 2] // Dashed line for eddies
        }
      });
    }

    // Update source data
    if (eddies) {
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(eddies);
      }
    }

    return () => {
      if (map.getLayer(`${layerId}-outline`)) {
        map.removeLayer(`${layerId}-outline`);
      }
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [map, eddies, showEddies]);

  // Add popups on click
  useEffect(() => {
    if (!map) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [
          'ocean-thermal-fronts-layer',
          'ocean-chlorophyll-edges-layer',
          'ocean-eddies-layer'
        ]
      });

      if (features.length === 0) return;

      const feature = features[0];
      let html = '';

      if (feature.properties?.feature_type === 'thermal_front') {
        html = `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: bold;">Thermal Front</h3>
            <p style="margin: 4px 0; font-size: 12px;">Strength: ${feature.properties.strength.toFixed(2)}°C/km</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">Temperature gradient threshold</p>
          </div>
        `;
      } else if (feature.properties?.feature_type === 'chlorophyll_edge') {
        html = `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: bold;">Chlorophyll Edge</h3>
            <p style="margin: 4px 0; font-size: 12px;">Area: ${feature.properties.area_pixels} px²</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">Productive water boundary</p>
          </div>
        `;
      } else if (feature.properties?.feature_type === 'eddy') {
        const eddyType = feature.properties.eddy_type === 'warm_core' ? 'Warm Core' : 'Cold Core';
        html = `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: bold;">${eddyType} Eddy</h3>
            <p style="margin: 4px 0; font-size: 12px;">Radius: ${feature.properties.radius_km.toFixed(1)} km</p>
            <p style="margin: 4px 0; font-size: 12px;">SST Anomaly: ${feature.properties.sst_anomaly > 0 ? '+' : ''}${feature.properties.sst_anomaly.toFixed(1)}°C</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">Mesoscale circulation feature</p>
          </div>
        `;
      }

      if (html) {
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      }
    };

    map.on('click', handleClick);

    // Change cursor on hover
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    ['ocean-thermal-fronts-layer', 'ocean-chlorophyll-edges-layer', 'ocean-eddies-layer'].forEach(layerId => {
      map.on('mouseenter', layerId, handleMouseEnter);
      map.on('mouseleave', layerId, handleMouseLeave);
    });

    return () => {
      map.off('click', handleClick);
      ['ocean-thermal-fronts-layer', 'ocean-chlorophyll-edges-layer', 'ocean-eddies-layer'].forEach(layerId => {
        map.off('mouseenter', layerId, handleMouseEnter);
        map.off('mouseleave', layerId, handleMouseLeave);
      });
    };
  }, [map, showThermalFronts, showChlorophyllEdges, showEddies]);

  return null; // This is a layer component, no UI
}
