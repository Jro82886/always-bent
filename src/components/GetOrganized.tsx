'use client';

import { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { Layers, Circle, TrendingUp, GitBranch, ChevronDown } from 'lucide-react';

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

export default function GetOrganized({ map }: Props) {
  const [showPanel, setShowPanel] = useState(false);  // Panel closed by default
  const [enabled, setEnabled] = useState({
    eddy: false,  // User controls what they see
    edge: false,  // User controls what they see
    filament: false  // User controls what they see
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    eddy: 0,
    edge: 0,
    filament: 0
  });

  // Load polygon data
  useEffect(() => {
    if (!map) return;
    
    const loadPolygons = async () => {
      console.log('🗺️ Loading polygons...');
      setLoading(true);
      try {
        // Get current map bounds
        const bounds = map.getBounds();
        const bbox = bounds ? [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ].join(',') : '';

        // Fetch polygons from Jeff's endpoint
        console.log('📡 Fetching from /api/polygons with bbox:', bbox);
        const res = await fetch(`/api/polygons?bbox=${bbox}`);
        
        let data;
        if (!res.ok) {
          console.error('❌ Polygon fetch failed:', res.status, res.statusText);
          // Try without bbox as fallback
          const fallbackRes = await fetch('/api/polygons');
          data = await fallbackRes.json();
          console.log('📦 Fallback polygon data loaded:', data.features?.length || 0, 'features');
        } else {
          data = await res.json();
          console.log('📦 Polygon data loaded:', data.features?.length || 0, 'features');
        }

        // Count features by type
        const counts = {
          eddy: 0,
          edge: 0,
          filament: 0
        };

        if (data.features) {
          data.features.forEach((f: any) => {
            const type = f.properties?.class || f.properties?.type;
            if (type in counts) {
              counts[type as keyof typeof counts]++;
            }
          });
        }
        setStats(counts);

        // Add or update source
        if (!map.getSource(SOURCE_ID)) {
          map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: data
          });
        } else {
          (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(data);
        }

        // Add layers for each feature type
        Object.entries(LAYERS).forEach(([type, config]) => {
          // Remove existing layers if they exist
          if (map.getLayer(config.fill)) map.removeLayer(config.fill);
          if (map.getLayer(config.line)) map.removeLayer(config.line);

          // Add fill layer
          map.addLayer({
            id: config.fill,
            type: 'fill',
            source: SOURCE_ID,
            filter: ['any',
              ['==', ['get', 'class'], type],
              ['==', ['get', 'type'], type]
            ],
            paint: {
              'fill-color': config.color,
              'fill-opacity': 0.4  // More visible
            },
            layout: {
              'visibility': enabled[type as keyof typeof enabled] ? 'visible' : 'none'
            }
          });

          // Add line layer
          map.addLayer({
            id: config.line,
            type: 'line',
            source: SOURCE_ID,
            filter: ['any',
              ['==', ['get', 'class'], type],
              ['==', ['get', 'type'], type]
            ],
            paint: {
              'line-color': config.color,
              'line-width': 3,  // Thicker line
              'line-opacity': 1  // Fully opaque
            },
            layout: {
              'visibility': enabled[type as keyof typeof enabled] ? 'visible' : 'none'
            }
          });
          
          // Ensure polygons render above SST but below other UI elements
          // Move layers to proper z-order
          if (map.getLayer('sst-layer')) {
            // Place polygon layers above SST
            map.moveLayer(config.fill);
            map.moveLayer(config.line);
          }

          // Add click handler for popups
          map.on('click', config.fill, (e) => {
            if (!e.features?.[0]) return;
            const props = e.features[0].properties;
            if (!props) return;
            
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`
                <div style="padding: 8px; font-family: system-ui;">
                  <h3 style="margin: 0 0 8px 0; color: ${config.color}; font-size: 14px;">
                    ${config.label.slice(0, -1)} Feature
                  </h3>
                  <div style="font-size: 12px; line-height: 1.4;">
                    ${props.gradient_f_per_mi ? `<div>Gradient: <strong>${props.gradient_f_per_mi.toFixed(1)}°F/mi</strong></div>` : ''}
                    ${props.delta_f ? `<div>Temp Δ: <strong>${props.delta_f.toFixed(1)}°F</strong></div>` : ''}
                    ${props.warm_side_mean_f ? `<div>Warm side: <strong>${props.warm_side_mean_f.toFixed(1)}°F</strong></div>` : ''}
                    ${props.cool_side_mean_f ? `<div>Cool side: <strong>${props.cool_side_mean_f.toFixed(1)}°F</strong></div>` : ''}
                    ${props.confidence ? `<div>Confidence: <strong>${(props.confidence * 100).toFixed(0)}%</strong></div>` : ''}
                    ${props.notes ? `<div style="margin-top: 4px; font-style: italic;">${props.notes}</div>` : ''}
                  </div>
                </div>
              `)
              .addTo(map);
          });

          // Change cursor on hover
          map.on('mouseenter', config.fill, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', config.fill, () => {
            map.getCanvas().style.cursor = '';
          });
        });

      } catch (error) {
        console.error('Failed to load polygons:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadPolygons();

    // Reload on map move
    let debounceTimer: NodeJS.Timeout;
    const handleMoveEnd = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadPolygons, 500);
    };
    
    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      clearTimeout(debounceTimer);
    };
  }, [map]);

  // Update layer visibility when toggles change
  useEffect(() => {
    if (!map) return;

    Object.entries(LAYERS).forEach(([type, config]) => {
      const visibility = enabled[type as keyof typeof enabled] ? 'visible' : 'none';
      
      if (map.getLayer(config.fill)) {
        map.setLayoutProperty(config.fill, 'visibility', visibility);
      }
      if (map.getLayer(config.line)) {
        map.setLayoutProperty(config.line, 'visibility', visibility);
      }
    });
  }, [map, enabled]);

  const toggleFeature = (type: keyof typeof enabled) => {
    setEnabled(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const anyEnabled = Object.values(enabled).some(v => v);

  return (
    <div className="absolute top-20 right-4 z-20">
      {/* Main Toggle Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`
          px-4 py-2 rounded-full text-xs font-medium 
          flex items-center gap-2 transition-all
          ${anyEnabled 
            ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-300 border border-cyan-500/40' 
            : 'bg-black/70 text-gray-400 border border-gray-600/30 hover:text-cyan-300'
          }
          backdrop-blur-md shadow-lg
        `}
      >
        <Layers size={14} />
        <span>Polygons</span>
        {loading && <span className="text-[10px]">(Loading...)</span>}
        <ChevronDown 
          size={12} 
          className={`transition-transform ${showPanel ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {showPanel && (
        <div className="absolute top-full mt-2 right-0 bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/20 p-3 min-w-[200px] shadow-xl">
          <div className="text-[10px] text-cyan-400/60 font-medium uppercase tracking-wider mb-2">
            SST Features
          </div>
          
          <div className="space-y-1">
            {Object.entries(LAYERS).map(([type, config]) => {
              const Icon = config.icon;
              const count = stats[type as keyof typeof stats];
              const isEnabled = enabled[type as keyof typeof enabled];
              
              return (
                <button
                  key={type}
                  onClick={() => toggleFeature(type as keyof typeof enabled)}
                  className={`
                    w-full px-3 py-2 rounded-lg text-xs font-medium
                    flex items-center justify-between transition-all
                    ${isEnabled 
                      ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30' 
                      : 'bg-black/40 text-gray-400 border border-gray-600/30 hover:text-cyan-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={12} style={{ color: isEnabled ? config.color : undefined }} />
                    <span>{config.label}</span>
                  </div>
                  {count > 0 && (
                    <span className={`text-[10px] ${isEnabled ? 'text-cyan-400' : 'text-gray-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 pt-3 border-t border-cyan-500/20 space-y-1">
            <div className="text-[10px] text-cyan-400/60 font-medium uppercase tracking-wider mb-1">
              Classification
            </div>
            <div className="text-[10px] text-gray-400 space-y-0.5">
              <div className="flex items-center gap-2">
                <Circle size={8} className="text-green-400" />
                <span>Eddy: Circular (4 sides)</span>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch size={8} className="text-cyan-400" />
                <span>Filament: 3 sides</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={8} className="text-orange-400" />
                <span>Edge: 1-2 sides</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
