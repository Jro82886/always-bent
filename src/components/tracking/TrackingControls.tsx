'use client';

import { User, Users, Building2, Play, Pause, Square } from 'lucide-react';
import { useTrackingStore } from '@/lib/tracking/trackingStore';

export default function TrackingControls() {
  const { mode, setMode, isTracking, isPaused, startTracking, stopTracking, pauseTracking, resumeTracking } = useTrackingStore();

  return (
    <div className="space-y-3">
      {/* Mode Selector */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg">
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

      {/* Tracking Controls */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Trip Control</span>
          <div className="flex gap-1">
            {!isTracking ? (
              <button
                onClick={startTracking}
                className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-medium hover:bg-green-500/30 transition-all"
              >
                <Play className="w-3 h-3" /> Start
              </button>
            ) : (
              <>
                {!isPaused ? (
                  <button
                    onClick={pauseTracking}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs font-medium hover:bg-yellow-500/30 transition-all"
                  >
                    <Pause className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={resumeTracking}
                    className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-medium hover:bg-green-500/30 transition-all"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={stopTracking}
                  className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-medium hover:bg-red-500/30 transition-all"
                >
                  <Square className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
