'use client';
import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { ABFI_LAYERS } from '@/map/layersConfig';
import { setLayerVisible } from '@/map/toggleLayer';

export default function LayerToggles({ map }: { map: mapboxgl.Map | null }) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(ABFI_LAYERS.map(l => [l.key, !!l.defaultOn]))
  );

  useEffect(() => {
    if (!map) return;
    ABFI_LAYERS.forEach(l => setLayerVisible(map, l.lyr, state[l.key]));
  }, [map]);

  const onToggle = (key: string) => {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    const layer = ABFI_LAYERS.find(l => l.key === key)!;
    if (map) setLayerVisible(map, layer.lyr, next[key]);
  };

  return (
    <div style={{ position:'absolute', top:12, left:12, padding:8,
      borderRadius:8, backdropFilter:'blur(6px)',
      background:'rgba(0,0,0,0.35)', color:'#fff', fontSize:14 }}>
      {ABFI_LAYERS.map(l => (
        <button key={l.key}
          onClick={() => onToggle(l.key)}
          style={{ margin:4, padding:'6px 10px', borderRadius:6,
            border:'1px solid rgba(255,255,255,0.25)',
            background: state[l.key] ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.25)',
            color:'#fff', cursor:'pointer' }}>
          {l.label}
        </button>
      ))}
    </div>
  );
}