'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import HeaderBar from '@/components/CommandBridge/HeaderBar';

// Force this page to be rendered dynamically to avoid useSearchParams SSR issues
export const dynamic = 'force-dynamic';

// Dynamically import all components that might use searchParams
const CommunityHeader = dynamic(() => import('@/components/community/CommunityHeader'), {
  ssr: false,
  loading: () => <div className="h-20 bg-black/40 animate-pulse" />
});

const ReportsFiltersWrapper = dynamic(() => import('@/components/community/ReportsFiltersWrapper'), {
  ssr: false,
  loading: () => <div className="h-14 bg-black/40 animate-pulse" />
});

const ReportComposer = dynamic(() => import('@/components/community/ReportComposer'), {
  ssr: false,
  loading: () => <div className="h-16 bg-black/40 animate-pulse" />
});

const ReportsFeed = dynamic(() => import('@/components/community/ReportsFeed'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-cyan-400 animate-pulse">Loading reports...</div>
    </div>
  )
});

export default function CommunityPage() {
  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 overflow-hidden">
      {/* Command Bridge Header */}
      <HeaderBar activeMode="community" />
      
      {/* Main content area with proper spacing */}
      <div className="pt-24 h-full flex flex-col">
        <CommunityHeader />
        <ReportsFiltersWrapper />
        <ReportComposer />
        
        {/* Reports feed takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <ReportsFeed />
        </div>
      </div>
    </div>
  );
}