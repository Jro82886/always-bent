'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';

interface CompactLegendProps {
  inletColor?: string;
}

export default function CompactLegend({ inletColor = '#00DDEB' }: CompactLegendProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <div className="absolute bottom-8 left-3 z-10 ml-12">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-slate-900/90 backdrop-blur-xl rounded-lg p-2 border border-cyan-500/20 hover:bg-slate-900/95 transition-all"
          title="Show Legend"
        >
          <Info size={16} className="text-cyan-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-8 left-3 z-10 ml-12">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-lg border border-cyan-500/20 p-3 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Legend</span>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-cyan-400/50 hover:text-cyan-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        
        {/* Legend Items */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(0,221,235,0.8)]" />
            <span className="text-cyan-100/80">Your Position</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: inletColor,
                boxShadow: `0 0 6px ${inletColor}80`
              }}
            />
            <span className="text-cyan-100/80">Inlet Fleet</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400" />
            <span className="text-cyan-100/80">ABFI Network</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0">
              <div className="w-2 h-0.5 bg-cyan-400/40" />
              <div className="w-1 h-0.5 bg-transparent" />
              <div className="w-2 h-0.5 bg-cyan-400/40" />
            </div>
            <span className="text-cyan-100/80">Vessel Tracks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
