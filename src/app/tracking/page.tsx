'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapShell } from '@/lib/MapRef';
import { useMapbox } from '@/lib/MapCtx';
import TopHUD from '@/components/TopHUD';
import GeoControls from '@/components/GeoControls';
import ReportCatchButton from '@/components/ReportCatchButton';
import RequireUsername from '@/components/RequireUsername';
import { useGeo } from '@/lib/useGeo';
import DevOverlay from '@/components/DevOverlay';
import { useAppState } from '@/store/appState';
import { INLETS } from '@/lib/inlets';
import NavTabs from '@/components/NavTabs';
import { ensureTrackingLayers, upsertTrackingSource } from './_layers/userDot';
import VesselTracker from '@/components/VesselTracker';
import { Users, Radio, Waves, Activity, TrendingUp, Map, AlertCircle, Navigation } from 'lucide-react';

type Pos = { lat: number; lng: number } | null;

function colorForInlet(id: string | null) {
  const c: Record<string, string> = {
    'md-ocean-city': '#00bdff',
    'de-indian_river': '#26c281',
    'nj-barnegat': '#f39c12',
    'ga-savannah': '#9b59b6',
    'fl-miami': '#e74c3c',
    'east-coast': '#2ecc71',
  };
  return c[id ?? 'east-coast'] ?? '#2ecc71';
}

export default function TrackingPage() {
  const map = useMapbox();
  const { selectedInletId, username } = useAppState();
  const active = INLETS.find(i => i.id === selectedInletId) ?? INLETS[0];
  const { coords, status, message } = useGeo();
  const pos: Pos = coords ? { lat: coords.lat, lng: coords.lon } : null;
  
  // Tracking feature toggles
  const [showVessels, setShowVessels] = useState(true);
  const [showRecBoats, setShowRecBoats] = useState(false);
  const [showAIS, setShowAIS] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [lastPosition, setLastPosition] = useState<Pos>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        properties: { type: 'user', color: colorForInlet(selectedInletId), label: username || 'You' }
      } : null;
      upsertTrackingSource(map, me ? [me] : []);
    };
    if ((map as any).isStyleLoaded?.()) add();
    else map.once('style.load', add);
  }, [map, pos, selectedInletId, username]);

  return (
    <RequireUsername>
    <MapShell>
      <div className="pointer-events-none absolute inset-0">
        <NavTabs />
        <TopHUD includeAbfi={false} showLayers={false} extraRight={
          <div className="flex items-center gap-2">
            <GeoControls />
            <ReportCatchButton disabled={process.env.NEXT_PUBLIC_ENABLE_REPORT_CATCH !== 'true'} />
          </div>
        } />
      </div>
      
      {/* Tracking Controls */}
      <div className="absolute top-20 left-4 flex flex-col gap-2 pointer-events-auto">
        {/* Position Recording Toggle */}
        <div className="bg-black/70 backdrop-blur-md rounded-full px-4 py-3 border border-cyan-500/20">
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isTracking 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30 animate-pulse' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}
          >
            <Navigation size={14} className={isTracking ? 'animate-spin' : ''} />
            {isTracking ? 'TRACKING ACTIVE' : 'START TRACKING'}
          </button>
          {isTracking && (
            <div className="text-xs text-green-400/70 mt-2 text-center">
              Recording position every 30s
            </div>
          )}
        </div>
        
        <div className="bg-black/70 backdrop-blur-md rounded-full px-4 py-2 border border-cyan-500/20">
          <h3 className="text-cyan-400 text-xs font-semibold mb-2">Fleet Tracking</h3>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setShowVessels(!showVessels)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                showVessels 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                  : 'bg-black/40 text-gray-400 border border-gray-600/30'
              }`}
            >
              <Users size={12} />
              Local Fleet
            </button>
            <button
              onClick={() => setShowRecBoats(!showRecBoats)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                showRecBoats 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                  : 'bg-black/40 text-gray-400 border border-gray-600/30'
              }`}
            >
              <Waves size={12} />
              Rec Boats
              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Soon</span>
            </button>
            <button
              onClick={() => setShowAIS(!showAIS)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                showAIS 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                  : 'bg-black/40 text-gray-400 border border-gray-600/30'
              }`}
            >
              <Radio size={12} />
              AIS/GFW
              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Soon</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Vessel Tracker Component */}
      <VesselTracker 
        map={map} 
        inletId={selectedInletId || 'overview'} 
        enabled={showVessels}
      />
      
      <DevOverlay />
      <UserDot pos={pos} color={colorForInlet(selectedInletId)} label={username || 'You'} />
      {message && (
        <div
          style={{
            position: 'absolute', bottom: 12, right: 12, zIndex: 20,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            padding: '8px 10px', borderRadius: 8, fontSize: 12,
            maxWidth: 280, lineHeight: 1.4
          }}
        >
          {message}. Make sure location services are enabled for this site.
        </div>
      )}
    </MapShell>
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


