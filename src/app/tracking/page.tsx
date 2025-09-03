'use client';

import { useEffect, useRef } from 'react';
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


