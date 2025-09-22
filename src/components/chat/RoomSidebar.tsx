'use client';

import { MOCK_ROOMS } from '@/mocks/chat';
import { Users } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { getInletById } from '@/lib/inlets';

interface RoomSidebarProps {
  selectedRoom: string;
  onSelectRoom: (roomId: string) => void;
}

export default function RoomSidebar({ selectedRoom, onSelectRoom }: RoomSidebarProps) {
  const { selectedInletId } = useAppState();
  const inlet = getInletById(selectedInletId);
  
  // Update room list with dynamic inlet name
  const rooms = MOCK_ROOMS.map(room => {
    if (room.id === 'inlet' && inlet) {
      return {
        ...room,
        name: `${inlet.name} Chat`
      };
    }
    return room;
  });
  
  return (
    <div className="w-72 bg-slate-900/40 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl">
      <div className="p-5 border-b border-white/10">
        <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">Channels</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {rooms.map(room => {
          const getMentionStyle = () => {
            switch(room.id) {
              case 'inlet': return 'abfi-mention-eastcoast';
              case 'tuna': return 'abfi-mention-tuna';
              case 'offshore': return 'abfi-mention-offshore';
              case 'inshore': return 'abfi-mention-inshore';
              default: return 'abfi-mention-eastcoast';
            }
          };
          
          const getMentionTag = () => {
            switch(room.id) {
              case 'inlet': return '@eastcoastchat';
              case 'tuna': return '@tunachat';
              case 'offshore': return '@offshorechat';
              case 'inshore': return '@inshorechat';
              default: return `@${room.id}chat`;
            }
          };
          
          const getTooltip = () => {
            switch(room.id) {
              case 'inlet': return 'Notify everyone in East Coast Chat';
              case 'tuna': return 'Notify everyone in Tuna Chat';
              case 'offshore': return 'Notify everyone in Offshore Chat';
              case 'inshore': return 'Notify everyone in Inshore Chat';
              default: return `Notify everyone in ${room.name}`;
            }
          };
          
          return (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`w-full px-4 py-3.5 mx-2 my-1 rounded-lg flex items-center justify-between hover:bg-slate-800/50 transition-all duration-200 ${
                selectedRoom === room.id ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-l-4 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/40' : 'hover:shadow-[0_0_15px_rgba(52,211,153,0.2)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span 
                  className={`abfi-mention ${getMentionStyle()}`}
                  title={getTooltip()}
                >
                  {getMentionTag()}
                </span>
                {room.unread > 0 && (
                  <span className="px-2.5 py-1 text-xs bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)] font-medium">
                    {room.unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Users className="w-3 h-3" />
                <span>{room.online}</span>
              </div>
            </button>
          );
        })}
      </div>
      
    </div>
  );
}
