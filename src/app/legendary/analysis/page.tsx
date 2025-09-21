'use client';

// DO NOT touch window/mapbox here
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const AnalysisContent = dynamic(() => import('./AnalysisContent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center text-slate-300">
      Loading map…
    </div>
  ),
});

export default function AnalysisPage() {
  useEffect(() => {
    // Preview bootstrap - only runs when NEXT_PUBLIC_PREVIEW_BOOTSTRAP=1
    if (process.env.NEXT_PUBLIC_PREVIEW_BOOTSTRAP !== '1') return;
    if (typeof window === 'undefined') return;
    
    const KEY = 'abfi_layer_prefs_v1';
    if (!localStorage.getItem(KEY)) {
      const defaults = {
        inlet: 'East Coast Overview',
        layers: { 
          sst: true, 
          chl: true, 
          oceanFloor: false, 
          polygons: false, 
          vessels: false 
        }
      };
      localStorage.setItem(KEY, JSON.stringify(defaults));
      console.log('[Preview Bootstrap] Set default layers: SST + CHL enabled');
    }
  }, []);
  
  return <AnalysisContent />;
}