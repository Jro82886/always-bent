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
  
  // Map room types to mention tags and styles
  const getMentionStyle = () => {
    switch(roomId) {
      case 'inlet': return 'abfi-mention-eastcoast';
      case 'tuna': return 'abfi-mention-tuna';
      case 'offshore': return 'abfi-mention-offshore';
      case 'inshore': return 'abfi-mention-inshore';
      default: return 'abfi-mention-eastcoast';
    }
  };
  
  const getMentionTag = () => {
    if (isDM) return roomName;
    switch(roomId) {
      case 'inlet': return '@eastcoastchat';
      case 'tuna': return '@tunachat';
      case 'offshore': return '@offshorechat';
      case 'inshore': return '@inshorechat';
      default: return `@${roomId}chat`;
    }
  };
  
  const getTooltip = () => {
    if (isDM) return `Direct Message with ${roomName}`;
    switch(roomId) {
      case 'inlet': return 'Notify everyone in East Coast Chat';
      case 'tuna': return 'Notify everyone in Tuna Chat';
      case 'offshore': return 'Notify everyone in Offshore Chat';
      case 'inshore': return 'Notify everyone in Inshore Chat';
      default: return `Notify everyone in ${roomName}`;
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/60 to-slate-900/40 backdrop-blur-md border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm">
          <span 
            className={`abfi-mention ${getMentionStyle()}`}
            title={getTooltip()}
          >
            {getMentionTag()}
          </span>
          {inlet && roomId === 'inlet' && (
            <>
              <span className="text-slate-400">·</span>
              <span className="text-slate-400">{inlet.name}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
