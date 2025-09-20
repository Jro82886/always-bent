'use client';

import { useEffect, useState } from 'react';
import { useMapbox } from '@/lib/MapCtx';
import { useAppState } from '@/store/appState';

const SOURCE_ID = 'ocean-features';
const BACKEND_URL = process.env.NEXT_PUBLIC_POLYGONS_URL || process.env.POLYGONS_BACKEND_URL || '';

interface FeatureStyles {
  [key: string]: {
    color: string;
    fillOpacity: number;
    lineWidth: number;
  };
}

const FEATURE_STYLES: FeatureStyles = {
  thermal_front: {
    color: '#ff6600',  // Orange for temperature breaks
    fillOpacity: 0.2,
    lineWidth: 3
  },
  chlorophyll_edge: {
    color: '#00ff88',  // Green for productivity zones
    fillOpacity: 0.25,
    lineWidth: 2.5
  },
  eddy: {
    color: '#00ccff',  // Blue for eddies
    fillOpacity: 0.3,
    lineWidth: 2
  },
  warm_core: {
    color: '#ff4444',  // Red for warm core eddies
    fillOpacity: 0.3,
    lineWidth: 2
  },
  cold_core: {
    color: '#4444ff',  // Blue for cold core eddies
    fillOpacity: 0.3,
    lineWidth: 2
  }
};

export default function PolygonIntegration({ enabled = true }: { enabled?: boolean }) {
  const map = useMapbox() as any;
  const isoDate = useAppState(s => s.isoDate);
  const [loading, setLoading] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const [dataSource, setDataSource] = useState<'cached' | 'live' | 'none'>('none');

  useEffect(() => {
    if (!map || !enabled) return;

    let cancelled = false;
    let debounceTimer: any = null;

    const fetchPolygons = async () => {
      if (cancelled) return;
      
      setLoading(true);
      try {
        const bounds = map.getBounds();
        const bbox = [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ].join(',');

        // Try the new backend first
        let url = `${BACKEND_URL}/polygons?bbox=${bbox}&time=${isoDate}`;
        
        // If no backend URL, fall back to local API
        if (!BACKEND_URL) {
          url = `/api/polygons?bbox=${bbox}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch polygons');
        
        const data = await response.json();
        if (cancelled) return;

        // Check data source
        const source = data.properties?.source || 'unknown';
        setDataSource(source === 'cached' ? 'cached' : source === 'on-demand' ? 'live' : 'none');
        setFeatureCount(data.features?.length || 0);

        // Add/update source
        if (!map.getSource(SOURCE_ID)) {
          map.addSource(SOURCE_ID, {
            type: 'geojson',
            data
          });
        } else {
          const source = map.getSource(SOURCE_ID);
          if (source && source.setData) {
            source.setData(data);
          }
        }

        // Add layers for each feature type
        data.features?.forEach((feature: any) => {
          const featureType = feature.properties?.feature_type || feature.properties?.type || 'unknown';
          const style = FEATURE_STYLES[featureType] || FEATURE_STYLES.thermal_front;
          
          const layerId = `${SOURCE_ID}-${featureType}`;
          const lineLayerId = `${layerId}-line`;

          // Add fill layer for polygons
          if (feature.geometry?.type === 'Polygon' && !map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: 'fill',
              source: SOURCE_ID,
              filter: ['==', ['get', 'feature_type'], featureType],
              paint: {
                'fill-color': style.color,
                'fill-opacity': style.fillOpacity
              }
            });
          }

          // Add line layer
          if (!map.getLayer(lineLayerId)) {
            map.addLayer({
              id: lineLayerId,
              type: 'line',
              source: SOURCE_ID,
              filter: ['==', ['get', 'feature_type'], featureType],
              paint: {
                'line-color': style.color,
                'line-width': style.lineWidth,
                'line-opacity': 0.8
              }
            });
          }
        });

      } catch (error) {
        console.error('Error loading ocean features:', error);
        setDataSource('none');
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    if (map.isStyleLoaded()) {
      fetchPolygons();
    } else {
      const onLoad = () => {
        fetchPolygons();
        map.off('styledata', onLoad);
      };
      map.on('styledata', onLoad);
    }

    // Reload on map move
    const onMoveEnd = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchPolygons, 300);
    };
    map.on('moveend', onMoveEnd);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
      map.off('moveend', onMoveEnd);
      
      // Clean up layers and source
      Object.keys(FEATURE_STYLES).forEach(featureType => {
        const layerId = `${SOURCE_ID}-${featureType}`;
        const lineLayerId = `${layerId}-line`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      });
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map, enabled, isoDate]);

  // Status indicator
  if (!enabled) return null;

  return (
    <div className="absolute bottom-20 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white/80">
      <div className="flex items-center gap-2">
        {loading ? (
          <span className="text-cyan-400 animate-pulse">Loading ocean features...</span>
        ) : (
          <>
            <span className="text-cyan-300">{featureCount} features</span>
            {dataSource === 'cached' && (
              <span className="text-green-400">(cached)</span>
            )}
            {dataSource === 'live' && (
              <span className="text-yellow-400">(live)</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
