'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useMapbox } from '@/lib/MapCtx';

type BaseStyle = { id: string; url: string; label: string };

const BASE_STYLES: BaseStyle[] = [
  { id: 'dark',      url: 'mapbox://styles/mapbox/dark-v11',      label: 'Dark' },
  { id: 'satellite', url: 'mapbox://styles/mapbox/satellite-v9',  label: 'Satellite' },
  { id: 'streets',   url: 'mapbox://styles/mapbox/streets-v12',   label: 'Streets' },
];

function getInitialStyleUrl(): string {
  if (typeof window === 'undefined') return BASE_STYLES[0].url;
  try { return localStorage.getItem('abfi:basemap') ?? BASE_STYLES[0].url; } catch { return BASE_STYLES[0].url; }
}

export default function BasemapControl() {
  const map = useMapbox();
  const [open, setOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>(getInitialStyleUrl());
  const menuRef = useRef<HTMLDivElement | null>(null);

  const current = useMemo(() => BASE_STYLES.find(s => s.url === currentUrl) ?? BASE_STYLES[0], [currentUrl]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      if (menuRef.current && !menuRef.current.contains(e.target as any)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const applyStyle = (style: BaseStyle) => {
    if (!map) return;
    try { localStorage.setItem('abfi:basemap', style.url); } catch {}
    setCurrentUrl(style.url);
    try { map.setStyle(style.url); } catch {}
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <Tooltip.Provider delayDuration={150}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="rounded-md bg-white/10 px-2 py-1 text-xs text-white/85 ring-1 ring-white/15 hover:bg-white/15"
              style={{ lineHeight: 1.1 }}
            >
              🗺️ Basemap: {current.label}
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom" align="end" sideOffset={6} className="rounded bg-black/80 px-2 py-1 text-[11px] text-white shadow ring-1 ring-white/10">
              Switch the underlying map style
              <Tooltip.Arrow className="fill-black/80" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
      {open && (
        <div className="absolute right-0 mt-1 w-40 rounded-md bg-black/85 text-white text-sm ring-1 ring-white/10 shadow-lg backdrop-blur">
          {BASE_STYLES.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => applyStyle(s)}
              className={[
                'block w-full text-left px-3 py-2 hover:bg-white/10',
                s.url === currentUrl ? 'text-cyan-300' : 'text-white/85'
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


