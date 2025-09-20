'use client';

import WeatherHeader from './WeatherHeader';
import PresenceBar from './PresenceBar';
import HighlightCarousel from './HighlightCarousel';

interface ContextPanelProps {
  roomId: string;
  inletId?: string;
}

export default function ContextPanel({ roomId, inletId }: ContextPanelProps) {
  const showWeather = roomId === 'inlet';
  
  return (
    <div className="w-80 bg-slate-900/40 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl p-5 space-y-4">
      {/* Current Conditions Card */}
      {showWeather && (
        <div className="abfi-card-bg abfi-glow rounded-xl p-4">
          <div className="abfi-card-bg abfi-glow rounded-full px-3 py-1.5 text-sm inline-flex items-center gap-2 mb-3">
            <span className="font-semibold text-cyan-300">Current Conditions</span>
          </div>
          <WeatherHeader />
        </div>
      )}
      
      {/* Online Now Card with DM button */}
      <PresenceBar inletId={inletId} />
      
      {/* ABFI Highlights Card - Desktop only */}
      <div className="hidden md:block">
        <div className="abfi-card-bg abfi-glow rounded-xl p-4">
          <div className="abfi-card-bg abfi-glow rounded-full px-3 py-1.5 text-sm inline-flex items-center gap-2 mb-3">
            <span className="font-semibold text-cyan-300">ABFI Highlights</span>
          </div>
          <HighlightCarousel />
        </div>
      </div>
    </div>
  );
}
