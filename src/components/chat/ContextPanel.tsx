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
    <div className="w-80 bg-slate-900 border-l border-cyan-500/20 flex flex-col">
      {showWeather && (
        <div className="p-4 border-b border-cyan-500/20">
          <h3 className="text-sm font-medium text-white mb-3">Current Conditions</h3>
          <WeatherHeader />
        </div>
      )}
      
      <PresenceBar inletId={inletId} />
      
      <div className="flex-1 p-4">
        <h3 className="text-sm font-medium text-white mb-3">Room Info</h3>
        <div className="text-sm text-slate-400">
          Share fishing intel, conditions, and coordinate with other captains in your area.
        </div>
      </div>
    </div>
  );
}
