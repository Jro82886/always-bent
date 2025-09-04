export type BBoxLngLat = { west: number; south: number; east: number; north: number } | null;

import { createContext, useContext, useMemo, useState } from 'react';

type UIState = {
  dateISO: string;
  setDateISO: (d: string) => void;
  snipEnabled: boolean;
  setSnipEnabled: (v: boolean) => void;
  bbox: BBoxLngLat;
  setBBox: (b: BBoxLngLat) => void;
};

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [dateISO, setDateISO] = useState<string>(new Date().toISOString().slice(0,10));
  const [snipEnabled, setSnipEnabled] = useState(false);
  const [bbox, setBBox] = useState<BBoxLngLat>(null);

  const value = useMemo(
    () => ({ dateISO, setDateISO, snipEnabled, setSnipEnabled, bbox, setBBox }),
    [dateISO, snipEnabled, bbox]
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(){
  const ctx = useContext(UIContext);
  if(!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}
