"use client";

import * as React from "react";
import { useRef, useState, useEffect } from "react";
import { useAppState } from "@/store/appState";

// Simple equirectangular mapping helpers
function lonToX(lon: number, width: number): number {
  return ((lon + 180) / 360) * width;
}
function latToY(lat: number, height: number): number {
  return ((90 - lat) / 180) * height;
}
function xToLon(x: number, width: number): number {
  return (x / width) * 360 - 180;
}
function yToLat(y: number, height: number): number {
  return 90 - (y / height) * 180;
}

export function AnalysisMap({ zoomKey }: { zoomKey: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<HTMLDivElement | null>(null);
  // Note: bbox functionality moved to analysis page
  const [bbox, setBbox] = useState<number[] | null>(null);
  const { analysis } = (useAppState as any)() ?? {};
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [viewTransform, setViewTransform] = useState<{ scale: number; tx: number; ty: number }>({ scale: 1, tx: 0, ty: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragStart || !containerRef.current || !selectionRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const left = Math.min(dragStart.x, x);
    const top = Math.min(dragStart.y, y);
    const width = Math.abs(x - dragStart.x);
    const height = Math.abs(y - dragStart.y);
    const sel = selectionRef.current;
    sel.style.display = "block";
    sel.style.left = `${left}px`;
    sel.style.top = `${top}px`;
    sel.style.width = `${width}px`;
    sel.style.height = `${height}px`;
  };

  const onMouseUp = () => {
    if (!dragStart || !containerRef.current || !selectionRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const sel = selectionRef.current.getBoundingClientRect();
    const left = sel.left - rect.left;
    const top = sel.top - rect.top;
    const width = sel.width;
    const height = sel.height;
    // Convert to lon/lat bbox
    const west = xToLon(left, rect.width);
    const east = xToLon(left + width, rect.width);
    const north = yToLat(top, rect.height);
    const south = yToLat(top + height, rect.height);
    setBbox([west, south, east, north]);
    setDragStart(null);
  };

  useEffect(() => {
    if (!containerRef.current || !bbox) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x1 = lonToX(bbox[0], rect.width);
    const y1 = latToY(bbox[3], rect.height);
    const x2 = lonToX(bbox[2], rect.width);
    const y2 = latToY(bbox[1], rect.height);
    const w = Math.max(1, Math.abs(x2 - x1));
    const h = Math.max(1, Math.abs(y2 - y1));
    const scale = Math.min(rect.width / w, rect.height / h);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const tx = rect.width / 2 - cx;
    const ty = rect.height / 2 - cy;
    setViewTransform({ scale: Math.min(scale, 8), tx, ty });
  }, [zoomKey]);

  return (
    <div className="relative flex-1 overflow-hidden" ref={containerRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-300 to-sky-400 dark:from-slate-800 dark:via-slate-900 dark:to-black" style={{ transform: `translate(${viewTransform.tx}px, ${viewTransform.ty}px) scale(${viewTransform.scale})`, transformOrigin: "50% 50%" }} />
      <div ref={selectionRef} className="absolute hidden border-2 border-cyan-400/80 bg-cyan-400/10" />
      {/* Render waypoints */}
      <WaypointsOverlay />
    </div>
  );
}

function WaypointsOverlay() {
  const { analysis } = (useAppState as any)() ?? {};
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const el = containerRef.current?.parentElement as HTMLDivElement | null;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const features: any[] = ((analysis?.features?.features as any[]) || []) as any[];
  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {features.map((f: any, idx: number) => {
        if (f?.geometry?.type !== "Point") return null;
        const [lon, lat] = (f.geometry as any)?.coordinates as [number, number];
        const x = lonToX(lon, size.w);
        const y = latToY(lat, size.h);
        return (
          <div key={idx} className="absolute" style={{ left: x - 6, top: y - 6 }}>
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_4px_rgba(34,211,238,0.7)]" />
          </div>
        );
      })}
    </div>
  );
}



