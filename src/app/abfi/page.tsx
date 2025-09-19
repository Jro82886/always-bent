'use client';

import { Fish, WifiOff, Upload, Battery } from 'lucide-react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function ABFIPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-cyan-500/20 p-4">
        <div className="flex items-center gap-3">
          <Link href="/community/reports" className="p-1 hover:bg-slate-800 rounded">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <h1 className="text-lg font-semibold text-white">ABFI</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          {/* Big Disabled Bite Button */}
          <button
            disabled
            className="relative w-48 h-48 mx-auto mb-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 rounded-full flex items-center justify-center cursor-not-allowed opacity-50"
          >
            <div className="absolute inset-0 rounded-full bg-green-500/10 animate-pulse" />
            <Fish className="w-20 h-20 text-green-400" />
          </button>

          <h2 className="text-2xl font-bold text-white mb-2">ABFI Coming Soon</h2>
          <p className="text-slate-400 mb-8">
            Advanced Bite Fishing Intelligence - Track your bites in real-time
          </p>

          {/* Status Row Placeholders */}
          <div className="space-y-4 bg-slate-900/50 border border-cyan-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">Offline Bites</span>
              </div>
              <span className="text-sm text-slate-500">0 pending</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Auto-sync</span>
              </div>
              <span className="text-sm text-slate-500">Disabled</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Battery className="w-4 h-4" />
                <span className="text-sm">Battery Saver</span>
              </div>
              <span className="text-sm text-slate-500">Off</span>
            </div>
          </div>

          {/* Back to Community */}
          <Link
            href="/community/reports"
            className="inline-block mt-8 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Back to Reports
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-cyan-500/20 z-50">
        <div className="grid grid-cols-3">
          <Link
            href="/community/chat"
            className="py-3 text-center text-slate-400"
          >
            <div className="text-xs font-medium">Chat</div>
          </Link>
          <Link
            href="/community/reports"
            className="py-3 text-center text-slate-400"
          >
            <div className="text-xs font-medium">Reports</div>
          </Link>
          <Link
            href="/abfi"
            className="py-3 text-center text-cyan-400"
          >
            <div className="text-xs font-medium">ABFI</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
