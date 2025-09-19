'use client';

import { Thermometer, Wind, Waves } from 'lucide-react';

export default function WeatherHeader() {
  // Mock weather data for inlet room
  return (
    <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg px-3 py-2 flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1.5 text-cyan-400">
        <Thermometer className="w-3 h-3" />
        <span className="font-medium">68.7°F</span>
      </div>
      <div className="text-slate-400">|</div>
      <div className="flex items-center gap-1.5 text-white">
        <Wind className="w-3 h-3 text-cyan-400" />
        <span>12 kt SW</span>
      </div>
      <div className="text-slate-400">|</div>
      <div className="flex items-center gap-1.5 text-white">
        <Waves className="w-3 h-3 text-cyan-400" />
        <span>3 ft @ 8 s</span>
      </div>
    </div>
  );
}
