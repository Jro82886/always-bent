'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CommercialVesselLegendProps {
  showCommercial: boolean;
}

export default function CommercialVesselLegend({ showCommercial }: CommercialVesselLegendProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Only render if commercial vessels are enabled
  if (!showCommercial) return null;

  return (
    <div className="absolute top-24 right-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-lg border border-orange-500/20 shadow-2xl">
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-orange-500/5 transition-colors rounded-lg"
        >
          <span className="text-xs font-bold text-orange-300 uppercase tracking-wider">
            Commercial Vessels
          </span>
          {isExpanded ? (
            <ChevronUp size={14} className="text-orange-400" />
          ) : (
            <ChevronDown size={14} className="text-orange-400" />
          )}
        </button>
        
        {/* Collapsible Content */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-2 border-t border-orange-500/10">
            {/* Vessel Types */}
            <div className="space-y-1.5 pt-2">
              {/* Trawlers */}
              <div className="flex items-center gap-2">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-orange-500" />
                <span className="text-[11px] text-cyan-100/80">Trawlers</span>
              </div>
              
              {/* Longliners */}
              <div className="flex items-center gap-2">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-purple-500" />
                <span className="text-[11px] text-cyan-100/80">Longliners</span>
              </div>
              
              {/* Drifting Gear */}
              <div className="flex items-center gap-2">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-yellow-500" />
                <span className="text-[11px] text-cyan-100/80">Drifting Gear</span>
              </div>
            </div>
            
            {/* Info */}
            <div className="pt-2 border-t border-orange-500/10">
              <p className="text-[10px] text-orange-300/70">
                Global Fishing Watch data
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
