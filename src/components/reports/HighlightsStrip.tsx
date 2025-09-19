'use client';

import { MOCK_HIGHLIGHTS } from '@/mocks/reports';
import { TrendingUp, Thermometer, Wind, Waves } from 'lucide-react';

interface HighlightsStripProps {
  onSelectHighlight: (highlight: any) => void;
}

export default function HighlightsStrip({ onSelectHighlight }: HighlightsStripProps) {
  if (MOCK_HIGHLIGHTS.length === 0) {
    return null; // Don't show section if no highlights
  }

  return (
    <div className="bg-slate-900/50 border-b border-cyan-500/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-medium text-white">Top Intel</h2>
        <span className="text-xs text-slate-500">(Anonymous)</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MOCK_HIGHLIGHTS.slice(0, 3).map(highlight => (
          <button
            key={highlight.id}
            onClick={() => onSelectHighlight(highlight)}
            className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-3 hover:bg-slate-800 transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-medium text-cyan-400">Score: {highlight.score}</span>
              </div>
            </div>
            
            <p className="text-sm text-white line-clamp-2 mb-2">
              {highlight.analysisText}
            </p>
            
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                <span>{highlight.conditions.sstF}°F</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="w-3 h-3" />
                <span>{highlight.conditions.windKt} kt</span>
              </div>
              <div className="flex items-center gap-1">
                <Waves className="w-3 h-3" />
                <span>{highlight.conditions.swellFt} ft</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
