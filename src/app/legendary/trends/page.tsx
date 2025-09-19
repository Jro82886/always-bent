'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the Trends component
const TrendsMode = dynamic(
  () => import('@/components/trends/TrendsMode'),
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
    <Suspense fallback={
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400">Loading trends...</div>
      </div>
    }>
      <TrendsMode />
    </Suspense>
  );
}