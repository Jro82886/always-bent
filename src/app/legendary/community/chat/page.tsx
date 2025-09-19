'use client';

import { useState } from 'react';
import dynamicLoad from 'next/dynamic';
import { MOCK_ROOMS } from '@/mocks/chat';
import { ChevronLeft } from 'lucide-react';
import { useAppState } from '@/store/appState';

// Dynamic imports handle client-side rendering
export const dynamic = 'force-dynamic';

// Dynamically import components that might use navigation hooks
const RoomSidebar = dynamicLoad(() => import('@/components/chat/RoomSidebar'), {
  ssr: false,
  loading: () => <div className="w-64 bg-slate-900 animate-pulse" />
});

const ChatWindow = dynamicLoad(() => import('@/components/chat/ChatWindow'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-slate-950 animate-pulse" />
});

const ContextPanel = dynamicLoad(() => import('@/components/chat/ContextPanel'), {
  ssr: false,
  loading: () => <div className="w-80 bg-slate-900 animate-pulse" />
});

const WeatherHeader = dynamicLoad(() => import('@/components/chat/WeatherHeader'), {
  ssr: false
});

export default function ChatPage() {
  const { selectedInletId } = useAppState();
  const [selectedRoom, setSelectedRoom] = useState('inlet');
  const [showMobileRoom, setShowMobileRoom] = useState(false);
  
  const currentRoom = MOCK_ROOMS.find(r => r.id === selectedRoom);

  // Mobile view
  const handleMobileRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId);
    setShowMobileRoom(true);
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-full">
        <RoomSidebar 
          selectedRoom={selectedRoom}
          onSelectRoom={setSelectedRoom}
        />
        <div className="flex-1">
          <ChatWindow 
            roomId={selectedRoom}
            showWeatherHeader={selectedRoom === 'inlet'}
          />
        </div>
        <ContextPanel 
          roomId={selectedRoom}
          inletId={selectedInletId || 'ny-montauk'}
        />
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-full">
        {!showMobileRoom ? (
          // Room List
          <div className="h-full bg-slate-950">
            <div className="p-4 border-b border-cyan-500/20">
              <h1 className="text-lg font-semibold text-white">Channels</h1>
            </div>
            <div className="overflow-y-auto">
              {MOCK_ROOMS.map(room => {
                const displayName = room.id === 'inlet' && selectedInletId 
                  ? `${selectedInletId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} Chat`
                  : room.name;
                  
                return (
                  <button
                    key={room.id}
                    onClick={() => handleMobileRoomSelect(room.id)}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors border-b border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{displayName}</span>
                    {room.unread > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
                        {room.unread}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{room.online} online</span>
                </button>
              );
              })}
            </div>
          </div>
        ) : (
          // Chat Room
          <div className="h-full flex flex-col">
            <div className="bg-slate-900 border-b border-cyan-500/20">
              <div className="flex items-center gap-3 p-3">
                <button
                  onClick={() => setShowMobileRoom(false)}
                  className="p-1 hover:bg-slate-800 rounded"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <h2 className="text-white font-medium flex-1">{currentRoom?.name}</h2>
                <span className="text-xs text-slate-500">{currentRoom?.online} online</span>
              </div>
            </div>
            <div className="flex-1">
              <ChatWindow 
                roomId={selectedRoom}
                showWeatherHeader={false}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
