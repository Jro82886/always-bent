'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Anchor, Fish, Navigation, Activity, Droplets, Target } from 'lucide-react';

interface LegendItem {
  icon: React.ReactNode;
  color: string;
  glow: string;
  label: string;
  description: string;
  shape?: 'line' | 'dot' | 'pulse';
}

const legendItems: LegendItem[] = [
  {
    icon: <div className="w-3 h-3 bg-white rounded-full border border-cyan-400/50" />,
    color: '#ffffff',
    glow: 'rgba(14, 165, 233, 0.4)',
    label: 'You',
    description: 'Your vessel',
    shape: 'dot'
  },
  {
    icon: <div className="w-2.5 h-2.5 bg-current rounded-full" />,
    color: 'var(--inlet-color, #e74c3c)',
    glow: 'var(--inlet-glow, rgba(231, 76, 60, 0.3))',
    label: 'Fleet',
    description: 'Inlet members',
    shape: 'dot'
  },
  {
    icon: <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[6px] border-transparent border-b-orange-500" />,
    color: '#f39c12',
    glow: 'rgba(243, 156, 18, 0.3)',
    label: 'Commercial',
    description: 'GFW vessels',
    shape: 'dot'
  },
  {
    icon: <div className="w-3 h-0.5 bg-white/40 rounded-full" />,
    color: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.2)',
    label: 'Your Track',
    description: 'Last 24hrs',
    shape: 'line'
  },
  {
    icon: <div className="w-3 h-0.5 bg-current/40 rounded-full" style={{ borderStyle: 'dashed' }} />,
    color: 'var(--inlet-color, #e74c3c)',
    glow: 'var(--inlet-glow, rgba(231, 76, 60, 0.2))',
    label: 'Fleet Tracks',
    description: 'Last 4 days',
    shape: 'line'
  },
  {
    icon: <div className="w-3 h-0.5 bg-orange-500/40 rounded-full" style={{ borderStyle: 'dotted' }} />,
    color: '#f39c12',
    glow: 'rgba(243, 156, 18, 0.2)',
    label: 'Commercial Tracks',
    description: 'Historical',
    shape: 'line'
  }
];

interface MapLegendProps {
  collapsed?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  mode?: 'analysis' | 'tracking';
  showUser?: boolean;
  showFleet?: boolean;
  showCommercial?: boolean;
  showTracks?: boolean;
}

export default function MapLegend({ 
  collapsed: initialCollapsed = false, 
  position = 'bottom-left',
  mode = 'analysis',
  showUser = true,
  showFleet = true,
  showCommercial = true,
  showTracks = false
}: MapLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  
  // Filter legend items based on mode and visibility settings
  const filteredItems = mode === 'tracking' 
    ? legendItems.filter(item => {
        if (item.label === 'You' && !showUser) return false;
        if (item.label === 'Fleet' && !showFleet) return false;
        if (item.label === 'Commercial' && !showCommercial) return false;
        if (item.shape === 'line' && !showTracks) return false;
        return true;
      })
    : legendItems;

  const positionClasses = {
    'top-left': 'top-20 left-4',
    'top-right': 'top-20 right-4',
    'bottom-left': 'bottom-24 left-4',
    'bottom-right': 'bottom-24 right-4'
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-30 transition-all duration-500`}
    >
      {isCollapsed ? (
        /* Collapsed - Minimal Icon */
        <button
          onClick={() => setIsCollapsed(false)}
          className="bg-slate-900/80 backdrop-blur-sm p-2.5 rounded-lg border border-slate-800/50 hover:border-cyan-600/30 transition-all group"
        >
          <div className="flex items-center gap-1.5">
            <div className="flex flex-col gap-0.5">
              <div className="w-3 h-0.5 bg-cyan-500/60 rounded-full" />
              <div className="w-3 h-0.5 bg-orange-500/60 rounded-full" />
              <div className="w-3 h-0.5 bg-emerald-500/60 rounded-full" />
            </div>
            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-500/60 transition-colors" />
          </div>
        </button>
      ) : (
        /* Expanded - Sleek Vertical List */
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-800/50 overflow-hidden">
          {/* Minimal Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/30">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Legend</span>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-slate-600 hover:text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>

          {/* Compact Legend Items */}
          <div className="p-2 space-y-1">
            {filteredItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-800/30 transition-colors group"
              >
                {/* Icon/Shape */}
                <div className="flex-shrink-0 w-4 flex items-center justify-center">
                  {item.shape === 'line' ? (
                    <div className="relative w-4 h-2 flex items-center">
                      <div 
                        className="w-full h-0.5 rounded-full"
                        style={{ 
                          backgroundColor: item.color + '80',
                          boxShadow: `0 0 4px ${item.glow}`
                        }}
                      />
                    </div>
                  ) : item.shape === 'pulse' ? (
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      <div 
                        className="absolute inset-0 rounded-full animate-ping opacity-30"
                        style={{ backgroundColor: item.color }}
                      />
                      <div 
                        className="relative w-1.5 h-1.5 rounded-full"
                        style={{ 
                          backgroundColor: item.color,
                          boxShadow: `0 0 6px ${item.glow}`
                        }}
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-2 h-2 rounded-sm opacity-50"
                      style={{ 
                        backgroundColor: item.color,
                        boxShadow: `0 0 4px ${item.glow}`
                      }}
                    />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-300">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-600 hidden group-hover:inline">
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ultra-Minimal Quick Reference */}
      <div className="mt-2 flex gap-1.5">
        <div className="bg-slate-900/60 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-800/30 flex items-center gap-1.5">
          <div 
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ 
              backgroundColor: '#fbbf24',
              boxShadow: '0 0 4px rgba(251, 191, 36, 0.5)'
            }}
          />
          <span className="text-[10px] text-slate-500">Active</span>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-800/30 flex items-center gap-1">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-cyan-500/60" />
            <div className="w-1 h-1 rounded-full bg-orange-500/60" />
          </div>
          <span className="text-[10px] text-slate-500">Vessels</span>
        </div>
      </div>
    </div>
  );
}