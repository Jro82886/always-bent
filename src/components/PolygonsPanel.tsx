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
  const [showPanel, setShowPanel] = useState(true); // Start open to show features
  const [enabled, setEnabled] = useState({
    eddy: true,     // ON by default - show oceanographic features
    edge: true,     // ON by default - show thermal fronts
    filament: true  // ON by default - show all features
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    eddy: 0,
    edge: 0,
    filament: 0
  });
  const [isLive, setIsLive] = useState(false);

  // Load polygons when map is ready and at least one layer is enabled
  useEffect(() => {
    if (!map) return;
    
    // Don't load if no layers are enabled
    const anyEnabled = Object.values(enabled).some(v => v);

    const loadPolygons = async () => {
      if (!anyEnabled) {
        
        return;
      }
      
      setLoading(true);
      try {
        const bounds = map.getBounds();
        const bbox = bounds ? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(',') : '';

        
        // Try REAL Copernicus data from Railway backend first
        let data;
        let usedLive = false;

        // Railway backend URL for real Copernicus data
        const railwayUrl = process.env.NEXT_PUBLIC_POLYGONS_URL || '';

        if (railwayUrl) {
          try {
            const bounds = map.getBounds();
            if (!bounds) return;
            const viewHeight = bounds.getNorth() - bounds.getSouth();

            // If viewing large area (> 10° lat), fetch multiple regions in parallel
            if (viewHeight > 10) {
              // Define East Coast regions for comprehensive coverage
              const regions = [
                { name: 'New England', bbox: '40,-72,45,-66' },      // Maine to CT
                { name: 'Mid-Atlantic', bbox: '37,-76,41,-70' },     // NJ to VA
                { name: 'Carolinas', bbox: '32,-80,37,-74' },        // NC/SC
                { name: 'Georgia', bbox: '30,-82,33,-78' },          // GA
                { name: 'North Florida', bbox: '27,-82,31,-79' },    // Jacksonville area
                { name: 'South Florida', bbox: '24,-82,28,-79' },    // Miami to Keys
              ];

              // Fetch all regions in parallel
              const results = await Promise.allSettled(
                regions.map(r =>
                  fetch(`${railwayUrl}/ocean-features/real?bbox=${r.bbox}`)
                    .then(res => res.ok ? res.json() : null)
                )
              );

              // Combine all features
              const allFeatures: any[] = [];
              results.forEach((result, i) => {
                if (result.status === 'fulfilled' && result.value?.features) {
                  console.log(`${regions[i].name}: ${result.value.features.length} features`);
                  allFeatures.push(...result.value.features);
                }
              });

              if (allFeatures.length > 0) {
                data = { type: 'FeatureCollection', features: allFeatures };
                usedLive = true;
                console.log(`Loaded ${allFeatures.length} REAL Copernicus features from ${regions.length} regions`);
              }
            } else {
              // Single region fetch for zoomed-in views
              const realBbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
              const res = await fetch(`${railwayUrl}/ocean-features/real?bbox=${realBbox}`);
              if (res.ok) {
                const realData = await res.json();
                if (realData.features && realData.features.length > 0) {
                  data = realData;
                  usedLive = true;
                  console.log(`Loaded ${realData.features.length} REAL Copernicus features`);
                }
              }
            }
          } catch (e) {
            console.log('Real Copernicus data failed, trying local detection');
          }
        }

        // Try local tile-based detection if Railway failed
        if (!data || !data.features?.length) {
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
        }

        // Fall back to static GeoJSON data (real Copernicus data from previous fetch)
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

        // Count features by class (not type)
        const counts = { eddy: 0, edge: 0, filament: 0 };
        data.features?.forEach((f: any) => {
          const featureClass = f.properties?.class; // API uses 'class' not 'type'
          if (featureClass && counts[featureClass as keyof typeof counts] !== undefined) {
            counts[featureClass as keyof typeof counts]++;
          }
        });
        setStats(counts);


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
