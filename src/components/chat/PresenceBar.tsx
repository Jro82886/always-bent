'use client';

import { MOCK_PRESENCE } from '@/mocks/chat';
import { getInletById } from '@/lib/inlets';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface PresenceBarProps {
  inletId?: string;
}

export default function PresenceBar({ inletId = 'ny-montauk' }: PresenceBarProps) {
  const inlet = getInletById(inletId);
  const glowColor = inlet?.glowColor || '#00DDEB';
  const router = useRouter();
  const supabase = createClient();
  
  // Open or create DM with captain
  async function openOrCreateDM(targetUserId: string) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user logged in');
        return;
      }
      
      // For now, just navigate to DM mode with target user ID
      // In production, this would create/find the actual DM thread
      router.push(`/legendary/community/chat?dm=${targetUserId}`);
    } catch (error) {
      console.error('Error opening DM:', error);
    }
  }

  return (
    <div className="abfi-card-bg abfi-glow rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="abfi-card-bg abfi-glow rounded-full px-3 py-1.5 text-sm inline-flex items-center gap-2">
          <span className="font-semibold text-cyan-300">Online Now</span>
        </div>
        <button 
          onClick={() => router.push('/legendary/community/chat?mode=dm')}
          className="abfi-card-bg abfi-glow abfi-glow-hover rounded-full px-3 py-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors"
        >
          Direct Messages
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto py-2 px-1">
        {MOCK_PRESENCE.filter(p => p.online).map(person => (
          <div key={person.userId} className="flex flex-col items-center gap-2 flex-shrink-0">
            <button
              onClick={() => openOrCreateDM(person.userId)}
              className="relative p-1 group focus:outline-none focus:ring-2 focus:ring-emerald-400/50 rounded-full"
              title={`Direct Message ${person.name}`}
              aria-label={`Direct Message ${person.name}`}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-semibold text-sm abfi-avatar ring-1 ring-emerald-400/30 transition-all duration-200 group-hover:scale-110 rounded-full">
                {person.name.charAt(0)}
              </div>
              <div
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900 animate-pulse"
                style={{
                  backgroundColor: glowColor,
                  boxShadow: `0 0 10px ${glowColor}`
                }}
              />
            </button>
            <span className="text-xs text-slate-300/80 max-w-[60px] truncate font-medium">
              {person.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
