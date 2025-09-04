'use client';
import { useEffect, useRef, useState } from 'react';
import { useUI } from '@/state/ui';
import { getMap } from './MapStage';

type Pt = { x:number; y:number };

export default function SnipOverlay(){
  const { snipEnabled, setBBox } = useUI();
  const overlayRef = useRef<HTMLDivElement|null>(null);
  const [dragStart, setDragStart] = useState<Pt|null>(null);
  const [rect, setRect] = useState<{left:number; top:number; width:number; height:number}|null>(null);

  useEffect(()=>{ if(!snipEnabled){ setRect(null); setDragStart(null); } },[snipEnabled]);
  if(!snipEnabled) return null;

  const onDown=(e: React.MouseEvent)=>{
    const el = overlayRef.current!; const b = el.getBoundingClientRect();
    setDragStart({ x: e.clientX - b.left, y: e.clientY - b.top });
    setRect({ left: e.clientX - b.left, top: e.clientY - b.top, width:0, height:0 });
  };
  const onMove=(e: React.MouseEvent)=>{
    if(!dragStart) return; const el = overlayRef.current!; const b = el.getBoundingClientRect();
    const x = e.clientX - b.left, y = e.clientY - b.top;
    const left = Math.min(dragStart.x, x), top = Math.min(dragStart.y, y);
    const width = Math.abs(x - dragStart.x), height = Math.abs(y - dragStart.y);
    setRect({ left, top, width, height });
  };
  const onUp=()=>{
    if(!rect){ setDragStart(null); return; }
    const map = getMap(); if(!map){ setDragStart(null); return; }
    const tl = map.unproject([rect.left, rect.top]);
    const br = map.unproject([rect.left + rect.width, rect.top + rect.height]);
    const west = Math.min(tl.lng, br.lng), east = Math.max(tl.lng, br.lng);
    const north= Math.max(tl.lat, br.lat), south= Math.min(tl.lat, br.lat);
    setBBox({ west, south, east, north }); setDragStart(null);
  };

  return (
    <div ref={overlayRef} className="absolute inset-0 cursor-crosshair" onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}>
      <div className="absolute inset-0 bg-transparent" />
      {rect && (
        <div style={{ position:'absolute', left:rect.left, top:rect.top, width:rect.width, height:rect.height, outline:'2px dashed #22d3ee', background:'rgba(34,211,238,0.12)' }} />
      )}
    </div>
  );
}
