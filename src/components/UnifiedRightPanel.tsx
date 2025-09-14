'use client';

import { useState } from 'react';
import { Target, ChevronDown, ChevronUp, Radio, Brain, Activity, Map, Navigation, HelpCircle, GraduationCap } from 'lucide-react';

interface UnifiedRightPanelProps {
  onAnalyze: () => void;
  currentMode: 'analysis' | 'tracking';
  isTracking?: boolean;
  onStartTracking?: () => void;
  onStopTracking?: () => void;
}

export default function UnifiedRightPanel({ 
  onAnalyze, 
  currentMode,
  isTracking = false,
  onStartTracking,
  onStopTracking
}: UnifiedRightPanelProps) {
  const [legendExpanded, setLegendExpanded] = useState(true);
  const [tutorialExpanded, setTutorialExpanded] = useState(false);
  
  const startTutorial = () => {
    // Trigger the interactive tutorial
    localStorage.removeItem('abfi_tutorial_seen');
    window.location.reload();
  };
  
  // Analysis mode legend - Historical data visualization
  const analysisLegendItems = [
    { 
      color: 'bg-cyan-500', 
      label: 'Recreational', 
      description: '4-day history',
      visible: true // Always visible when snipping
    },
    { 
      color: 'bg-orange-500', 
      label: 'Commercial (GFW)', 
      description: 'Fishing vessels',
      visible: true // Always visible when snipping
    },
    { 
      color: 'bg-yellow-400', 
      label: 'Hotspot', 
      description: 'High confidence', 
      pulse: true,
      visible: true // Shows after analysis
    },
    { 
      color: 'bg-gradient-to-r from-red-500/60 to-orange-500/60', 
      label: 'SST Break', 
      description: 'Temperature edge',
      visible: true // When SST layer is on
    },
    { 
      color: 'bg-gradient-to-r from-teal-500/60 to-green-500/60', 
      label: 'Chlorophyll Edge', 
      description: 'Baitfish zone',
      visible: true // When CHL layer is on
    }
  ];

  // Tracking mode legend - Live vessel positions
  const trackingLegendItems = [
    { 
      color: 'bg-green-500', 
      label: 'Your Position', 
      description: 'Live GPS', 
      pulse: true,
      visible: isTracking
    },
    { 
      color: 'bg-blue-500', 
      label: 'Fleet Members', 
      description: 'Your network',
      visible: true
    },
    { 
      color: 'bg-purple-500', 
      label: 'Tournament', 
      description: 'Competition',
      visible: false // Only in tournament mode
    },
    { 
      color: 'bg-yellow-400', 
      label: 'Fishing Hotspot', 
      description: '1hr+ stationary', 
      pulse: true,
      visible: true
    },
    { 
      color: 'bg-gray-500', 
      label: 'Offline Vessel', 
      description: 'No recent data',
      visible: true
    }
  ];

  const legendItems = currentMode === 'analysis' ? analysisLegendItems : trackingLegendItems;
  const visibleItems = legendItems.filter(item => item.visible);

  return (
    <div className="absolute top-20 right-4 z-40 flex flex-col gap-0 w-[280px]">
      {/* Tutorial Section - Only in Analysis Mode */}
      {currentMode === 'analysis' && (
        <div className="bg-slate-900/80 backdrop-blur-md rounded-t-xl border border-slate-500/20 border-b-0">
          <button
            onClick={() => setTutorialExpanded(!tutorialExpanded)}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <GraduationCap size={14} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Learn Snipping Tool
              </span>
            </div>
            {tutorialExpanded ? (
              <ChevronUp size={12} className="text-slate-500" />
            ) : (
              <ChevronDown size={12} className="text-slate-500" />
            )}
          </button>
          
          {tutorialExpanded && (
            <div className="px-4 pb-3 border-t border-slate-700/30">
              <div className="space-y-2 mt-2">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Learn how to analyze ocean conditions and find fishing hotspots.
                </p>
                <button
                  onClick={startTutorial}
                  className="w-full px-3 py-1.5 bg-gradient-to-r from-slate-700/50 to-slate-600/50 
                           hover:from-slate-700/70 hover:to-slate-600/70 
                           text-slate-300 text-xs font-medium rounded-lg 
                           border border-slate-600/30 transition-all duration-200
                           flex items-center justify-center gap-2"
                >
                  <HelpCircle size={12} />
                  <span>Start Tutorial</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Top Action Section */}
      <div className={`bg-slate-900/80 backdrop-blur-md ${currentMode === 'analysis' && !tutorialExpanded ? 'border-t border-slate-700/30' : currentMode === 'tracking' ? 'rounded-t-xl' : ''} border-x border-cyan-500/20 border-b-0`}>
        <div className="px-4 py-3">
          {currentMode === 'analysis' ? (
            <>
              {/* Analysis Mode - Ocean Analysis Tool */}
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
            </>
          ) : (
            <>
              {/* Tracking Mode - Vessel Tracking Control */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Navigation size={14} className="text-orange-400" />
                  <span className="text-sm font-medium text-orange-300">Vessel Tracking</span>
                </div>
                {isTracking && (
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[9px] font-medium rounded border border-green-500/30 animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              
              {onStartTracking && onStopTracking && (
                <button
                  onClick={isTracking ? onStopTracking : onStartTracking}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium 
                           transition-all duration-200 flex items-center justify-center gap-2
                           ${isTracking 
                             ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                             : 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30'
                           }`}
                >
                  {isTracking ? (
                    <>
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      Stop Tracking
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      Start Tracking
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend Section */}
      <div className={`bg-slate-900/80 backdrop-blur-md ${currentMode === 'analysis' ? 'border-x' : 'rounded-b-xl border border-t-0'} border-cyan-500/20`}>
        <button
          onClick={() => setLegendExpanded(!legendExpanded)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-800/50 transition-colors border-b border-cyan-500/10"
        >
          <div className="flex items-center gap-2">
            <Map size={12} className="text-slate-500" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Map Legend
            </span>
          </div>
          {legendExpanded ? (
            <ChevronUp size={12} className="text-slate-500" />
          ) : (
            <ChevronDown size={12} className="text-slate-500" />
          )}
        </button>
        
        {legendExpanded && (
          <div className="px-4 py-3 space-y-2">
            {visibleItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 group">
                <div className="flex items-center justify-center w-4">
                  {item.pulse ? (
                    <div className={`w-2 h-2 ${item.color} rounded-full animate-pulse`} />
                  ) : item.color.includes('gradient') ? (
                    <div className={`w-3 h-3 ${item.color} rounded`} />
                  ) : (
                    <div className={`w-3 h-0.5 ${item.color} rounded-full opacity-80`} />
                  )}
                </div>
                <span className="text-[11px] text-slate-300 flex-1">{item.label}</span>
                <span className="text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.description}
                </span>
              </div>
            ))}
            
            {/* Context info */}
            {currentMode === 'analysis' && (
              <div className="pt-2 mt-2 border-t border-slate-700/50">
                <p className="text-[9px] text-slate-500 italic">
                  Vessel tracks show last 4 days
                </p>
              </div>
            )}
            {currentMode === 'tracking' && (
              <div className="pt-2 mt-2 border-t border-slate-700/50">
                <p className="text-[9px] text-slate-500 italic">
                  Live positions update every 30s
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Mode Indicator - Clickable */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-b-xl border border-cyan-500/20 border-t-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-center">
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/30 hover:bg-slate-800/50 rounded transition-colors cursor-pointer"
              onClick={() => {
                // This will be handled by parent component
                const modeSwitch = document.querySelector('[data-compact-mode-switch]') as HTMLButtonElement;
                if (modeSwitch) modeSwitch.click();
              }}
            >
              {currentMode === 'analysis' ? (
                <>
                  <Brain size={10} className="text-cyan-400/70" />
                  <span className="text-[9px] font-medium text-cyan-300/70 uppercase tracking-wider">
                    Historical Mode
                  </span>
                </>
              ) : (
                <>
                  <Radio size={10} className="text-orange-400/70" />
                  <span className="text-[9px] font-medium text-orange-300/70 uppercase tracking-wider">
                    Live Mode
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
