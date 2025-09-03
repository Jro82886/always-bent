'use client';
import { useState } from 'react';
import type mapboxgl from 'mapbox-gl';

type Props = { map?: mapboxgl.Map };

export default function SnipTool({ map }: Props) {
  const [active, setActive] = useState(false);
  return (
    <>
      <button
        onClick={() => setActive((a) => !a)}
        style={{ position: 'fixed', top: 16, right: 16, zIndex: 10000, padding: '8px 12px', border: '1px solid #333', borderRadius: 8, background: '#111', color: '#0ff' }}
      >
        {active ? 'Cancel Snip' : 'Snip / Analyze'}
      </button>
      {active && (
        <div
          onClick={() => { setActive(false); console.log('Snip placeholder fired'); }}
          style={{ position: 'fixed', inset: 0 as any, background: 'rgba(0,0,0,0.05)', zIndex: 9999, cursor: 'crosshair' }}
        />
      )}
    </>
  );
}


