'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import BetaBanner from '@/components/BetaBanner';
import { useAppState } from '@/store/appState';

// Dynamically import modes with proper isolation
const AnalysisMode = dynamic(
  () => import('../app/legendary/analysis/page'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading Analysis...</div>
      </div>
    )
  }
);

const TrackingMode = dynamic(
  () => import('../app/legendary/tracking/page'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading Tracking...</div>
      </div>
    )
  }
);

const CommunityMode = dynamic(
  () => import('../app/legendary/community/CommunityPage'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading Community...</div>
      </div>
    )
  }
);

const TrendsMode = dynamic(
  () => import('../app/legendary/trends/page'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading Trends...</div>
      </div>
    )
  }
);

function ABFICore() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || 'analysis';
  const [currentMode, setCurrentMode] = useState(mode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Handle mode changes with proper cleanup
  useEffect(() => {
    if (mode !== currentMode) {
      setIsTransitioning(true);
      
      // Clean up any existing map instances
      if (typeof window !== 'undefined') {
        const mapContainer = document.querySelector('.mapboxgl-map');
        if (mapContainer) {
          mapContainer.remove();
        }
      }
      
      // Small delay to ensure cleanup
      setTimeout(() => {
        setCurrentMode(mode);
        setIsTransitioning(false);
      }, 100);
    }
  }, [mode, currentMode]);
  
  // Show transition screen during mode switch
  if (isTransitioning) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Switching mode...</div>
      </div>
    );
  }
  
  // Render the appropriate mode
  switch(currentMode) {
    case 'analysis':
      return <AnalysisMode />;
    case 'tracking':
      return <TrackingMode />;
    case 'community':
      return <CommunityMode />;
    case 'trends':
      return <TrendsMode />;
    default:
      return <AnalysisMode />;
  }
}

export default function LegendaryShell() {
  return (
    <>
      <BetaBanner />
      <Suspense fallback={
        <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
          <div className="text-cyan-400 animate-pulse">Loading platform...</div>
        </div>
      }>
        <ABFICore />
      </Suspense>
    </>
  );
}
