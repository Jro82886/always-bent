'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type BBoxLngLat = { west: number; south: number; east: number; north: number } | null;

type UIState = {
  day: 'latest'|'today'|'-1d'|'-2d'|'-3d';
  setDay: (d: 'latest'|'today'|'-1d'|'-2d'|'-3d') => void;
  iso: string; setIso: (s: string) => void;
  sstOn: boolean; setSstOn: (v: boolean) => void;
  polygonsOn: boolean; setPolygonsOn: (v: boolean) => void;
  snipOn: boolean; setSnipOn: (v: boolean) => void;
  trackingOn: boolean; setTrackingOn: (v: boolean) => void;
};

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [day, setDay] = useState<'latest'|'today'|'-1d'|'-2d'|'-3d'>('latest');
  const [iso, setIso] = useState<string>('');
  const [sstOn, setSstOn] = useState<boolean>(false);
  const [polygonsOn, setPolygonsOn] = useState<boolean>(false);
  const [snipOn, setSnipOn] = useState<boolean>(false);
  const [trackingOn, setTrackingOn] = useState<boolean>(false);

  // Resolve latest ISO on mount and refresh every 15 minutes when using Latest
  useEffect(() => {
    const resolve = () => {
      const d = new Date();
      d.setUTCHours(0,0,0,0);
      const base = new Date(d);
      switch (day) {
        case 'latest':
        case 'today': break;
        case '-1d': base.setUTCDate(base.getUTCDate() - 1); break;
        case '-2d': base.setUTCDate(base.getUTCDate() - 2); break;
        case '-3d': base.setUTCDate(base.getUTCDate() - 3); break;
      }
      setIso(base.toISOString().slice(0,10));
    };
    resolve();
    const id = setInterval(resolve, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [day]);

  const value = useMemo(() => ({ day, setDay, iso, setIso, sstOn, setSstOn, polygonsOn, setPolygonsOn, snipOn, setSnipOn, trackingOn, setTrackingOn }), [day, iso, sstOn, polygonsOn, snipOn, trackingOn]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(){
  const ctx = useContext(UIContext);
  if(!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}


