'use client';
import { useEffect, useState } from 'react';
import { useUI } from '@/state/ui';

type Summary = { coords: string; date: string; sstRange?: string; gradientHint?: string; recs?: string[] };

export default function SnipAnalysisCard(){
  const { snipOn } = useUI();
  // UIState no longer exposes bbox/date; render placeholder until API is wired
  const bbox: any = null;
  const dateISO: string = new Date().toISOString().slice(0,10);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(()=>{
    if(!bbox) { setSummary(null); return; }
    const coords = `${bbox.south.toFixed(3)}° to ${bbox.north.toFixed(3)}°, ${bbox.west.toFixed(3)}° to ${bbox.east.toFixed(3)}°`;
    setSummary({ coords, date: dateISO });
    (async ()=>{
      try{
        const res = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ bbox, date: dateISO }) });
        if(res.ok){ const data = await res.json(); setSummary(prev => prev ? { ...prev, ...data } : prev); }
      }catch{}
    })();
  }, [bbox, dateISO]);

  if(!snipOn || !summary) return null;
  return (
    <div className="absolute bottom-4 right-4 max-w-sm bg-white text-black rounded-lg shadow-xl border border-neutral-200">
      <div className="p-4">
        <div className="text-sm uppercase tracking-wide text-neutral-500 mb-1">Snip Analysis (MVP)</div>
        <div className="text-sm"><b>Date:</b> {summary.date}</div>
        <div className="text-sm"><b>Box:</b> {summary.coords}</div>
        {summary.sstRange && <div className="text-sm"><b>SST:</b> {summary.sstRange}</div>}
        {summary.gradientHint && <div className="text-sm"><b>Gradient:</b> {summary.gradientHint}</div>}
        {summary.recs?.length ? (
          <ul className="list-disc pl-5 mt-1 text-sm">{summary.recs.map((r,i)=><li key={i}>{r}</li>)}</ul>
        ): null}
      </div>
    </div>
  );
}
