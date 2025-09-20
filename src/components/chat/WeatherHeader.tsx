'use client';

import { Thermometer, Wind, Waves } from 'lucide-react';

interface WeatherHeaderProps {
  inletId?: string;
}

export default function WeatherHeader({ inletId }: WeatherHeaderProps) {
  // Mock weather data for inlet room
  // In Phase 3, this will pull from Stormio based on inletId
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 text-sm">
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
      {/* Inlet location */}
      <div className="text-xs text-slate-400 text-center">
        East Coast Overview · Your Selected Inlet
      </div>
    </div>
  );
}