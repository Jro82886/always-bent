'use client';

import { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { Layers } from 'lucide-react';

interface Props {
  map: mapboxgl.Map | null;
}

const SOURCE_ID = 'sst-features';
const EDGE_LINE_ID = 'sst-edges-line';
const EDGE_FILL_ID = 'sst-edges-fill';
const EDDY_LINE_ID = 'sst-eddies-line';
const EDDY_FILL_ID = 'sst-eddies-fill';

export default function SSTFeaturesToggle({ map }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ eddies: 0, edges: 0 });

  useEffect(() => {
    if (!map || !enabled) {
      // Remove layers if disabled
      if (map) {
        if (map.getLayer(EDDY_FILL_ID)) map.removeLayer(EDDY_FILL_ID);
        if (map.getLayer(EDDY_LINE_ID)) map.removeLayer(EDDY_LINE_ID);
        if (map.getLayer(EDGE_FILL_ID)) map.removeLayer(EDGE_FILL_ID);
        if (map.getLayer(EDGE_LINE_ID)) map.removeLayer(EDGE_LINE_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      }
      return;
    }

    const loadFeatures = async () => {
      setLoading(true);
      try {
        const bounds = map.getBounds();
        if (!bounds) return;
        const bbox = [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ].join(',');

        const res = await fetch(`/api/sst-features?bbox=${bbox}`);
        const data = await res.json();

        // Count features
        const eddies = data.features?.filter((f: any) => f.properties?.type === 'eddy') || [];
        const edges = data.features?.filter((f: any) => f.properties?.type === 'edge') || [];
        setStats({ eddies: eddies.length, edges: edges.length });

        // Add source
        if (!map.getSource(SOURCE_ID)) {
          map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: data
          });
        } else {
          (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(data);
        }

        // Add edge layers (orange)
        if (!map.getLayer(EDGE_FILL_ID)) {
          map.addLayer({
            id: EDGE_FILL_ID,
            type: 'fill',
            source: SOURCE_ID,
            filter: ['==', ['get', 'type'], 'edge'],
            paint: {
              'fill-color': '#ff6600',
              'fill-opacity': 0.2
            }
          });
        }

        if (!map.getLayer(EDGE_LINE_ID)) {
          map.addLayer({
            id: EDGE_LINE_ID,
            type: 'line',
            source: SOURCE_ID,
            filter: ['==', ['get', 'type'], 'edge'],
            paint: {
              'line-color': '#ff6600',
              'line-width': 2,
              'line-opacity': 0.8
            }
          });
        }

        // Add eddy layers (green)
        if (!map.getLayer(EDDY_FILL_ID)) {
          map.addLayer({
            id: EDDY_FILL_ID,
            type: 'fill',
            source: SOURCE_ID,
            filter: ['==', ['get', 'type'], 'eddy'],
            paint: {
              'fill-color': '#00ff88',
              'fill-opacity': 0.2
            }
          });
        }

        if (!map.getLayer(EDDY_LINE_ID)) {
          map.addLayer({
            id: EDDY_LINE_ID,
            type: 'line',
            source: SOURCE_ID,
            filter: ['==', ['get', 'type'], 'eddy'],
            paint: {
              'line-color': '#00ff88',
              'line-width': 2,
              'line-opacity': 0.8
            }
          });
        }

        // Add click handlers for feature info
        const layers = [EDGE_FILL_ID, EDGE_LINE_ID, EDDY_FILL_ID, EDDY_LINE_ID];
        layers.forEach(layerId => {
          map.on('click', layerId, (e) => {
            if (!e.features?.[0]) return;
            const feature = e.features[0];
            const props = feature.properties;
            if (!props) return;
            
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`
                <div style="padding: 8px; font-family: system-ui, -apple-system, sans-serif;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <div style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
                      ${props.type === 'eddy' ? 
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff88" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>' : 
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6600" stroke-width="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>'
                      }
                    </div>
                    <h3 style="margin: 0; color: ${props.type === 'eddy' ? '#00ff88' : '#ff6600'}; font-size: 14px; font-weight: 600;">
                      ${props.type === 'eddy' ? 'Eddy' : 'Temperature Edge'}
                    </h3>
                  </div>
                  <div style="font-size: 12px; color: #e0e0e0;">
                    <div style="margin-bottom: 4px;">Gradient: <strong style="color: white;">${props.gradient?.toFixed(2) || 'N/A'}°F/mile</strong></div>
                    <div style="margin-bottom: 4px;">Avg Temp: <strong style="color: white;">${props.avgTemp?.toFixed(1) || 'N/A'}°F</strong></div>
                    <div style="margin-bottom: 4px;">Range: <strong style="color: white;">${props.minTemp?.toFixed(1) || 'N/A'} - ${props.maxTemp?.toFixed(1) || 'N/A'}°F</strong></div>
                    <div>Confidence: <strong style="color: white;">${((props.confidence || 0) * 100).toFixed(0)}%</strong></div>
                  </div>
                </div>
              `)
              .addTo(map);
          });

          // Change cursor on hover
          map.on('mouseenter', layerId, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
          });
        });

      } catch (error) {
        console.error('Failed to load SST features:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeatures();

    // Reload on map move
    let debounceTimer: NodeJS.Timeout;
    const handleMoveEnd = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadFeatures, 500);
    };
    
    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      clearTimeout(debounceTimer);
    };
  }, [map, enabled]);

  return (
    <div className="absolute bottom-32 left-4 bg-black/70 backdrop-blur-md rounded-full px-4 py-3 border border-cyan-500/20">
      <button
        onClick={() => setEnabled(!enabled)}
        className={`flex items-center gap-2 transition-colors ${
          enabled 
            ? 'text-cyan-300' 
            : 'text-gray-400 hover:text-cyan-300'
        }`}
      >
        <Layers size={16} />
        <span className="text-sm font-medium">
          SST Features
          {loading && ' (Loading...)'}
        </span>
      </button>
      
      {enabled && stats && (stats.eddies > 0 || stats.edges > 0) && (
        <div className="mt-2 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-300">{stats.eddies} Eddies</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span className="text-gray-300">{stats.edges} Edges</span>
          </div>
        </div>
      )}
    </div>
  );
}
