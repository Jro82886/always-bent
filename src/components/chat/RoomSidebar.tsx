'use client';

import { MOCK_ROOMS } from '@/mocks/chat';
import { Users } from 'lucide-react';

interface RoomSidebarProps {
  selectedRoom: string;
  onSelectRoom: (roomId: string) => void;
}

export default function RoomSidebar({ selectedRoom, onSelectRoom }: RoomSidebarProps) {
  return (
    <div className="w-64 bg-slate-900 border-r border-cyan-500/20 flex flex-col">
      <div className="p-4 border-b border-cyan-500/20">
        <h2 className="text-lg font-semibold text-white">Channels</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {MOCK_ROOMS.map(room => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors ${
              selectedRoom === room.id ? 'bg-slate-800/50 border-l-2 border-cyan-400' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">{room.name}</span>
              {room.unread > 0 && (
                <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
                  {room.unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Users className="w-3 h-3" />
              <span>{room.online}</span>
            </div>
          </button>
        ))}
      </div>
      
      <div className="p-4 border-t border-cyan-500/20">
        <div className="text-xs text-slate-500">Direct Messages</div>
        <div className="mt-2 text-sm text-slate-400">Coming soon...</div>
      </div>
    </div>
  );
}
