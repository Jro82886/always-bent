'use client';

import { Suspense } from 'react';
import CommunityHeader from '@/components/community/CommunityHeader';
import ReportsFilters from '@/components/community/ReportsFilters';
import ReportComposer from '@/components/community/ReportComposer';
import ReportsFeed from '@/components/community/ReportsFeed';
import HeaderBar from '@/components/CommandBridge/HeaderBar';

export default function CommunityPage() {
  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 overflow-hidden">
      {/* Command Bridge Header */}
      <HeaderBar activeMode="community" />
      
      {/* Main content area with proper spacing */}
      <div className="pt-24 h-full flex flex-col">
        <Suspense fallback={<div className="h-20 bg-black/40 animate-pulse" />}>
          <CommunityHeader />
        </Suspense>
        
        <Suspense fallback={<div className="h-14 bg-black/40 animate-pulse" />}>
          <ReportsFilters />
        </Suspense>
        
        <ReportComposer />
        
        {/* Reports feed takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={
            <div className="h-full flex items-center justify-center">
              <div className="text-cyan-400 animate-pulse">Loading reports...</div>
            </div>
          }>
            <ReportsFeed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}