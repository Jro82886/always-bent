'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import each mode to keep them separate
const AnalysisMode = dynamic(() => import('./analysis/page'), { ssr: false });
const TrackingMode = dynamic(() => import('./tracking/page'), { ssr: false });
const CommunityMode = dynamic(() => import('./community/page'), { ssr: false });
const TrendsMode = dynamic(() => import('./trends/page'), { ssr: false });
const WelcomeMode = dynamic(() => import('./welcome/page'), { ssr: false });

type AppMode = 'welcome' | 'analysis' | 'tracking' | 'community' | 'trends';

export default function ABFICore() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<AppMode>('analysis');
  const [isLoading, setIsLoading] = useState(false);

  // Get mode from URL or default to analysis
  useEffect(() => {
    const mode = searchParams.get('mode') as AppMode;
    if (mode && ['welcome', 'analysis', 'tracking', 'community', 'trends'].includes(mode)) {
      setCurrentMode(mode);
    } else {
      setCurrentMode('analysis'); // Default to analysis if no mode specified
    }
  }, [searchParams]);

  // Navigation function
  const navigateToMode = (mode: AppMode) => {
    setIsLoading(true);
    router.push(`/legendary?mode=${mode}`);
    setTimeout(() => setIsLoading(false), 300);
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Navigation Bar - Always visible */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100]">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-cyan-500/20 shadow-2xl px-2 py-2">
          <div className="flex items-center gap-1">
            {/* Welcome Tab */}
            <button
              onClick={() => navigateToMode('welcome')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                currentMode === 'welcome'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Welcome
            </button>

            {/* Analysis Tab */}
            <button
              onClick={() => navigateToMode('analysis')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                currentMode === 'analysis'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Analysis
            </button>

            {/* Tracking Tab */}
            <button
              onClick={() => navigateToMode('tracking')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                currentMode === 'tracking'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Tracking
            </button>

            {/* Community Tab */}
            <button
              onClick={() => navigateToMode('community')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                currentMode === 'community'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Community
            </button>

            {/* Trends Tab */}
            <button
              onClick={() => navigateToMode('trends')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                currentMode === 'trends'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-808/50'
              }`}
            >
              Trends
            </button>
          </div>
        </div>
      </div>

      {/* Mode Content - Each mode is independent */}
      <div className="w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="text-cyan-400 text-lg">Loading...</div>
          </div>
        )}
        
        {currentMode === 'welcome' && <WelcomeMode />}
        {currentMode === 'analysis' && <AnalysisMode />}
        {currentMode === 'tracking' && <TrackingMode />}
        {currentMode === 'community' && <CommunityMode />}
        {currentMode === 'trends' && <TrendsMode />}
      </div>

      {/* Mode Indicator - For Development */}
      <div className="absolute bottom-4 left-4 z-50 bg-slate-900/90 border border-cyan-500/30 rounded px-3 py-1.5">
        <span className="text-xs text-cyan-400 font-medium">
          ABFI Core | Mode: {currentMode}
        </span>
      </div>
    </div>
  );
}