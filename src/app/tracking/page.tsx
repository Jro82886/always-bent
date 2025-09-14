'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapShell } from '@/lib/MapRef';
import { useMapbox } from '@/lib/MapCtx';
import TopHUD from '@/components/TopHUD';
import GeoControls from '@/components/GeoControls';
// Removed ReportCatchButton - should only be on Analysis tab
import RequireUsername from '@/components/RequireUsername';
import { useGeo } from '@/lib/useGeo';
import DevOverlay from '@/components/DevOverlay';
import { useAppState } from '@/store/appState';
import { INLETS } from '@/lib/inlets';
import NavTabs from '@/components/NavTabs';
import { ensureTrackingLayers, upsertTrackingSource } from './_layers/userDot';
import VesselTracker from '@/components/VesselTracker';
import { Users, Radio, Waves, Activity, TrendingUp, Map, AlertCircle, Navigation } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import FleetCommand from '@/components/tracking/FleetCommand';

type Pos = { lat: number; lng: number } | null;

function colorForInlet(id: string | null) {
  const c: Record<string, string> = {
    'portland-harbor': '#26c281',  // Green
    'cape-cod-canal-east': '#26c281',  // Green
    'point-judith-harbor': '#00bdff',  // Light blue
    'montauk-harbor': '#4169E1',  // Blue
    'shinnecock-inlet': '#4169E1',  // Blue
    'barnegat-inlet': '#f39c12',  // Orange
    'manasquan-inlet': '#00CED1',  // Turquoise
    'absecon-inlet': '#FF8C00',  // Dark Orange
    'indian-river-inlet': '#FF8C00',  // Dark Orange
    'ocean-city-inlet': '#e74c3c',  // Red
    'chincoteague-inlet': '#e74c3c',  // Red
    'east-coast': '#26c281',  // Default green
  };
  return c[id ?? 'east-coast'] ?? '#26c281';
}

export default function TrackingPage() {
  const map = useMapbox();
  const { selectedInletId, username } = useAppState();
  const active = INLETS.find(i => i.id === selectedInletId) ?? INLETS[0];
  const { coords, status, message } = useGeo();
  const pos: Pos = coords ? { lat: coords.lat, lng: coords.lon } : null;
  
  // Get boat name from localStorage
  const [boatName, setBoatName] = useState<string>('');
  useEffect(() => {
    const stored = localStorage.getItem('abfi_boat_name');
    if (stored) setBoatName(stored);
  }, []);
  
  // Tracking feature toggles
  const [showVessels, setShowVessels] = useState(true);
  const [showTrails, setShowTrails] = useState(false); // Progressive disclosure - off by default
  const [showRecBoats, setShowRecBoats] = useState(false);
  const [showAIS, setShowAIS] = useState(false);
  const [showGFW, setShowGFW] = useState(false);
  const [isTracking, setIsTracking] = useState(true); // Auto-start sharing (fair exchange)
  const [fleetData, setFleetData] = useState<any>(null);
  const [lastPosition, setLastPosition] = useState<Pos>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [stoppedSharingNotice, setStoppedSharingNotice] = useState(false);
  const fleetIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fair sharing: Only see others if you're sharing
  const canSeeFleet = isTracking && showVessels;

  // Calculate speed and heading from position changes
  const calculateSpeed = useCallback((pos1: Pos, pos2: Pos): number => {
    if (!pos1 || !pos2) return 0;
    
    // Haversine formula for distance
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Speed in knots (distance in nm / time in hours)
    const timeHours = 30 / 3600; // 30 seconds in hours
    return Math.round(distance / timeHours * 10) / 10;
  }, []);

  const calculateHeading = useCallback((pos1: Pos, pos2: Pos): number => {
    if (!pos1 || !pos2) return 0;
    
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(pos2.lat * Math.PI / 180);
    const x = Math.cos(pos1.lat * Math.PI / 180) * Math.sin(pos2.lat * Math.PI / 180) -
      Math.sin(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * Math.cos(dLon);
    const heading = Math.atan2(y, x) * 180 / Math.PI;
    
    return (heading + 360) % 360;
  }, []);

  // Record position to database
  const recordPosition = useCallback(async () => {
    if (!pos || !username) return;
    
    const speed = lastPosition ? calculateSpeed(lastPosition, pos) : 0;
    const heading = lastPosition ? calculateHeading(lastPosition, pos) : 0;
    
    try {
      const response = await fetch('/api/tracking/position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: username,
          username,
          inlet_id: selectedInletId,
          lat: pos.lat,
          lng: pos.lng,
          speed,
          heading,
          session_id: sessionId
        })
      });
      
      if (response.ok) {
        setLastPosition(pos);
        console.log('Position recorded:', { lat: pos.lat, lng: pos.lng, speed });
      }
    } catch (error) {
      console.error('Failed to record position:', error);
    }
  }, [pos, username, selectedInletId, sessionId, lastPosition, calculateSpeed, calculateHeading]);

  // Start/stop tracking
  useEffect(() => {
    if (isTracking && pos) {
      // Record immediately
      recordPosition();
      
      // Then record every 30 seconds
      positionIntervalRef.current = setInterval(recordPosition, 30000);
      
      return () => {
        if (positionIntervalRef.current) {
          clearInterval(positionIntervalRef.current);
        }
      };
    }
  }, [isTracking, recordPosition, pos]);

  // Mapbox-native tracking layers (for V2-scale, ok to keep now)
  useEffect(() => {
    if (!map) return;
    const add = () => {
      ensureTrackingLayers(map);
      const me: any = pos ? {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [pos.lng, pos.lat] },
        properties: { type: 'user', color: colorForInlet(selectedInletId), label: boatName || username || 'You' }
      } : null;
      upsertTrackingSource(map, me ? [me] : []);
    };
    if ((map as any).isStyleLoaded?.()) add();
    else map.once('style.load', add);
  }, [map, pos, selectedInletId, username, boatName]);

  // Add/remove GFW fishing activity layer
  useEffect(() => {
    if (!map) return;

    const addGFWLayer = () => {
      if (showGFW) {
        // Add GFW fishing activity source if it doesn't exist
        if (!map.getSource('gfw-fishing')) {
          map.addSource('gfw-fishing', {
            type: 'raster',
            tiles: [
              'https://gateway.api.globalfishingwatch.org/v2/tilesets/public-fishing-effort:v20231026/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: 'Global Fishing Watch'
          });
        }

        // Add the layer with cyan theming
        if (!map.getLayer('gfw-fishing-layer')) {
          map.addLayer({
            id: 'gfw-fishing-layer',
            type: 'raster',
            source: 'gfw-fishing',
            paint: {
              'raster-opacity': 0.7,
              'raster-hue-rotate': 180, // Shift colors to cyan
              'raster-saturation': 0.3,
              'raster-contrast': 0.1
            }
          });
        }
      } else {
        // Remove layer if it exists
        if (map.getLayer('gfw-fishing-layer')) {
          map.removeLayer('gfw-fishing-layer');
        }
      }
    };

    if ((map as any).isStyleLoaded?.()) {
      addGFWLayer();
    } else {
      map.once('style.load', addGFWLayer);
    }

    return () => {
      if (map.getLayer('gfw-fishing-layer')) {
        map.removeLayer('gfw-fishing-layer');
      }
    };
  }, [map, showGFW]);

  // Fetch fleet positions (only if sharing)
  const fetchFleet = useCallback(async () => {
    if (!canSeeFleet) {
      setFleetData(null); // Clear fleet data if not sharing
      return;
    }
    
    try {
      const response = await fetch(`/api/tracking/fleet?inlet_id=${selectedInletId}&hours=4`);
      if (response.ok) {
        const data = await response.json();
        setFleetData(data.fleet);
      }
    } catch (error) {
      console.error('Failed to fetch fleet:', error);
    }
  }, [selectedInletId, canSeeFleet]);

  // Auto-refresh fleet positions every 60 seconds (only if sharing)
  useEffect(() => {
    if (canSeeFleet) {
      fetchFleet(); // Initial fetch
      fleetIntervalRef.current = setInterval(fetchFleet, 60000); // Every 60 seconds
      
      return () => {
        if (fleetIntervalRef.current) {
          clearInterval(fleetIntervalRef.current);
        }
      };
    } else {
      // Clear fleet data if not sharing
      setFleetData(null);
    }
  }, [canSeeFleet, fetchFleet]);

  // Render fleet on map (only if sharing)
  useEffect(() => {
    if (!map || !fleetData || !canSeeFleet) return;

    const addFleetLayer = () => {
      // Remove existing fleet layers
      if (map.getLayer('fleet-dots')) map.removeLayer('fleet-dots');
      if (map.getLayer('fleet-labels')) map.removeLayer('fleet-labels');
      if (map.getLayer('fleet-trails')) map.removeLayer('fleet-trails');
      if (map.getSource('fleet-source')) map.removeSource('fleet-source');
      if (map.getSource('fleet-trails-source')) map.removeSource('fleet-trails-source');

      // Create GeoJSON for vessel dots
      const dotsGeoJSON: any = {
        type: 'FeatureCollection',
        features: fleetData.vessels.map((vessel: any) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [vessel.current_position.lng, vessel.current_position.lat]
          },
          properties: {
            boat_name: vessel.boat_name,
            is_fishing: vessel.is_fishing,
            minutes_ago: vessel.minutes_ago,
            speed: vessel.current_position.speed || 0,
            inlet_color: colorForInlet(vessel.inlet_id)
          }
        }))
      };

      // Add source for dots
      map.addSource('fleet-source', {
        type: 'geojson',
        data: dotsGeoJSON
      });

      // Add vessel dots layer
      map.addLayer({
        id: 'fleet-dots',
        type: 'circle',
        source: 'fleet-source',
        paint: {
          'circle-radius': [
            'case',
            ['get', 'is_fishing'], 8,  // Bigger when fishing
            6  // Normal size when moving
          ],
          'circle-color': ['get', 'inlet_color'],
          'circle-opacity': [
            'interpolate', ['linear'], ['get', 'minutes_ago'],
            0, 1,    // Just seen = full opacity
            30, 0.7,  // 30 min ago = 70% opacity
            60, 0.3   // 1 hour ago = 30% opacity
          ],
          'circle-stroke-width': [
            'case',
            ['get', 'is_fishing'], 3,  // Thick border when fishing
            1  // Thin border when moving
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.8
        }
      });

      // Add labels (boat names) - only show on hover for clean look
      map.addLayer({
        id: 'fleet-labels',
        type: 'symbol',
        source: 'fleet-source',
        layout: {
          'text-field': ['get', 'boat_name'],
          'text-size': 11,
          'text-offset': [0, 1.5],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        },
        filter: ['==', ['get', 'boat_name'], ''] // Start with no labels
      });

      // Add trails if enabled
      if (showTrails) {
        const trailsGeoJSON: any = {
          type: 'FeatureCollection',
          features: fleetData.vessels.map((vessel: any) => ({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: vessel.trail.map((p: any) => [p.lng, p.lat])
            },
            properties: {
              boat_name: vessel.boat_name,
              avg_speed: vessel.avg_speed,
              inlet_color: colorForInlet(vessel.inlet_id)
            }
          })).filter((f: any) => f.geometry.coordinates.length > 1)
        };

        map.addSource('fleet-trails-source', {
          type: 'geojson',
          data: trailsGeoJSON
        });

        map.addLayer({
          id: 'fleet-trails',
          type: 'line',
          source: 'fleet-trails-source',
          paint: {
            'line-color': ['get', 'inlet_color'],
            'line-opacity': 0.3,
            'line-width': [
              'interpolate', ['linear'], ['get', 'avg_speed'],
              0, 3,   // Stopped = thick line (fishing)
              3, 2,   // Slow = medium line
              10, 1   // Fast = thin line (transit)
            ]
          }
        }, 'fleet-dots'); // Place trails under dots
      }

      // Add hover effect for boat names
      let hoveredBoat: string | null = null;
      
      map.on('mousemove', 'fleet-dots', (e) => {
        if (e.features && e.features[0]) {
          const boatName = e.features[0].properties?.boat_name;
          if (boatName !== hoveredBoat) {
            hoveredBoat = boatName;
            map.setFilter('fleet-labels', ['==', ['get', 'boat_name'], boatName]);
          }
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      map.on('mouseleave', 'fleet-dots', () => {
        hoveredBoat = null;
        map.setFilter('fleet-labels', ['==', ['get', 'boat_name'], '']);
        map.getCanvas().style.cursor = '';
      });

      // Click for details popup
      map.on('click', 'fleet-dots', (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          const coords = e.features[0].geometry as any;
          
          new mapboxgl.Popup()
            .setLngLat(coords.coordinates)
            .setHTML(`
              <div style="padding: 8px; font-family: system-ui;">
                <h3 style="margin: 0 0 8px 0; color: ${props?.inlet_color}; font-size: 14px;">
                  ${props?.boat_name}
                </h3>
                <div style="font-size: 12px; color: #e0e0e0;">
                  <div>Status: <strong>${props?.is_fishing ? 'Fishing' : 'Moving'}</strong></div>
                  <div>Speed: <strong>${props?.speed?.toFixed(1) || '0'} kts</strong></div>
                  <div>Last update: <strong>${props?.minutes_ago} min ago</strong></div>
                </div>
              </div>
            `)
            .addTo(map);
        }
      });
    };

    if ((map as any).isStyleLoaded?.()) {
      addFleetLayer();
    } else {
      map.once('style.load', addFleetLayer);
    }
  }, [map, fleetData, canSeeFleet, showTrails]);

  return (
    <RequireUsername>
    <div className="w-full h-screen bg-gray-950">
    <MapShell>
      <div className="pointer-events-none absolute inset-0">
        <NavTabs />
        <TopHUD includeAbfi={false} showLayers={false} extraRight={
          <div className="flex items-center gap-2">
            <GeoControls />
          </div>
        } />
      </div>
      
      {/* Fleet Command Center - Modern Tracking UI */}
      <FleetCommand 
        isTracking={isTracking}
        onToggleTracking={() => setIsTracking(!isTracking)}
        fleetCount={fleetData?.total_active || 0}
        fishingCount={fleetData?.fishing_now || 0}
        showFleet={showVessels}
        onToggleFleet={() => {
          if (!isTracking) {
            setShowVessels(true); // Trigger the fair sharing notice
          } else {
            setShowVessels(!showVessels);
          }
        }}
        showTrails={showTrails}
        onToggleTrails={() => setShowTrails(!showTrails)}
        showGFW={showGFW}
        onToggleGFW={() => setShowGFW(!showGFW)}
        userSpeed={pos && lastPosition ? calculateSpeed(lastPosition, pos) : 0}
        userHeading={pos && lastPosition ? calculateHeading(lastPosition, pos) : 0}
        boatName={boatName || 'My Vessel'}
      />
      
      {/* Keep essential vessel tracking */}
      <VesselTracker 
        map={map} 
        inletId={selectedInletId || 'overview'} 
        enabled={showVessels}
      />
      
      {/* User position dot */}
      <UserDot pos={pos} color={colorForInlet(selectedInletId)} label={boatName || username || 'You'} />
      
      {/* Location status message */}
      {message && (
        <div className="absolute bottom-4 right-4 z-20 bg-gray-950/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm max-w-xs">
          {message}. Make sure location services are enabled.
        </div>
      )}
      
      <DevOverlay />
    </MapShell>
    </div>
    </RequireUsername>
  );
}

function UserDot({ pos, color, label }: { pos: Pos; color: string; label: string }) {
  const map = useMapbox();
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!elRef.current) {
      elRef.current = document.createElement('div');
      Object.assign(elRef.current.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        zIndex: '15',
      });
      document.body.appendChild(elRef.current);
    }
    return () => {
      elRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map || !elRef.current) return;
    let raf = 0;

    const draw = () => {
      if (!elRef.current) return;
      if (!pos) {
        elRef.current.innerHTML = '';
      } else {
        const p = map.project([pos.lng, pos.lat]);
        elRef.current.innerHTML = `
          <div title="${label}"
            style="
              position:absolute;
              transform: translate(${p.x - 6}px, ${p.y - 6}px);
              width:12px;height:12px;border-radius:9999px;
              background:${color};
              box-shadow: 0 0 0 2px rgba(0,0,0,0.45);
            ">
          </div>
        `;
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [map, pos, color, label]);

  return null;
}


