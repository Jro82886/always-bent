'use client';
import { useEffect, useRef } from 'react';
export type BBox = [number, number, number, number];

export default function SnipController({ onDone }:{ onDone:(bbox:BBox)=>void }) {
  const start = useRef<{x:number,y:number}|null>(null);
  const rectRef = useRef<HTMLDivElement|null>(null);

  useEffect(() => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;cursor:crosshair;background:rgba(0,0,0,.05)';
    const rect = document.createElement('div');
    rect.style.cssText = 'position:fixed;border:2px solid #00ffff;background:rgba(0,255,255,.08);pointer-events:none;z-index:9999';
    rectRef.current = rect;
    document.body.appendChild(overlay);
    document.body.appendChild(rect);

    function down(e:MouseEvent){ start.current={x:e.clientX,y:e.clientY}; rect.style.width='0'; rect.style.height='0'; rect.style.left=e.clientX+'px'; rect.style.top=e.clientY+'px'; }
    function move(e:MouseEvent){
      if(!start.current) return;
      const x1=Math.min(start.current.x,e.clientX), y1=Math.min(start.current.y,e.clientY);
      const x2=Math.max(start.current.x,e.clientX), y2=Math.max(start.current.y,e.clientY);
      rect.style.left=x1+'px'; rect.style.top=y1+'px'; rect.style.width=(x2-x1)+'px'; rect.style.height=(y2-y1)+'px';
    }
    function up(){
      if(!start.current){ cleanup(); return; }
      const map:any = (globalThis as any).abfiMap;
      if(!map || !rect.style.width){ cleanup(); return; }
      const L=parseInt(rect.style.left||'0'), T=parseInt(rect.style.top||'0');
      const W=parseInt(rect.style.width||'0'), H=parseInt(rect.style.height||'0');
      const sw = map.unproject({x:L,     y:T+H});
      const ne = map.unproject({x:L+W,   y:T   });
      cleanup();
      onDone([sw.lng, sw.lat, ne.lng, ne.lat]);
    }
    function cleanup(){ overlay.remove(); rect.remove(); window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); }

    overlay.addEventListener('mousedown',down);
    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
    return cleanup;
  }, [onDone]);

  return null;
}


