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

// Load debug component only in development or with ?debug=true
const SnipToolDebug = dynamic(() => import('@/components/SnipToolDebug'), {
  ssr: false
});

export default function AnalysisPage() {
  const showDebug = process.env.NODE_ENV === 'development' || 
    (typeof window !== 'undefined' && window.location.search.includes('debug=true'));

  return (
    <>
      <AnalysisContent />
      {showDebug && <SnipToolDebug />}
    </>
  );
}