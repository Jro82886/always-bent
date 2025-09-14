'use client';

import { useState } from 'react';
import { Users, User, Building2, Navigation } from 'lucide-react';
import IndividualTrackingWidget from './IndividualTrackingWidget';
import FleetTrackingWidget from './FleetTrackingWidget';
import CommercialTrackingWidget from './CommercialTrackingWidget';

type TrackingMode = 'individual' | 'fleet' | 'commercial';

export default function TrackingWidget() {
  const [mode, setMode] = useState<TrackingMode>('individual');

  return (
    <div className="absolute top-4 left-4 bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-blue-900/80 backdrop-blur-md rounded-2xl px-6 py-4 shadow-[0_0_30px_rgba(71,85,105,0.3)] z-50 border border-slate-500/30 w-80 max-h-[calc(100vh-100px)] overflow-y-auto">
      <div className="relative">
        <h3 className="text-slate-300 font-semibold mb-3 text-sm text-center flex items-center justify-center gap-2">
          <Navigation size={14} className="text-slate-400" />
          Vessel Tracking
          {/* Live Badge */}
          <div className="group relative">
            <span className="px-2 py-0.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 text-[10px] font-bold rounded-full border border-green-500/30 cursor-help animate-pulse">
              LIVE
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-xl border border-green-500/20 min-w-[200px]">
                <div className="text-green-400 text-xs font-semibold mb-1">Real-Time Tracking</div>
                <div className="text-slate-300 text-[10px] leading-relaxed">
                  Track your vessel position, speed, and heading in real-time with GPS integration.
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900 border-r border-b border-green-500/20"></div>
              </div>
            </div>
          </div>
        </h3>
      </div>
      
      {/* Mode Selector */}
      <div className="flex gap-1 mb-3 bg-slate-900/50 p-1 rounded-lg">
        <button
          onClick={() => setMode('individual')}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all flex-1 ${
            mode === 'individual'
              ? 'bg-gradient-to-r from-slate-600 to-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <User className="w-3 h-3" />
          <span>Individual</span>
        </button>
        <button
          onClick={() => setMode('fleet')}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all flex-1 ${
            mode === 'fleet'
              ? 'bg-gradient-to-r from-slate-600 to-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Users className="w-3 h-3" />
          <span>Fleet</span>
        </button>
        <button
          onClick={() => setMode('commercial')}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all flex-1 ${
            mode === 'commercial'
              ? 'bg-gradient-to-r from-slate-600 to-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Building2 className="w-3 h-3" />
          <span>Commercial</span>
        </button>
      </div>

      {/* Mode-specific content */}
      <div className="space-y-2">
        {mode === 'individual' && <IndividualTrackingWidget />}
        {mode === 'fleet' && <FleetTrackingWidget />}
        {mode === 'commercial' && <CommercialTrackingWidget />}
      </div>
    </div>
  );
}