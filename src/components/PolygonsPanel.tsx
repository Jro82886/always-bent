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
  eddy: {
    fill: 'sst-eddy-fill',
    line: 'sst-eddy-line',
    color: '#00ff88',
    icon: Circle,
    label: 'Eddies'
  },
  edge: {
    fill: 'sst-edge-fill', 
    line: 'sst-edge-line',
    color: '#ff6600',
    icon: TrendingUp,
    label: 'Edges'
  },
  filament: {
    fill: 'sst-filament-fill',
    line: 'sst-filament-line', 
    color: '#00ccff',
    icon: GitBranch,
    label: 'Filaments'
  }
};

export default function PolygonsPanel({ map }: Props) {
  const [showPanel, setShowPanel] = useState(false); // Start closed
  const [enabled, setEnabled] = useState({
    eddy: false,    // Start hidden
    edge: false,    // Start hidden
    filament: false // Start hidden
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    eddy: 0,
    edge: 0,
    filament: 0
  });

  // Load polygons when map is ready and at least one layer is enabled
  useEffect(() => {
    if (!map) return;
    
    // Don't load if no layers are enabled
    const anyEnabled = Object.values(enabled).some(v => v);

    const loadPolygons = async () => {
      if (!anyEnabled) {
        console.log('⏸️ Skipping polygon load - no layers enabled');
        return;
      }
      console.log('🗺️ Loading polygons...');
      setLoading(true);
      try {
        const bounds = map.getBounds();
        const bbox = bounds ? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(',') : '';

        console.log('📡 Fetching from /api/polygons with bbox:', bbox);
        const res = await fetch(`/api/polygons?bbox=${bbox}`);
        
        let data;
        if (!res.ok) {
          console.error('❌ Polygon fetch failed:', res.status, res.statusText);
          // Try without bbox as fallback
          const fallbackRes = await fetch('/api/polygons');
          if (!fallbackRes.ok) {
            console.error('❌ Fallback fetch also failed:', fallbackRes.status);
            return;
          }
          data = await fallbackRes.json();
          console.log('📦 Fallback polygon data loaded:', data.features?.length || 0, 'features');
        } else {
          data = await res.json();
          console.log('📦 Polygon data loaded:', data.features?.length || 0, 'features');
        }

        // Count features by class (not type)
        const counts = { eddy: 0, edge: 0, filament: 0 };
        data.features?.forEach((f: any) => {
          const featureClass = f.properties?.class; // API uses 'class' not 'type'
          if (featureClass && counts[featureClass as keyof typeof counts] !== undefined) {
            counts[featureClass as keyof typeof counts]++;
          }
        });
        setStats(counts);
        console.log('📊 Feature counts:', counts);

        // Add source if not exists
        if (!map.getSource(SOURCE_ID)) {
          map.addSource(SOURCE_ID, {
            type: 'geojson',
            data
          });
          console.log('✅ Added polygon source');
        } else {
          const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
          source.setData(data);
          console.log('✅ Updated polygon source');
        }

        // Add layers for each feature type
        Object.entries(LAYERS).forEach(([type, config]) => {
          // Check the actual property name in the data
          // The API returns "class" not "type"
          
          // Fill layer
          if (!map.getLayer(config.fill)) {
            map.addLayer({
              id: config.fill,
              type: 'fill',
              source: SOURCE_ID,
              filter: ['==', ['get', 'class'], type], // Changed from 'type' to 'class'
              paint: {
                'fill-color': config.color,
                'fill-opacity': 0.25
              },
              layout: {
                'visibility': enabled[type as keyof typeof enabled] ? 'visible' : 'none'
              }
            });
            console.log(`✅ Added fill layer for ${type}`);
          } else {
            // Update visibility if layer exists
            map.setLayoutProperty(config.fill, 'visibility', 
              enabled[type as keyof typeof enabled] ? 'visible' : 'none');
          }

          // Line layer
          if (!map.getLayer(config.line)) {
            map.addLayer({
              id: config.line,
              type: 'line',
              source: SOURCE_ID,
              filter: ['==', ['get', 'class'], type], // Changed from 'type' to 'class'
              paint: {
                'line-color': config.color,
                'line-width': 3,
                'line-opacity': 1
              },
              layout: {
                'visibility': enabled[type as keyof typeof enabled] ? 'visible' : 'none'
              }
            });
            console.log(`✅ Added line layer for ${type}`);
          } else {
            // Update visibility if layer exists
            map.setLayoutProperty(config.line, 'visibility', 
              enabled[type as keyof typeof enabled] ? 'visible' : 'none');
          }
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
          console.log('📍 Moved polygon layers to top');
        }, 100);

      } catch (error) {
        console.error('Failed to load polygons:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadPolygons();

    // Reload on map move
    const handleMoveEnd = () => loadPolygons();
    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, enabled]); // Re-run when enabled layers change

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
    <div className="bg-gradient-to-br from-cyan-950/80 via-teal-950/80 to-cyan-900/80 backdrop-blur-md rounded-lg border border-cyan-400/30 overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.2)]">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-cyan-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-cyan-400" />
          <span className="text-sm font-medium text-cyan-300">Polygons</span>
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
