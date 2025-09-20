'use client';

import { MOCK_ROOMS } from '@/mocks/chat';
import { Users } from 'lucide-react';
import { useAppState } from '@/store/appState';
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
        <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] mb-4">Channels</h2>

        {/* Chat Intelligence Vision */}
        <div className="abfi-card-bg rounded-xl p-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold">
              <span className="text-cyan-400">OBSERVATION</span>
              <span className="text-slate-400">→</span>
              <span className="text-emerald-400">COLLABORATION</span>
              <span className="text-slate-400">→</span>
              <span className="text-amber-400">WISDOM</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <span className="text-cyan-300">Local reports</span> share what's happening NOW.
              <span className="text-emerald-300 ml-1">Captain insights</span> reveal what WORKS.
              Together, they create <span className="text-amber-300">real-time fishing wisdom</span> that helps everyone catch more.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {rooms.map(room => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`w-full px-4 py-3.5 mx-2 my-1 rounded-lg flex items-center justify-between hover:bg-slate-800/50 transition-all duration-200 ${
              selectedRoom === room.id ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-l-4 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/40' : 'hover:shadow-[0_0_15px_rgba(52,211,153,0.2)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">{room.name}</span>
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
        ))}
      </div>
      
    </div>
  );
}
