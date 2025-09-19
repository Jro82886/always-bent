'use client';

import { Suspense } from 'react';
import HeaderBar from '@/components/CommandBridge/HeaderBar';

export default function CommunityWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 overflow-hidden">
      {/* Command Bridge Header */}
      <HeaderBar activeMode="community" />
      
      {/* Main content area with proper spacing */}
      <div className="pt-24 h-full">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-cyan-400 animate-pulse">Loading Community...</div>
          </div>
        }>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
