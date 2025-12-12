'use client';

import { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { Layers, Circle, TrendingUp, GitBranch, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  map: mapboxgl.Map | null;
}

const SOURCE_ID = 'sst-polygons';

// Layer IDs for each feature type
const LAYERS = {
  gulf_stream: {
    fill: 'sst-gulfstream-fill',
    line: 'sst-gulfstream-line',
    color: '#00ff88', // GREEN - main Gulf Stream
    icon: TrendingUp,
    label: 'Gulf Stream'
  },
  eddy: {
    fill: 'sst-eddy-fill',
    line: 'sst-eddy-line',
    color: '#00ff88', // GREEN
    icon: Circle,
    label: 'Eddies'
  },
  edge: {
    fill: 'sst-edge-fill',
    line: 'sst-edge-line',
    color: '#ff6600', // ORANGE
    icon: TrendingUp,
    label: 'Edges'
  },
  filament: {
    fill: 'sst-filament-fill',
    line: 'sst-filament-line',
    color: '#00ccff', // CYAN
    icon: GitBranch,
    label: 'Filaments'
  }
};

export default function PolygonsPanel({ map }: Props) {
  const [showPanel, setShowPanel] = useState(true); // Start open to show features
  const [enabled, setEnabled] = useState({
    gulf_stream: true, // ON by default - main Gulf Stream position
    eddy: true,        // ON by default - show oceanographic features
    edge: true,        // ON by default - show thermal fronts
    filament: true     // ON by default - show all features
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    gulf_stream: 0,
    eddy: 0,
    edge: 0,
    filament: 0
  });
  const [isLive, setIsLive] = useState(false);

  // Load polygons when map is ready and at least one layer is enabled
  useEffect(() => {
    console.log('[PolygonsPanel] useEffect triggered, map:', !!map);
    if (!map) {
      console.log('[PolygonsPanel] No map, returning');
      return;
    }

    // Don't load if no layers are enabled
    const anyEnabled = Object.values(enabled).some(v => v);
    console.log('[PolygonsPanel] anyEnabled:', anyEnabled, 'enabled:', enabled);

    const loadPolygons = async () => {
      console.log('[PolygonsPanel] loadPolygons called');
      if (!anyEnabled) {
        console.log('[PolygonsPanel] No layers enabled, returning');
        return;
      }

      setLoading(true);
      try {
        const bounds = map.getBounds();
        const bbox = bounds ? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(',') : '';
        console.log('[PolygonsPanel] bounds:', bounds ? 'yes' : 'no', 'bbox:', bbox);

        // Fetch polygon data from API (which proxies Railway server-side with timeout)
        let data: { type: 'FeatureCollection'; features: any[] } | null = null;
        let usedLive = false;

        // Try local tile-based detection first
        try {
          const res = await fetch(`/api/polygons/live?bbox=${bbox}&layers=sst,chl`);
          if (res.ok) {
            const liveData = await res.json();
            if (liveData.features && liveData.features.length > 0) {
              data = liveData;
              usedLive = true;
            }
          }
        } catch (e) {
          console.log('Local live detection failed');
        }

        // Fall back to /api/polygons (proxies Railway with timeout, then static fallback)
        if (!data || !data.features?.length) {
          const fallbackRes = await fetch(`/api/polygons?bbox=${bbox}`);
          if (!fallbackRes.ok) {
            return;
          }
          data = await fallbackRes.json();
          usedLive = false;
        }

        // Don't update if we got no features - keep existing polygons
        if (!data?.features?.length) {
          console.log('No polygon features found, keeping existing');
          return;
        }

        setIsLive(usedLive);

        // Count features by class OR feature_type (Railway uses feature_type, static uses class)
        // Map feature_type values: thermal_front -> edge
        const counts = { gulf_stream: 0, eddy: 0, edge: 0, filament: 0 };
        data.features?.forEach((f: any) => {
          let featureClass = f.properties?.class || f.properties?.feature_type;
          // Map Railway's naming to our internal naming
          if (featureClass === 'thermal_front') featureClass = 'edge';
          if (featureClass && counts[featureClass as keyof typeof counts] !== undefined) {
            counts[featureClass as keyof typeof counts]++;
          }
        });
        setStats(counts);

        // Normalize feature properties: ensure all features have 'class' for Mapbox filters
        data.features = data.features.map((f: any) => {
          if (f.properties?.feature_type && !f.properties?.class) {
            let mappedClass = f.properties.feature_type;
            if (mappedClass === 'thermal_front') mappedClass = 'edge';
            return {
              ...f,
              properties: {
                ...f.properties,
                class: mappedClass
              }
            };
          }
          return f;
        });


        // Add source if not exists
        if (!map.getSource(SOURCE_ID)) {
          map.addSource(SOURCE_ID, {
            type: 'geojson',
            data
          });

        } else {
          // Only update source if we have features
          const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
          source.setData(data);

        }

        // Add layers for each feature type
        Object.entries(LAYERS).forEach(([type, config]) => {
          // Check the actual property name in the data
          // The API returns "class" not "type"
          
          // Fill layer - ONLY for Polygon geometries (not LineStrings)
          if (!map.getLayer(config.fill)) {
            map.addLayer({
              id: config.fill,
              type: 'fill',
              source: SOURCE_ID,
              filter: ['all',
                ['==', ['get', 'class'], type],
                ['==', ['geometry-type'], 'Polygon'] // Only fill polygons, not lines
              ],
              paint: {
                'fill-color': config.color,
                'fill-opacity': 0.25
              },
              layout: {
                'visibility': 'visible' // Start visible, toggleLayer handles state
              }
            });
          }
          // Don't update visibility on reload - toggleLayer handles that

          // Line layer
          if (!map.getLayer(config.line)) {
            map.addLayer({
              id: config.line,
              type: 'line',
              source: SOURCE_ID,
              filter: ['==', ['get', 'class'], type],
              paint: {
                'line-color': config.color,
                'line-width': 3,
                'line-opacity': 1
              },
              layout: {
                'visibility': 'visible' // Start visible, toggleLayer handles state
              }
            });
          }
          // Don't update visibility on reload - toggleLayer handles that
        });
        
        // Move polygon layers to top to ensure visibility
        setTimeout(() => {
          Object.entries(LAYERS).forEach(([type, config]) => {
            if (map.getLayer(config.fill)) {
              map.moveLayer(config.fill);
            }
            if (map.getLayer(config.line)) {
              map.moveLayer(config.line);
            }
          });
          
        }, 100);

      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadPolygons();

    // Reload on map move (debounced to prevent rapid reloads)
    let debounceTimer: NodeJS.Timeout;
    const handleMoveEnd = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadPolygons, 500); // Wait 500ms after map stops moving
    };
    map.on('moveend', handleMoveEnd);

    return () => {
      clearTimeout(debounceTimer);
      map.off('moveend', handleMoveEnd);
    };
  }, [map]); // Only re-run when map changes, not on enabled toggle

  // Toggle layer visibility
  const toggleLayer = (type: keyof typeof enabled) => {
    const newState = !enabled[type];
    setEnabled(prev => ({ ...prev, [type]: newState }));
    
    // Immediately update visibility if map layers exist
    if (map) {
      const config = LAYERS[type];
      if (map.getLayer(config.fill)) {
        map.setLayoutProperty(config.fill, 'visibility', newState ? 'visible' : 'none');
      }
      if (map.getLayer(config.line)) {
        map.setLayoutProperty(config.line, 'visibility', newState ? 'visible' : 'none');
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 backdrop-blur-md rounded-lg border border-cyan-400/30 overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.2)]">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-cyan-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-cyan-400" />
          <span className="text-sm font-medium text-cyan-300">Polygons</span>
          {isLive && (
            <span className="ml-1 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[9px] font-bold rounded border border-green-500/30 animate-pulse">
              LIVE
            </span>
          )}
          {loading && <span className="text-xs text-gray-500">(loading...)</span>}
        </div>
        {showPanel ? (
          <ChevronUp size={14} className="text-cyan-400" />
        ) : (
          <ChevronDown size={14} className="text-cyan-400" />
        )}
      </button>
      
      {showPanel && (
        <div className="px-4 pb-3 space-y-2">
          <div className="text-xs text-cyan-400/70 uppercase tracking-wider mb-2">
            SST Features
          </div>
          
          {/* Feature toggles */}
          {Object.entries(LAYERS).map(([type, config]) => {
            const Icon = config.icon;
            const count = stats[type as keyof typeof stats];
            const isEnabled = enabled[type as keyof typeof enabled];
            
            return (
              <button
                key={type}
                onClick={() => toggleLayer(type as keyof typeof enabled)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  isEnabled
                    ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'bg-gray-800/50 text-gray-400 hover:text-gray-300 hover:bg-gray-800/70 border border-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} style={{ color: isEnabled ? config.color : undefined }} />
                  <span>{config.label}</span>
                </div>
                {count > 0 && (
                  <span className="text-xs opacity-70">({count})</span>
                )}
              </button>
            );
          })}
          
          {/* Classification info */}
          <div className="mt-3 pt-3 border-t border-cyan-500/10">
            <div className="text-[10px] text-cyan-400/60 uppercase tracking-wider mb-1">
              Classification
            </div>
            <div className="text-[10px] text-gray-500 space-y-0.5">
              <div>Eddy: Circular (4 sides)</div>
              <div>Filament: 3 sides</div>
              <div>Edge: 1-2 sides</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
