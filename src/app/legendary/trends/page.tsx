'use client';

import dynamic from 'next/dynamic';

// Dynamically import the fixed TrendsMode without any map dependencies
const TrendsModeFixed = dynamic(
  () => import('@/components/trends/TrendsModeFixed'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading Trends...</div>
      </div>
    )
  }
);

export default function TrendsPage() {
  return <TrendsModeFixed />;
}