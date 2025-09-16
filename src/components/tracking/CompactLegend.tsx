'use client';

import { useState } from 'react';
import { Info, X, ChevronRight } from 'lucide-react';

interface CompactLegendProps {
  inletColor?: string;
  inletName?: string;
  showYou?: boolean;
  showFleet?: boolean;
  showCommercial?: boolean;
  showTracks?: boolean;
}

export default function CompactLegend({ 
  inletColor = '#06B6D4',
  inletName = 'Inlet',
  showYou = false,
  showFleet = false,
  showCommercial = false,
  showTracks = false
}: CompactLegendProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Count active layers
  const activeCount = [showYou, showFleet, showCommercial, showTracks].filter(Boolean).length;

  if (!isExpanded) {
    return (
      <div className="absolute top-24 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-slate-900/90 backdrop-blur-xl rounded-lg px-2.5 py-1.5 border border-cyan-500/20 hover:bg-slate-900/95 transition-all group flex items-center gap-1.5"
          title="Show Map Legend"
        >
          <Info size={12} className="text-cyan-400" />
          <span className="text-[11px] text-cyan-300/70 font-medium">Legend</span>
          {activeCount > 0 && (
            <span className="bg-cyan-500/20 text-cyan-300 text-[9px] font-bold px-1 py-0.5 rounded">
              {activeCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-24 right-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-lg border border-cyan-500/20 shadow-2xl w-64">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/10">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-cyan-400" />
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Map Legend</span>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-cyan-400/50 hover:text-cyan-400 transition-colors p-1 hover:bg-cyan-500/10 rounded"
            title="Close Legend"
          >
            <X size={14} />
          </button>
        </div>
        
        {/* Legend Content */}
        <div className="p-3 space-y-2">
          {/* Your Vessel */}
          {showYou && (
            <div 
              className="group relative py-1.5 px-2 rounded hover:bg-cyan-500/5 transition-colors cursor-help"
              onMouseEnter={() => setHoveredItem('you')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-white animate-ping opacity-75" />
                </div>
                <div className="text-xs font-medium text-cyan-100">Your Vessel</div>
              </div>
              
              {/* Clean hover tooltip */}
              {hoveredItem === 'you' && (
                <div className="absolute left-0 top-full mt-1 w-48 p-2 bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 rounded shadow-lg z-50">
                  <div className="text-[10px] text-cyan-300">
                    GPS updates every 5 seconds
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inlet Fleet */}
          {showFleet && (
            <div 
              className="group relative py-1.5 px-2 rounded hover:bg-cyan-500/5 transition-colors cursor-help"
              onMouseEnter={() => setHoveredItem('fleet')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: inletColor,
                    boxShadow: `0 0 8px ${inletColor}80`
                  }}
                />
                <div className="text-xs font-medium text-cyan-100">{inletName} Fleet</div>
              </div>
              
              {/* Clean hover tooltip */}
              {hoveredItem === 'fleet' && (
                <div className="absolute left-0 top-full mt-1 w-48 p-2 bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 rounded shadow-lg z-50">
                  <div className="text-[10px] text-cyan-300">
                    Other boats from {inletName}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Commercial Vessels */}
          {showCommercial && (
            <div 
              className="group relative py-1.5 px-2 rounded hover:bg-cyan-500/5 transition-colors cursor-help"
              onMouseEnter={() => setHoveredItem('commercial')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-orange-400/70 uppercase tracking-wider">Commercial</div>
                
                <div className="flex items-center gap-4 pl-1">
                  {/* Trawler */}
                  <div className="flex items-center gap-2">
                    <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-orange-500" />
                    <div className="text-[11px] text-cyan-100/80">Trawlers</div>
                  </div>
                  
                  {/* Longliner */}
                  <div className="flex items-center gap-2">
                    <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-purple-500" />
                    <div className="text-[11px] text-cyan-100/80">Longliners</div>
                  </div>
                </div>
              </div>
              
              {/* Clean hover tooltip */}
              {hoveredItem === 'commercial' && (
                <div className="absolute left-0 top-full mt-1 w-48 p-2 bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 rounded shadow-lg z-50">
                  <div className="text-[10px] text-cyan-300">
                    Global Fishing Watch commercial vessels
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vessel Tracks */}
          {showTracks && (
            <div 
              className="group relative py-1.5 px-2 rounded hover:bg-cyan-500/5 transition-colors cursor-help"
              onMouseEnter={() => setHoveredItem('tracks')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  <div className="w-1 h-1 bg-cyan-400/60 rounded-full" />
                  <div className="w-3 h-[1px] bg-cyan-400/40" />
                  <div className="w-1 h-1 bg-cyan-400/60 rounded-full" />
                </div>
                <div className="text-xs font-medium text-cyan-100">Vessel Tracks</div>
              </div>
              
              {/* Clean hover tooltip */}
              {hoveredItem === 'tracks' && (
                <div className="absolute left-0 top-full mt-1 w-48 p-2 bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 rounded shadow-lg z-50">
                  <div className="text-[10px] text-cyan-300">
                    4 hour movement history
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}