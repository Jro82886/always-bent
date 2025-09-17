'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/AuthGuard';

// Dynamically import modes
const AnalysisMode = dynamic(() => import('./analysis/page'), { ssr: false });
const TrackingMode = dynamic(() => import('./tracking/page'), { ssr: false });
const CommunityMode = dynamic(() => import('./community/page'), { ssr: false });
const TrendsMode = dynamic(() => import('./trends/page'), { ssr: false });
const WelcomeMode = dynamic(() => import('./welcome/page'), { ssr: false });

function ABFICore() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  
  // No mode = show welcome (the trunk entry point)
  if (!mode) {
    return <WelcomeMode />;
  }
  
  // Each branch accessed equally via ?mode=
  switch(mode) {
    case 'analysis':
      return <AnalysisMode />;
    case 'tracking':
      return <TrackingMode />;
    case 'community':
      return <CommunityMode />;
    case 'trends':
      return <TrendsMode />;
    case 'welcome':
      return <WelcomeMode />;
    default:
      return <WelcomeMode />; // Unknown mode = welcome
  }
}

export default function LegendaryPage() {
  return (
    <AuthGuard requireAuth={true} fallbackPath="/auth/login">
      <Suspense fallback={
        <div className="w-full h-screen bg-black flex items-center justify-center">
          <div className="text-cyan-400">Loading...</div>
        </div>
      }>
        <ABFICore />
      </Suspense>
    </AuthGuard>
  );
}