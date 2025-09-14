'use client';

import { useState } from 'react';
import { Target, ChevronDown, ChevronUp, ArrowLeftRight, Radio, Brain } from 'lucide-react';

interface UnifiedAnalysisPanelProps {
  onAnalyze: () => void;
  onModeSwitch: () => void;
  currentMode: 'analysis' | 'tracking';
}

export default function UnifiedAnalysisPanel({ 
  onAnalyze, 
  onModeSwitch,
  currentMode 
}: UnifiedAnalysisPanelProps) {
  const [legendExpanded, setLegendExpanded] = useState(true);
  
  // Analysis mode legend - what shows when you snip an area
  const analysisLegendItems = [
    { color: 'bg-cyan-500', label: 'Recreational', description: 'Historical tracks' },
    { color: 'bg-orange-500', label: 'Commercial', description: 'GFW vessels' },
    { color: 'bg-yellow-400', label: 'Hotspot', description: 'High confidence', pulse: true },
    { color: 'bg-red-500/60', label: 'SST Break', description: 'Temp gradient' },
    { color: 'bg-teal-500/60', label: 'Chlorophyll', description: 'Baitfish zone' }
  ];

  // Tracking mode legend - live vessel positions
  const trackingLegendItems = [
    { color: 'bg-green-500', label: 'Your Position', description: 'GPS location', pulse: true },
    { color: 'bg-blue-500', label: 'Fleet Member', description: 'Your network' },
    { color: 'bg-purple-500', label: 'Tournament', description: 'Competition mode' },
    { color: 'bg-yellow-400', label: 'Active Fishing', description: '1hr+ stationary', pulse: true },
    { color: 'bg-gray-500', label: 'Offline', description: 'No recent data' }
  ];

  const legendItems = currentMode === 'analysis' ? analysisLegendItems : trackingLegendItems;

  return (
    <div className="absolute top-20 right-4 z-40 flex flex-col gap-0 max-w-[280px]">
      {/* Ocean Analysis Section - Only show in analysis mode */}
      {currentMode === 'analysis' && (
        <div className="bg-slate-900/80 backdrop-blur-md rounded-t-xl border border-cyan-500/20 border-b-0">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-cyan-400" />
                <span className="text-sm font-medium text-cyan-300">Ocean Analysis</span>
              </div>
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[9px] font-medium rounded border border-cyan-500/20">
                BETA
              </span>
            </div>
            
            <button
              onClick={onAnalyze}
              className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 
                       hover:from-cyan-500/30 hover:to-blue-500/30 
                       text-cyan-300 text-sm font-medium rounded-lg 
                       border border-cyan-500/30 transition-all duration-200
                       flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" strokeDasharray="3 3" />
              </svg>
              Select Analysis Area
            </button>
          </div>
        </div>
      )}

      {/* Legend Section */}
      <div className={`bg-slate-900/80 backdrop-blur-md ${
        currentMode === 'analysis' ? 'border-x' : 'rounded-t-xl border border-b-0'
      } border-cyan-500/20`}>
        <button
          onClick={() => setLegendExpanded(!legendExpanded)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
        >
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {currentMode === 'analysis' ? 'Analysis Legend' : 'Tracking Legend'}
          </span>
          {legendExpanded ? (
            <ChevronUp size={12} className="text-slate-500" />
          ) : (
            <ChevronDown size={12} className="text-slate-500" />
          )}
        </button>
        
        {legendExpanded && (
          <div className="px-4 pb-3 space-y-1.5">
            {legendItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex items-center justify-center w-4">
                  {item.pulse ? (
                    <div className={`w-2 h-2 ${item.color} rounded-full animate-pulse`} />
                  ) : (
                    <div className={`w-3 h-0.5 ${item.color} rounded-full opacity-80`} />
                  )}
                </div>
                <span className="text-[11px] text-slate-300">{item.label}</span>
                <span className="text-[9px] text-slate-500 ml-auto">{item.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mode Section */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-b-xl border border-cyan-500/20 border-t-0">
        <div className="px-4 py-3 space-y-3">
          {/* Current Mode Indicator */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
              {currentMode === 'analysis' ? (
                <>
                  <Brain size={12} className="text-cyan-400" />
                  <span className="text-[10px] font-medium text-cyan-300 uppercase tracking-wider">
                    Historical Intelligence
                  </span>
                </>
              ) : (
                <>
                  <Radio size={12} className="text-orange-400 animate-pulse" />
                  <span className="text-[10px] font-medium text-orange-300 uppercase tracking-wider">
                    Live Tracking
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Mode Switch Button */}
          <button
            onClick={onModeSwitch}
            className={`w-full px-3 py-2 rounded-lg text-xs font-medium 
                     transition-all duration-200 flex items-center justify-center gap-2
                     ${currentMode === 'analysis' 
                       ? 'bg-gradient-to-r from-orange-500/10 to-orange-600/10 hover:from-orange-500/20 hover:to-orange-600/20 text-orange-300 border border-orange-500/30'
                       : 'bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 hover:from-cyan-500/20 hover:to-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                     }`}
          >
            <ArrowLeftRight size={12} />
            <span>Switch to</span>
            {currentMode === 'analysis' ? (
              <>
                <Radio size={12} className="text-orange-400" />
                <span className="font-bold">Live Tracking</span>
              </>
            ) : (
              <>
                <Brain size={12} className="text-cyan-400" />
                <span className="font-bold">Historical Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}