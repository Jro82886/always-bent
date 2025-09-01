// src/components/DevOverlay.tsx
'use client';

import { useMapbox } from '@/lib/MapCtx';

export default function DevOverlay() {
  const map = useMapbox();
  if (!map) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        padding: '4px 8px',
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        fontSize: 12,
        borderRadius: 4,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      [DevOverlay] map ready
    </div>
  );
}

