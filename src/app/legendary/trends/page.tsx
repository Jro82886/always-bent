'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the Trends component - LIVE VERSION with Stormglass integration
const TrendsGridPolished = dynamic(
  () => import('@/components/trends/TrendsGridPolished'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400">Loading trends...</div>
      </div>
    )
  }
);

export default function TrendsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <Suspense fallback={
        <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
          <div className="text-cyan-400">Loading trends...</div>
        </div>
      }>
        <TrendsGridPolished />
      </Suspense>
    </div>
  );
}