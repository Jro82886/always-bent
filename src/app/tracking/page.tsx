'use client';

import { useEffect, useRef, useState } from 'react';
import { MapShell } from '@/lib/MapRef';
import { useMapbox } from '@/lib/MapCtx';
import { TopBar } from '@/components/TopBar';
import DevOverlay from '@/components/DevOverlay';
import { useAppState } from '@/store/appState';
import { INLETS } from '@/lib/inlets';

type Pos = { lat: number; lng: number } | null;

function colorForInlet(id: string | null) {
  const c: Record<string, string> = {
    'md-ocean-city': '#00bdff',
    'de-indian-river': '#26c281',
    'nj-barnegat': '#f39c12',
    'ga-savannah': '#9b59b6',
    'fl-miami': '#e74c3c',
    'east-coast': '#2ecc71',
  };
  return c[id ?? 'east-coast'] ?? '#2ecc71';
}

export default function TrackingPage() {
  const { selectedInletId, username } = useAppState();
  const active = INLETS.find(i => i.id === selectedInletId) ?? INLETS[0];

  const [pos, setPos] = useState<Pos>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by this browser.');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setPos({ lat: coords.latitude, lng: coords.longitude });
        setGeoError(null);
      },
      (err) => setGeoError(err.message || 'Location error'),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return (
    <MapShell initialCenter={[active.lng, active.lat]} initialZoom={9}>
      <TopBar />
      <DevOverlay />
      <UserDot pos={pos} color={colorForInlet(selectedInletId)} label={username || 'You'} />
      {geoError && (
        <div
          style={{
            position: 'absolute', bottom: 12, right: 12, zIndex: 20,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            padding: '8px 10px', borderRadius: 8, fontSize: 12,
            maxWidth: 280, lineHeight: 1.4
          }}
        >
          {geoError}. Make sure location services are enabled for this site.
        </div>
      )}
    </MapShell>
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


