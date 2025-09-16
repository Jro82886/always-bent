'use client';

import { useState } from 'react';
import { Info, X, Anchor, Ship, Radio, Navigation, Activity } from 'lucide-react';

interface CompactLegendProps {
  inletColor?: string;
  showYou?: boolean;
  showFleet?: boolean;
  showCommercial?: boolean;
  showABFINetwork?: boolean;
  showTracks?: boolean;
}

export default function CompactLegend({ 
  inletColor = '#00DDEB',
  showYou = false,
  showFleet = false,
  showCommercial = false,
  showABFINetwork = false,
  showTracks = false
}: CompactLegendProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count active layers
  const activeCount = [showYou, showFleet, showCommercial, showABFINetwork, showTracks].filter(Boolean).length;

  if (!isExpanded) {
    return (
      <div className="absolute bottom-8 left-3 z-10 ml-12">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-slate-900/90 backdrop-blur-xl rounded-lg p-2 border border-cyan-500/20 hover:bg-slate-900/95 transition-all group"
          title="Show Legend"
        >
          <Info size={16} className="text-cyan-400" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-[9px] font-bold text-slate-900 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-8 left-3 z-10 ml-12">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-lg border border-cyan-500/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/10">
          <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Map Legend</span>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-cyan-400/50 hover:text-cyan-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        
        {/* Legend Sections */}
        <div className="p-3 space-y-3">
          {/* Live Vessels Section */}
          <div>
            <div className="text-[10px] font-semibold text-cyan-400/70 uppercase tracking-wider mb-2">Live Vessels</div>
            <div className="space-y-2 text-xs">
              {/* Your Position */}
              <div className={`flex items-center gap-2 ${!showYou && 'opacity-30'}`}>
                <div className="w-4 flex justify-center">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_12px_rgba(0,255,255,1)]" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-white animate-ping opacity-75" />
                  </div>
                </div>
                <span className="text-cyan-100/80 flex-1">Your Vessel</span>
                {showYou && <Navigation size={10} className="text-green-400" />}
              </div>
              
              {/* Fleet Members */}
              <div className={`flex items-center gap-2 ${!showFleet && 'opacity-30'}`}>
                <div className="w-4 flex justify-center">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: inletColor,
                      boxShadow: `0 0 8px ${inletColor}80`
                    }}
                  />
                </div>
                <span className="text-cyan-100/80 flex-1">Fleet Members</span>
                {showFleet && <Radio size={10} className="text-cyan-400" />}
              </div>
              
              {/* ABFI Network */}
              <div className={`flex items-center gap-2 ${!showABFINetwork && 'opacity-30'}`}>
                <div className="w-4 flex justify-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 shadow-[0_0_6px_rgba(0,191,255,0.5)]" />
                </div>
                <span className="text-cyan-100/80 flex-1">ABFI Network</span>
                {showABFINetwork && <Activity size={10} className="text-blue-400" />}
              </div>
            </div>
          </div>

          {/* Commercial Vessels Section */}
          {showCommercial && (
            <div>
              <div className="text-[10px] font-semibold text-orange-400/70 uppercase tracking-wider mb-2">Commercial (GFW)</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 flex justify-center">
                    <div className="w-3 h-3 bg-orange-500/80 rounded-sm" />
                  </div>
                  <span className="text-cyan-100/80 flex-1">Trawler</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-4 flex justify-center">
                    <div className="w-3 h-2 bg-orange-600/80 rounded-sm" />
                  </div>
                  <span className="text-cyan-100/80 flex-1">Longliner</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-4 flex justify-center">
                    <div className="w-4 h-2 bg-red-600/80 rounded-sm" />
                  </div>
                  <span className="text-cyan-100/80 flex-1">Factory Ship</span>
                </div>
              </div>
            </div>
          )}

          {/* Tracks Section */}
          {showTracks && (
            <div>
              <div className="text-[10px] font-semibold text-purple-400/70 uppercase tracking-wider mb-2">Historical</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 flex items-center justify-center">
                    <div className="flex items-center gap-0.5">
                      <div className="w-1 h-1 bg-cyan-400/60 rounded-full" />
                      <div className="w-2 h-[1px] bg-cyan-400/40" />
                      <div className="w-1 h-1 bg-cyan-400/60 rounded-full" />
                    </div>
                  </div>
                  <span className="text-cyan-100/80 flex-1">4hr Track</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-4 flex justify-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80 animate-pulse" />
                  </div>
                  <span className="text-cyan-100/80 flex-1">Fishing Spot</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="pt-2 border-t border-slate-700/50">
            <div className="text-[10px] font-semibold text-slate-400/70 uppercase tracking-wider mb-2">Status</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 flex justify-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_4px_rgba(74,222,128,0.8)]" />
                </div>
                <span className="text-cyan-100/80">Active/Online</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 flex justify-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                </div>
                <span className="text-cyan-100/80">Offline</span>
              </div>
            </div>
          </div>

          {/* Info Footer */}
          <div className="pt-2 border-t border-slate-700/50">
            <p className="text-[9px] text-slate-500 italic">
              {showTracks ? 'Tracks show last 4 hours' : 'Live positions update every 30s'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}