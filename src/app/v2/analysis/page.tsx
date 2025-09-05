'use client';
import dynamic from 'next/dynamic';
import Map from '@/components/Map';
import { useUI } from '@/state/ui';
const SSTRasterInner = dynamic(() => import('@/components/SSTRasterInner'), { ssr: false });
const PolysLayer = dynamic(() => import('@/components/polygons/PolysLayer'), { ssr: false });

export default function AnalysisPage(){
  const { iso, sstOn, setSstOn, day, setDay, polygonsOn, setPolygonsOn } = useUI() as any;
  return (
    <div className="relative h-full w-full">
      {/* Minimal header */}
      <div className="absolute left-2 top-2 z-10 flex gap-2">
        <button onClick={() => setSstOn((v:any)=>!v)} className="px-3 py-1 bg-neutral-800 rounded border border-neutral-700">SST (MUR) {sstOn? 'ON':'OFF'}</button>
        <button disabled className="px-3 py-1 bg-neutral-800/50 text-neutral-400 rounded border border-neutral-700">CHL</button>
        <label className="flex items-center gap-1 px-2 py-1 bg-neutral-900/60 rounded border border-neutral-700/60">
          <input type="checkbox" checked={!!polygonsOn} onChange={(e)=> setPolygonsOn(!!e.target.checked)} />
          Polygons
        </label>
        <select value={day} onChange={(e)=>setDay(e.target.value as any)} className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700">
          <option value="latest">Latest</option>
          <option value="today">Today</option>
          <option value="-1d">−1d</option>
          <option value="-2d">−2d</option>
          <option value="-3d">−3d</option>
        </select>
        <div className="px-2 py-1 bg-neutral-900/60 rounded border border-neutral-700/60">ISO: {iso || 'resolving…'}</div>
      </div>
      <Map />
      {sstOn && iso ? <SSTRasterInner iso={iso} /> : null}
      {polygonsOn && iso ? <PolysLayer iso={iso} /> : null}
      {polygonsOn ? (
        <div className="absolute left-2 bottom-2 z-10 rounded bg-black/60 border border-white/10 text-xs text-white px-2 py-1">
          <div className="font-semibold mb-1">Legend</div>
          <div className="flex items-center gap-2"><span className="inline-block h-2 w-3 rounded" style={{ background:'#22d3ee' }} /> Eddy</div>
          <div className="flex items-center gap-2"><span className="inline-block h-2 w-3 rounded" style={{ background:'#a78bfa' }} /> Filament</div>
          <div className="flex items-center gap-2"><span className="inline-block h-2 w-3 rounded" style={{ background:'#f59e0b' }} /> Edge</div>
        </div>
      ) : null}
    </div>
  );
}
