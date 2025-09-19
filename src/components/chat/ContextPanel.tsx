'use client';

import WeatherHeader from './WeatherHeader';
import PresenceBar from './PresenceBar';

interface ContextPanelProps {
  roomId: string;
  inletId?: string;
}

export default function ContextPanel({ roomId, inletId }: ContextPanelProps) {
  const showWeather = roomId === 'inlet';
  
  return (
    <div className="w-80 bg-slate-900/40 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl">
      {showWeather && (
        <div className="p-5 border-b border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-tl-2xl">
          <h3 className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">Current Conditions</h3>
          <WeatherHeader />
        </div>
      )}
      
      <PresenceBar inletId={inletId} />
      
      <div className="flex-1 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-400/80 to-teal-400/80 bg-clip-text text-transparent mb-4">Room Info</h3>
        <div className="text-sm text-slate-300/80 leading-relaxed p-4 rounded-lg bg-white/5 border border-white/10">
          Share fishing intel, conditions, and coordinate with other captains in your area.
        </div>
      </div>
    </div>
  );
}
