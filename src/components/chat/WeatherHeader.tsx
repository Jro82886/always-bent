'use client';

import { Thermometer, Wind, Waves } from 'lucide-react';

interface WeatherHeaderProps {
  inletId?: string;
}

export default function WeatherHeader({ inletId }: WeatherHeaderProps) {
  // Mock weather data for inlet room
  // In Phase 3, this will pull from Stormio based on inletId
  
  return (
    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20 px-4 py-3">
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-cyan-400" />
          <span className="font-medium text-white">68.7°F</span>
        </div>
        <div className="text-slate-600">|</div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-4 h-4 text-cyan-400" />
          <span className="text-white">12 kts (SW)</span>
        </div>
        <div className="text-slate-600">|</div>
        <div className="flex items-center gap-1.5">
          <Waves className="w-4 h-4 text-cyan-400" />
          <span className="text-white">3 ft @ 8 sec</span>
        </div>
      </div>
    </div>
  );
}