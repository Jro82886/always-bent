'use client';

import dynamic from 'next/dynamic';
import 'mapbox-gl/dist/mapbox-gl.css';

const TrackingContent = dynamic(() => import('./TrackingContent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center text-slate-300">
      Loading map…
    </div>
  ),
});

export default function TrackingPage() {
  return <TrackingContent />;
}