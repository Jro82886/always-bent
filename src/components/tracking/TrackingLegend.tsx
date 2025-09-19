'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getInletById } from '@/lib/inlets';

interface TrackingLegendProps {
  selectedInletId: string | null;
}

export default function TrackingLegend({ selectedInletId }: TrackingLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Get inlet glow color
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;
  const glowColor = inlet?.glowColor || '#00DDEB';

  return (
    <div className={`absolute right-4 top-24 z-10 transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-64'
    }`}>
      <div className="bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-cyan-500/20">
          {!isCollapsed && (
            <h3 className="text-sm font-medium text-white">Legend</h3>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-800/50 rounded transition-colors"
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4 text-cyan-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>

        {/* Legend Content */}
        {!isCollapsed && (
          <div className="p-4 space-y-3">
            {/* User Vessel */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                <div className="absolute inset-0 w-4 h-4 bg-white rounded-full animate-pulse" />
              </div>
              <span className="text-xs text-slate-300">Your Vessel</span>
            </div>
            
            {/* User Track */}
            <div className="flex items-center gap-3">
              <div className="w-4 h-0.5 bg-white" />
              <span className="text-xs text-slate-300">Your Track</span>
            </div>
            
            {/* Fleet Vessel */}
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: glowColor }}
              />
              <span className="text-xs text-slate-300">Fleet Vessel</span>
            </div>
            
            {/* Fleet Track */}
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-0.5"
                style={{ backgroundColor: glowColor }}
              />
              <span className="text-xs text-slate-300">Fleet Track</span>
            </div>
            
            {/* Commercial Types */}
            <div className="pt-2 border-t border-cyan-500/20 space-y-2">
              <div className="text-xs text-cyan-400 font-medium mb-2">Commercial</div>
              
              {/* Longliner */}
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-orange-400">
                  <path d="M12 2L4 7V12C4 16.5 7 20.26 12 21C17 20.26 20 16.5 20 12V7L12 2Z" 
                    stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3"/>
                  <path d="M12 2L4 7V12C4 16.5 7 20.26 12 21C17 20.26 20 16.5 20 12V7L12 2Z" 
                    stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                <span className="text-xs text-slate-300">Longliner</span>
              </div>
              
              {/* Trawler */}
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                  <rect x="4" y="8" width="16" height="8" rx="2" 
                    stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3"/>
                  <rect x="4" y="8" width="16" height="8" rx="2" 
                    stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                <span className="text-xs text-slate-300">Trawler</span>
              </div>
              
              {/* Drifter */}
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-purple-400">
                  <circle cx="12" cy="12" r="8" 
                    stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3"/>
                  <circle cx="12" cy="12" r="8" 
                    stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                <span className="text-xs text-slate-300">Drifter</span>
              </div>
              
              {/* Commercial Track */}
              <div className="flex items-center gap-3">
                <div className="w-4 h-0.5 border-b-2 border-dashed border-slate-400" />
                <span className="text-xs text-slate-300">Commercial Track</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
