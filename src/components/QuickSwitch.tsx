'use client';

import { ArrowLeftRight, Brain, Radio } from 'lucide-react';

interface QuickSwitchProps {
  currentMode: string;
  onSwitch: (mode: string) => void;
}

export default function QuickSwitch({ currentMode, onSwitch }: QuickSwitchProps) {
  const targetMode = currentMode === 'analysis' ? 'tracking' : 'analysis';
  const targetLabel = currentMode === 'analysis' ? 'Live Tracking' : 'Historical Analysis';
  const targetIcon = currentMode === 'analysis' ? Radio : Brain;
  const Icon = targetIcon;
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => onSwitch(targetMode)}
        className="group flex items-center gap-3 bg-gradient-to-r from-slate-900/90 via-cyan-950/90 to-slate-900/90 backdrop-blur-xl border border-cyan-400/30 rounded-full px-5 py-3 shadow-2xl hover:scale-105 transition-all duration-300"
        style={{
          boxShadow: '0 0 30px rgba(0, 200, 255, 0.3), inset 0 0 20px rgba(0, 200, 255, 0.05)'
        }}
      >
        <ArrowLeftRight size={16} className="text-cyan-400" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-cyan-100/70">Switch to</span>
          <Icon size={14} className="text-cyan-300" />
          <span className="text-xs font-bold text-cyan-300">{targetLabel}</span>
        </div>
      </button>
    </div>
  );
}
