'use client';

// DO NOT touch window/mapbox here
import dynamic from 'next/dynamic';

const AnalysisContent = dynamic(() => import('./AnalysisContent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center text-slate-300">
      Loading map…
    </div>
  ),
});

export default function AnalysisPage() {
  return <AnalysisContent />;
}