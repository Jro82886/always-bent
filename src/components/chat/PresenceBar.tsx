'use client';

import { MOCK_PRESENCE } from '@/mocks/chat';
import { getInletById } from '@/lib/inlets';

interface PresenceBarProps {
  inletId?: string;
}

export default function PresenceBar({ inletId = 'ny-montauk' }: PresenceBarProps) {
  const inlet = getInletById(inletId);
  const glowColor = inlet?.glowColor || '#00DDEB';
  
  return (
    <div className="abfi-card-bg abfi-glow rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="abfi-card-bg abfi-glow rounded-full px-3 py-1.5 text-sm inline-flex items-center gap-2">
          <span className="font-semibold text-cyan-300">Online Now</span>
        </div>
        <button className="abfi-card-bg abfi-glow abfi-glow-hover rounded-full px-3 py-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors">
          Direct Messages
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto py-2 px-1">
        {MOCK_PRESENCE.filter(p => p.online).map(person => (
          <div key={person.userId} className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="relative p-1">
              <div 
                className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-semibold text-sm abfi-avatar ring-1 ring-emerald-400/30 transition-all duration-200 hover:scale-110"
              >
                {person.name.charAt(0)}
              </div>
              <div 
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900 animate-pulse"
                style={{ 
                  backgroundColor: glowColor,
                  boxShadow: `0 0 10px ${glowColor}`
                }}
              />
            </div>
            <span className="text-xs text-slate-300/80 max-w-[60px] truncate font-medium">
              {person.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
