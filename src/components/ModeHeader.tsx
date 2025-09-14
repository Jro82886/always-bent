'use client';

import { Map, Activity, Brain, Radio } from 'lucide-react';

interface ModeHeaderProps {
  mode: 'analysis' | 'tracking';
}

export default function ModeHeader({ mode }: ModeHeaderProps) {
  if (mode === 'analysis') {
    return (
      <div className="absolute top-24 right-4 z-30 pointer-events-none">
        <div className="bg-gradient-to-r from-slate-900/60 via-cyan-950/60 to-slate-900/60 backdrop-blur-md border border-cyan-400/10 rounded-lg px-4 py-1.5 shadow-lg"
             style={{
               boxShadow: '0 0 30px rgba(0, 200, 255, 0.2), inset 0 0 20px rgba(0, 200, 255, 0.05)'
             }}>
          <div className="flex items-center gap-3">
            <Brain size={16} className="text-cyan-400" />
            <div className="flex flex-col">
              <div className="text-xs font-bold text-cyan-300 tracking-wider uppercase">
                Historical Intelligence Mode
              </div>
              <div className="text-[10px] text-cyan-100/60">
                Analyze patterns • Find hotspots • Track where vessels have been fishing
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'tracking') {
    return (
      <div className="absolute top-24 right-4 z-30 pointer-events-none">
        <div className="bg-gradient-to-r from-slate-900/60 via-orange-950/60 to-slate-900/60 backdrop-blur-md border border-orange-400/10 rounded-lg px-4 py-1.5 shadow-lg"
             style={{
               boxShadow: '0 0 30px rgba(255, 150, 0, 0.2), inset 0 0 20px rgba(255, 150, 0, 0.05)'
             }}>
          <div className="flex items-center gap-3">
            <Radio size={16} className="text-orange-400 animate-pulse" />
            <div className="flex flex-col">
              <div className="text-xs font-bold text-orange-300 tracking-wider uppercase">
                Live Fleet Tracking Mode
              </div>
              <div className="text-[10px] text-orange-100/60">
                Real-time positions • Fleet coordination • See where everyone is NOW
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
