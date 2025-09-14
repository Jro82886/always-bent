'use client';

import { ArrowLeftRight, Brain, Radio, Activity, Map } from 'lucide-react';

interface IntegratedModeSwitcherProps {
  currentMode: 'analysis' | 'tracking';
  onSwitch: () => void;
  position?: 'top' | 'bottom';
}

export default function IntegratedModeSwitcher({ 
  currentMode, 
  onSwitch,
  position = 'bottom' 
}: IntegratedModeSwitcherProps) {
  
  const isAnalysis = currentMode === 'analysis';
  const targetMode = isAnalysis ? 'Live Tracking' : 'Historical Analysis';
  const targetIcon = isAnalysis ? Radio : Brain;
  const Icon = targetIcon;
  const modeColor = isAnalysis ? 'cyan' : 'orange';
  
  if (position === 'top') {
    // Integrated into the top control area
    return (
      <button
        onClick={onSwitch}
        className={`
          flex items-center gap-2 px-4 py-2 
          bg-gradient-to-r from-slate-900/80 via-${modeColor}-950/80 to-slate-900/80 
          backdrop-blur-xl border border-${modeColor}-400/20 rounded-lg
          hover:border-${modeColor}-400/40 transition-all duration-300
          shadow-lg hover:shadow-xl
        `}
        style={{
          boxShadow: `0 0 20px rgba(${isAnalysis ? '0, 200, 255' : '255, 150, 0'}, 0.15)`,
        }}
      >
        <ArrowLeftRight size={14} className={`text-${modeColor}-400`} />
        <span className={`text-xs text-${modeColor}-100/70`}>Switch to</span>
        <Icon size={14} className={`text-${modeColor}-300`} />
        <span className={`text-xs font-bold text-${modeColor}-300`}>{targetMode}</span>
      </button>
    );
  }
  
  // Bottom integrated button - more prominent
  return (
    <div className="flex items-center justify-center">
      <button
        onClick={onSwitch}
        className={`
          group flex items-center gap-3 
          bg-gradient-to-r ${isAnalysis 
            ? 'from-slate-900/90 via-cyan-950/90 to-slate-900/90 border-cyan-400/30' 
            : 'from-slate-900/90 via-orange-950/90 to-slate-900/90 border-orange-400/30'
          }
          backdrop-blur-xl border rounded-full px-6 py-3 
          shadow-2xl hover:scale-105 transition-all duration-300
        `}
        style={{
          boxShadow: `0 0 30px rgba(${isAnalysis ? '0, 200, 255' : '255, 150, 0'}, 0.3), 
                      inset 0 0 20px rgba(${isAnalysis ? '0, 200, 255' : '255, 150, 0'}, 0.05)`
        }}
      >
        <ArrowLeftRight size={16} className={`text-${modeColor}-400`} />
        <div className="flex items-center gap-2">
          <span className={`text-xs text-${modeColor}-100/70`}>Switch to</span>
          <Icon size={14} className={`text-${modeColor}-300`} />
          <span className={`text-xs font-bold text-${modeColor}-300`}>{targetMode}</span>
        </div>
      </button>
    </div>
  );
}
