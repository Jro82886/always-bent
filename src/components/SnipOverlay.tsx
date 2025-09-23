'use client';
import { useEffect, useRef } from 'react';

export default function SnipOverlay({ onBox }: { onBox: (bbox:[number,number,number,number])=>void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    let start: {x:number;y:number}|null = null;
    let rect: HTMLDivElement|null = null;

    const down = (e:MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      start = { x: e.clientX, y: e.clientY };
      rect = document.createElement('div');
      rect.style.cssText = 'position:fixed;border:2px dashed #00ffc8;background:rgba(0,255,200,.1);z-index:2147483647;pointer-events:none;';
      document.body.appendChild(rect);
    };
    const move = (e:MouseEvent) => {
      if (!start || !rect) return;
      const x = Math.min(e.clientX, start.x);
      const y = Math.min(e.clientY, start.y);
      const w = Math.abs(e.clientX - start.x);
      const h = Math.abs(e.clientY - start.y);
      rect.style.left = x+'px'; rect.style.top = y+'px';
      rect.style.width = w+'px'; rect.style.height = h+'px';
    };
    const up = (e:MouseEvent) => {
      if (!start || !rect) return;
      const x1 = Math.min(e.clientX, start.x);
      const y1 = Math.min(e.clientY, start.y);
      const x2 = Math.max(e.clientX, start.x);
      const y2 = Math.max(e.clientY, start.y);
      rect.remove(); rect = null; start = null;

      // screen->lngLat
      const map = (window as any).mapboxMap;
      const sw = map.unproject([x1, y2]);
      const ne = map.unproject([x2, y1]);
      onBox([sw.lng, sw.lat, ne.lng, ne.lat]);
    };

    el.addEventListener('mousedown', down, { passive:false });
    window.addEventListener('mousemove', move, { passive:false });
    window.addEventListener('mouseup', up, { passive:false });
    return () => {
      el.removeEventListener('mousedown', down as any);
      window.removeEventListener('mousemove', move as any);
      window.removeEventListener('mouseup', up as any);
    };
  }, [onBox]);

  return (
    <div
      ref={ref}
      style={{
        position:'absolute', inset:0, zIndex:2147483646,
        cursor:'crosshair', background:'transparent'
      }}
      aria-label="Snip Overlay"
    />
  );
}
