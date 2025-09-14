'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Ship, Target, Waves, TrendingUp, Map, Info } from 'lucide-react';

interface LegendItem {
  icon?: React.ReactNode;
  color: string;
  glow: string;
  label: string;
  description: string;
  shape?: 'circle' | 'line' | 'pulse' | 'square';
}

const legendItems: LegendItem[] = [
  {
    color: '#0891b2', // Muted cyan
    glow: 'rgba(8, 145, 178, 0.4)',
    label: 'Recreational Vessels',
    description: 'Private boats & sport fishing',
    shape: 'line'
  },
  {
    color: '#f97316', // Muted orange
    glow: 'rgba(249, 115, 22, 0.4)',
    label: 'Commercial Vessels',
    description: 'Global Fishing Watch tracked',
    shape: 'line'
  },
  {
    color: '#10b981', // Muted emerald
    glow: 'rgba(16, 185, 129, 0.4)',
    label: 'Your Fleet',
    description: 'Boats in your network',
    shape: 'line'
  },
  {
    color: '#eab308', // Muted yellow
    glow: 'rgba(234, 179, 8, 0.6)',
    label: 'Hotspots',
    description: 'High-confidence fishing zones',
    shape: 'pulse'
  },
  {
    color: '#ef4444', // Muted red
    glow: 'rgba(239, 68, 68, 0.3)',
    label: 'Temperature Break',
    description: 'SST gradient edge',
    shape: 'square'
  },
  {
    color: '#14b8a6', // Muted teal
    glow: 'rgba(20, 184, 166, 0.3)',
    label: 'Chlorophyll Edge',
    description: 'Baitfish concentration',
    shape: 'square'
  },
  {
    color: '#3b82f6', // Brighter blue
    glow: 'rgba(59, 130, 246, 0.5)',
    label: 'Your Location',
    description: 'Current GPS position',
    shape: 'circle'
  },
  {
    color: '#8b5cf6', // Muted purple
    glow: 'rgba(139, 92, 246, 0.3)',
    label: 'Analysis Area',
    description: 'Snipped region for analysis',
    shape: 'square'
  }
];

interface MapLegendProps {
  collapsed?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function MapLegend({ 
  collapsed: initialCollapsed = false, 
  position = 'bottom-left' 
}: MapLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const positionClasses = {
    'top-left': 'top-20 left-4',
    'top-right': 'top-20 right-4',
    'bottom-left': 'bottom-24 left-4',
    'bottom-right': 'bottom-24 right-4'
  };

  const renderShape = (item: LegendItem) => {
    switch (item.shape) {
      case 'line':
        return (
          <div className="relative w-8 h-4 flex items-center">
            <div 
              className="w-full h-0.5 rounded-full"
              style={{ 
                backgroundColor: item.color,
                boxShadow: `0 0 8px ${item.glow}`
              }}
            />
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-slate-700"
              style={{ 
                backgroundColor: item.color,
                boxShadow: `0 0 12px ${item.glow}`
              }}
            />
          </div>
        );
      case 'pulse':
        return (
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div 
              className="absolute inset-0 rounded-full animate-ping opacity-75"
              style={{ backgroundColor: item.glow }}
            />
            <div 
              className="relative w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: item.color,
                boxShadow: `0 0 16px ${item.glow}`
              }}
            />
          </div>
        );
      case 'square':
        return (
          <div 
            className="w-4 h-4 rounded opacity-60"
            style={{ 
              backgroundColor: item.color,
              boxShadow: `0 0 10px ${item.glow}`
            }}
          />
        );
      case 'circle':
      default:
        return (
          <div 
            className="w-4 h-4 rounded-full border border-slate-700"
            style={{ 
              backgroundColor: item.color,
              boxShadow: `0 0 12px ${item.glow}`
            }}
          />
        );
    }
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-30 transition-all duration-300`}
    >
      {/* Collapsed State - Just Icon */}
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="bg-slate-900/95 backdrop-blur-md text-slate-300 p-3 rounded-xl shadow-xl hover:shadow-2xl border border-slate-800 hover:border-cyan-600/50 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-500" />
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-500 transition-colors" />
          </div>
        </button>
      ) : (
        /* Expanded State - Full Legend */
        <div className="bg-slate-900/95 backdrop-blur-md text-slate-300 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-gradient-to-r from-cyan-600/10 to-blue-600/10">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-cyan-500" />
              <h3 className="font-semibold text-sm text-slate-200">Map Legend</h3>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Legend Items */}
          <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
            {legendItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-800/50 transition-all duration-200 relative group"
                onMouseEnter={() => setShowTooltip(item.label)}
                onMouseLeave={() => setShowTooltip(null)}
              >
                {/* Shape/Icon */}
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  {renderShape(item)}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {item.description}
                  </div>
                </div>

                {/* Tooltip on hover */}
                {showTooltip === item.label && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none border border-slate-700">
                    <div className="font-semibold mb-1">{item.label}</div>
                    <div className="text-slate-400">{item.description}</div>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-slate-800" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Tip */}
          <div className="px-4 py-2 border-t border-slate-800 bg-slate-800/30">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-3 h-3" />
              <span>Click any marker for details</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reference Mini Cards (Always Visible) */}
      <div className="mt-3 flex gap-2">
        <div className="bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ 
              backgroundColor: '#eab308',
              boxShadow: '0 0 8px rgba(234, 179, 8, 0.6)'
            }}
          />
          <span className="text-xs text-slate-400">Active Hotspot</span>
        </div>
        <div className="bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <div className="flex gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: '#0891b2',
                boxShadow: '0 0 6px rgba(8, 145, 178, 0.4)'
              }}
            />
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: '#f97316',
                boxShadow: '0 0 6px rgba(249, 115, 22, 0.4)'
              }}
            />
          </div>
          <span className="text-xs text-slate-400">Vessel Activity</span>
        </div>
      </div>
    </div>
  );
}