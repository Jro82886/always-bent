'use client';

import { Hash, MessageCircle } from 'lucide-react';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';

interface RoomBarProps {
  roomId: string;
  roomName: string;
  isDM?: boolean;
}

export default function RoomBar({ roomId, roomName, isDM = false }: RoomBarProps) {
  const { selectedInletId } = useAppState();
  const inlet = getInletById(selectedInletId);
  
  // For inlet chat, show the inlet name
  const displayName = roomId === 'inlet' && inlet 
    ? `${inlet.name} Chat` 
    : roomName;

  return (
    <div className="bg-gradient-to-b from-slate-900/60 to-slate-900/40 backdrop-blur-md border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-center">
        <div className="abfi-card-bg abfi-glow px-4 py-2 rounded-full flex items-center gap-3">
          {isDM ? (
            <MessageCircle className="w-4 h-4 text-cyan-300" />
          ) : (
            <Hash className="w-4 h-4 text-cyan-300" />
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-cyan-300">{displayName}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-400">
              {isDM ? 'Direct Message' : roomId === 'inlet' && inlet ? 'Your Inlet' : 'Channel'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
