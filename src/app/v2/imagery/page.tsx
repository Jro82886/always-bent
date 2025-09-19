'use client';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useUI } from '@/state/ui';

const MapStage     = dynamic(()=>import('@/components/MapStage'), { ssr:false });

export default function ImageryPage(){
  const { snipOn, setSnipOn } = useUI();
  const label = useMemo(()=> snipOn ? 'Exit Snip' : 'Snip/Analyze', [snipOn]);

  return (
    <div className="relative h-full w-full">
      <MapStage />
      <div className="absolute top-3 right-3 flex gap-2">
        <button
          onClick={()=>setSnipOn(!snipOn)}
          className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700 hover:bg-neutral-700"
        >
          {label}
        </button>
      </div>
    </div>
  );
}
