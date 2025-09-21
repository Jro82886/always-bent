'use client';

import { Ship, Anchor, Waves, Fish } from 'lucide-react';

interface GFWLegendProps {
  showCommercial: boolean;
  vesselCounts?: {
    longliner: number;
    drifting_longline: number;
    trawler: number;
    fishing_events: number;
  };
}

export default function GFWLegend({ showCommercial, vesselCounts }: GFWLegendProps) {
  if (!showCommercial) return null;

  const vesselTypes = [
    {
      type: 'longliner',
      label: 'Longliner',
      color: '#FF6B6B',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2v10m0 0c0 2-2 4-4 4s-4-2-4-4 2-4 4-4m4 4c0 2 2 4 4 4s4-2 4-4-2-4-4-4" 
            stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
      )
    },
    {
      type: 'drifting_longline',
      label: 'Drifting Longline',
      color: '#4ECDC4',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M3 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" 
            stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="6" cy="16" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
          <circle cx="18" cy="16" r="1.5" fill="currentColor"/>
        </svg>
      )
    },
    {
      type: 'trawler',
      label: 'Trawler',
      color: '#45B7D1',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v6l-4 4v5h8v-5l-4-4V3" 
            stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3"/>
          <path d="M8 18c0 1.5 1.8 3 4 3s4-1.5 4-3" 
            stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      )
    }
  ];

  return (
    <div className="absolute bottom-24 right-4 bg-slate-900/95 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <Ship className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium text-white">Commercial Fishing Vessels</span>
      </div>
      
      <div className="space-y-2">
        {vesselTypes.map(({ type, label, color, icon }) => {
          const count = vesselCounts?.[type as keyof typeof vesselCounts] || 0;
          return (
            <div key={type} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4" style={{ color }}>
                  {icon}
                </div>
                <span className="text-gray-300">{label}</span>
              </div>
              <span className="text-gray-400 ml-4">{count}</span>
            </div>
          );
        })}
        
        {vesselCounts?.fishing_events && vesselCounts.fishing_events > 0 && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Fish className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-300">Active Fishing</span>
            </div>
            <span className="text-gray-400 ml-4">{vesselCounts.fishing_events}</span>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-2 border-t border-white/10">
        <p className="text-[10px] text-gray-500">
          Data: Global Fishing Watch • {new Date().toLocaleDateString()}
        </p>
        <p className="text-[10px] text-gray-500 mt-1">
          7-day history • Updates every 5 min
        </p>
      </div>
    </div>
  );
}
