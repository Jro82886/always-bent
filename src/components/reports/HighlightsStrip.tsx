'use client';

import { MOCK_HIGHLIGHTS } from '@/mocks/reports';
import { Flame, Thermometer, Wind, Waves, Moon } from 'lucide-react';

interface HighlightsStripProps {
  onSelectHighlight: (highlight: any) => void;
  month?: string;
}

export default function HighlightsStrip({ onSelectHighlight, month }: HighlightsStripProps) {
  // TODO: Filter MOCK_HIGHLIGHTS by month when connected to real API
  if (MOCK_HIGHLIGHTS.length === 0) {
    return null; // Don't show section if no highlights
  }

  return (
    <div className="p-4 md:p-6">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.5)]" />
        <h2 className="text-sm uppercase tracking-widest bg-gradient-to-r from-orange-400/80 to-amber-400/80 bg-clip-text text-transparent font-semibold">ABFI Highlights</h2>
      </div>
      
      {/* Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MOCK_HIGHLIGHTS.slice(0, 3).map((highlight, index) => (
          <button
            key={highlight.id}
            onClick={() => onSelectHighlight(highlight)}
            className="group rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-lg p-4 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-500/30 transition-all text-left"
          >
            {/* Title and Time */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">
                Hot Bite Detected
              </h3>
              <span className="text-xs text-slate-400">
                {new Date(highlight.createdAtIso).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            {/* Analysis Preview */}
            <p className="text-sm text-slate-200 line-clamp-2 mb-3">
              {highlight.analysisText}
            </p>
            
            {/* Conditions Snapshot */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Thermometer className="w-3 h-3" />
                <span>{highlight.conditions.sstF}°F</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Wind className="w-3 h-3" />
                <span>{highlight.conditions.windKt} kt {highlight.conditions.windDir}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Waves className="w-3 h-3" />
                <span>{highlight.conditions.swellFt} ft @ {highlight.conditions.periodS}s</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Moon className="w-3 h-3" />
                <span>Waxing</span>
              </div>
            </div>
            
            {/* Anonymous Badge */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-slate-500 italic">Anonymous Report</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}