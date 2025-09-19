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
    <div className="p-4 border-b border-cyan-500/20">
      <h3 className="text-sm font-medium text-white mb-3">Online Now</h3>
      <div className="flex gap-3 overflow-x-auto">
        {MOCK_PRESENCE.filter(p => p.online).map(person => (
          <div key={person.userId} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="relative">
              <div 
                className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium text-sm ring-2"
                style={{ 
                  boxShadow: `0 0 12px ${glowColor}`,
                  borderColor: glowColor 
                }}
              >
                {person.name.charAt(0)}
              </div>
              <div 
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900"
                style={{ backgroundColor: glowColor }}
              />
            </div>
            <span className="text-xs text-slate-400 max-w-[60px] truncate">
              {person.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
