'use client';
import { useEffect, useState } from 'react';
import { useAppState } from '@/lib/store';

export default function RestrictToggle() {
  const restrictToInlet = useAppState(s => s.restrictToInlet);
  const setOverride = useAppState(s => s.setRestrictOverride);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if NOT production, or a special debug query is present
    const isProd = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
    const dbg = new URLSearchParams(window.location.search).has('debug');
    setVisible(!isProd || dbg);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', 
      bottom: 96, 
      right: 16, 
      zIndex: 9999,
      padding: '10px 12px', 
      borderRadius: 12, 
      backdropFilter: 'blur(10px)',
      background: 'rgba(20,20,30,0.6)', 
      color: '#e6f8ff', 
      fontSize: 13
    }}>
      <div style={{ marginBottom: 6, opacity: 0.8 }}>Restrict to inlet (runtime)</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button 
          onClick={() => setOverride(true)}  
          style={{
            padding: '6px 10px', 
            borderRadius: 8,
            background: restrictToInlet === true ? '#00e676' : 'rgba(255,255,255,0.1)',
            border: 'none',
            color: restrictToInlet === true ? '#000' : '#fff',
            cursor: 'pointer'
          }}
        >
          ON
        </button>
        <button 
          onClick={() => setOverride(false)} 
          style={{
            padding: '6px 10px', 
            borderRadius: 8,
            background: restrictToInlet === false ? '#00e676' : 'rgba(255,255,255,0.1)',
            border: 'none',
            color: restrictToInlet === false ? '#000' : '#fff',
            cursor: 'pointer'
          }}
        >
          OFF
        </button>
        <button 
          onClick={() => setOverride(null)}  
          style={{
            padding: '6px 10px', 
            borderRadius: 8, 
            opacity: 0.8,
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
        <span style={{ marginLeft: 8, opacity: 0.8 }}>
          Now: <b>{String(restrictToInlet)}</b>
        </span>
      </div>
    </div>
  );
}
