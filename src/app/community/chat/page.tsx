'use client';

import { useState } from 'react';
import RoomSidebar from '@/components/chat/RoomSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import ContextPanel from '@/components/chat/ContextPanel';
import WeatherHeader from '@/components/chat/WeatherHeader';
import { MOCK_ROOMS } from '@/mocks/chat';
import { ChevronLeft } from 'lucide-react';

export default function ChatPage() {
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
          inletId="ny-montauk"
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
              {MOCK_ROOMS.map(room => (
                <button
                  key={room.id}
                  onClick={() => handleMobileRoomSelect(room.id)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors border-b border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{room.name}</span>
                    {room.unread > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
                        {room.unread}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{room.online} online</span>
                </button>
              ))}
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
              {selectedRoom === 'inlet' && (
                <div className="px-3 pb-3">
                  <WeatherHeader />
                </div>
              )}
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
