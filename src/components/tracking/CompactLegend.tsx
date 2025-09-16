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
      <div className="absolute bottom-8 left-4 z-10">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-slate-900/90 backdrop-blur-xl rounded-lg px-3 py-2 border border-cyan-500/20 hover:bg-slate-900/95 transition-all group flex items-center gap-2"
          title="Show Map Legend"
        >
          <Info size={14} className="text-cyan-400" />
          <span className="text-xs text-cyan-300/70 font-medium">Legend</span>
          {activeCount > 0 && (
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
              {activeCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-8 left-4 z-10">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-lg border border-cyan-500/20 shadow-2xl w-72">
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
        <div className="p-4 space-y-4">
          {/* Your Vessel */}
          <div 
            className={`group relative ${!showYou && 'opacity-40'}`}
            onMouseEnter={() => setHoveredItem('you')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 flex justify-center">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                  {showYou && (
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-white animate-ping opacity-75" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-cyan-100">Your Vessel</div>
                <div className="text-[10px] text-cyan-400/60">GPS tracking active</div>
              </div>
              {showYou && (
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Active" />
              )}
            </div>
            
            {/* Hover Tooltip */}
            {hoveredItem === 'you' && (
              <div className="absolute left-0 right-0 -bottom-1 translate-y-full bg-slate-800 rounded-lg p-2 border border-cyan-500/20 z-50">
                <div className="text-[10px] text-cyan-300">
                  Your boat position updated every 5 seconds when GPS is active
                </div>
              </div>
            )}
          </div>

          {/* Inlet Fleet */}
          <div 
            className={`group relative ${!showFleet && 'opacity-40'}`}
            onMouseEnter={() => setHoveredItem('fleet')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 flex justify-center">
                <div 
                  className="w-3 h-3 rounded-full border border-white/50"
                  style={{
                    backgroundColor: inletColor,
                    boxShadow: `0 0 8px ${inletColor}80`
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-cyan-100">{inletName} Fleet</div>
                <div className="text-[10px] text-cyan-400/60">ABFI members</div>
              </div>
              {showFleet && (
                <ChevronRight size={12} className="text-cyan-400" />
              )}
            </div>
            
            {/* Hover Tooltip */}
            {hoveredItem === 'fleet' && (
              <div className="absolute left-0 right-0 -bottom-1 translate-y-full bg-slate-800 rounded-lg p-2 border border-cyan-500/20 z-50">
                <div className="text-[10px] text-cyan-300">
                  Other boats from {inletName} sharing their location
                </div>
              </div>
            )}
          </div>

          {/* Commercial Vessels */}
          <div 
            className={`group relative ${!showCommercial && 'opacity-40'}`}
            onMouseEnter={() => setHoveredItem('commercial')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-orange-400/70 uppercase tracking-wider">Commercial (GFW)</div>
              
              {/* Trawler */}
              <div className="flex items-center gap-3 pl-2">
                <div className="w-6 flex justify-center">
                  <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent border-b-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-cyan-100/80">Trawlers</div>
                </div>
              </div>
              
              {/* Longliner */}
              <div className="flex items-center gap-3 pl-2">
                <div className="w-6 flex justify-center">
                  <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent border-b-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-cyan-100/80">Longliners</div>
                </div>
              </div>
            </div>
            
            {/* Hover Tooltip */}
            {hoveredItem === 'commercial' && (
              <div className="absolute left-0 right-0 -bottom-1 translate-y-full bg-slate-800 rounded-lg p-2 border border-cyan-500/20 z-50">
                <div className="text-[10px] text-cyan-300">
                  Global Fishing Watch data showing commercial fishing vessels in your area
                </div>
              </div>
            )}
          </div>

          {/* Vessel Tracks */}
          {showTracks && (
            <div 
              className="group relative opacity-40"
              onMouseEnter={() => setHoveredItem('tracks')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 flex justify-center">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-cyan-400/60 rounded-full" />
                    <div className="w-3 h-[1px] bg-cyan-400/40" />
                    <div className="w-1 h-1 bg-cyan-400/60 rounded-full" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-cyan-100">Vessel Tracks</div>
                  <div className="text-[10px] text-cyan-400/60">4 hour history</div>
                </div>
              </div>
              
              {/* Hover Tooltip */}
              {hoveredItem === 'tracks' && (
                <div className="absolute left-0 right-0 -bottom-1 translate-y-full bg-slate-800 rounded-lg p-2 border border-cyan-500/20 z-50">
                  <div className="text-[10px] text-cyan-300">
                    Shows vessel movement paths from the last 4 hours
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-700/50 pt-3">
            <div className="text-[10px] text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>Active/Transmitting</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span>Inactive/Stationary</span>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-[9px] text-cyan-400/40 text-center">
            Hover over items for more info
          </div>
        </div>
      </div>
    </div>
  );
}