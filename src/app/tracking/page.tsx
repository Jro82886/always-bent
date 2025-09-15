'use client';

import NavTabs from '@/components/NavTabs';

export default function TrackingPage() {
  return (
    <div className="relative w-full h-screen bg-black">
      {/* Navigation */}
      <NavTabs />
      
      {/* Simple Message */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-cyan-400 mb-4">
            Hi Amanda! 👋
          </h1>
          <p className="text-xl text-white mb-2">
            Tracking Page is Working!
          </p>
          <p className="text-sm text-slate-400">
            This is a clean, separate tracking page.
          </p>
          <div className="mt-8 p-4 bg-green-500/20 border border-green-500 rounded-lg">
            <p className="text-green-400">
              ✓ Page loads successfully
            </p>
            <p className="text-yellow-400 mt-2">
              🎯 UPDATED: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}