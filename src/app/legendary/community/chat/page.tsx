'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
// import { MOCK_ROOMS } from '@/mocks/chat'; // TODO: Remove mock rooms
import { ChevronLeft } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { initChatClient } from '@/lib/services/chat';

// Dynamically import components to avoid SSR issues
const RoomSidebar = dynamic(() => import('@/components/chat/RoomSidebar'), {
  ssr: false,
  loading: () => <div className="w-64 bg-slate-900 animate-pulse" />
});

// Use live chat window (useRealtimeChat) — no mocks
const ChatWindow = dynamic(() => import('@/components/chat/ChatWindowLive'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-slate-950 animate-pulse" />
});

// Deprecated for MVP: unifying on useRealtimeChat via ChatWindowLive

// Temporarily remove ContextPanel to avoid spinner placeholder until wired

const WeatherHeader = dynamic(() => import('@/components/chat/WeatherHeader'), {
  ssr: false
});

export default function ChatPage() {
  const { selectedInletId, user } = useAppState();
  const [selectedRoom, setSelectedRoom] = useState('inlet');
  const [showMobileRoom, setShowMobileRoom] = useState(false);
  const roomIdForInlet = selectedInletId && selectedInletId !== 'overview' 
    ? `inlet:${selectedInletId}` 
    : null;
  const clientRef = useRef<ReturnType<typeof initChatClient> | null>(null);

  // Auto-join/leave rooms on inlet change (no new helpers; reuse existing client)
  useEffect(() => {
    const client = initChatClient();
    clientRef.current = client;

    // Always join global tuna (idempotent via unsubscribe/subscribe in client)
    client.subscribe('global:tuna', () => {});

    // Join inlet-scoped rooms if we have an inlet
    if (roomIdForInlet) {
      // Inlet main
      client.subscribe(roomIdForInlet, () => {});
      // Inshore / Offshore
      client.subscribe(`${roomIdForInlet}:inshore`, () => {});
      client.subscribe(`${roomIdForInlet}:offshore`, () => {});
    }

    return () => {
      // Leave all on unmount; client handles internal state
      client.unsubscribe();
    };
  }, [roomIdForInlet]);
  
  // Only inlet chat is supported for now
  const currentRoom = selectedRoom === 'inlet' ? { id: 'inlet', name: 'Inlet Chat' } : null;

  // Mobile view
  const handleMobileRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId);
    setShowMobileRoom(true);
  };

  return (
    <Suspense fallback={<div className="p-6 text-slate-400 animate-pulse">Loading chat...</div>}>
      <>
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col h-full">
        {/* Page Header with Vision */}
        <div className="px-6 py-4 border-b border-white/10 bg-slate-950">
          <div className="abfi-card-bg rounded-xl p-4 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="flex items-center justify-center gap-2 text-[15px] md:text-lg font-semibold tracking-wide">
                <span className="text-cyan-400">OBSERVATION</span>
                <span className="text-slate-400">→</span>
                <span className="text-emerald-400">COLLABORATION</span>
                <span className="text-slate-400">→</span>
                <span className="bg-gradient-to-r from-orange-400/80 to-amber-400/80 bg-clip-text text-transparent">WISDOM</span>
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed opacity-80">
                <span className="text-cyan-300">Local reports</span> share what's happening NOW.
                <span className="text-emerald-300 ml-1">Captain insights</span> reveal what WORKS.
                Together, they create <span className="bg-gradient-to-r from-orange-400/80 to-amber-400/80 bg-clip-text text-transparent font-semibold">real-time fishing wisdom</span> that helps everyone catch more.
              </p>
            </div>
          </div>
        </div>
        
        {/* Chat Layout */}
        <div className="flex flex-1 overflow-hidden">
          <RoomSidebar 
            selectedRoom={selectedRoom}
            onSelectRoom={setSelectedRoom}
          />
          <div className="flex-1">
            {selectedRoom === 'inlet' ? (
              roomIdForInlet ? (
                <ChatWindow 
                  roomId={roomIdForInlet}
                  showWeatherHeader={false}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium">Select an Inlet</p>
                    <p className="text-sm opacity-70">Use the inlet menu in the header to pick your inlet</p>
                  </div>
                </div>
              )
            ) : (
              <ChatWindow 
                roomId={selectedRoom}
                showWeatherHeader={false}
              />
            )}
          </div>
          {/* ContextPanel temporarily removed to avoid spinner; will re-enable after wiring */}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-full flex flex-col">
        {!showMobileRoom ? (
          // Room List
          <div className="h-full bg-slate-950 flex flex-col">
            {/* Mobile Header with Vision */}
            <div className="p-4 border-b border-cyan-500/20 bg-slate-950">
              <div className="abfi-card-bg rounded-xl p-3 mb-3">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                    <span className="text-cyan-400">OBSERVATION</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-emerald-400">COLLABORATION</span>
                    <span className="text-slate-400">→</span>
                    <span className="bg-gradient-to-r from-orange-400/80 to-amber-400/80 bg-clip-text text-transparent">WISDOM</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    <span className="text-cyan-300">Local reports</span> share what's happening NOW.
                    <span className="text-emerald-300 ml-1">Captain insights</span> reveal what WORKS.
                    Together, they create <span className="text-amber-300">real-time fishing wisdom</span> that helps everyone catch more.
                  </p>
                </div>
              </div>
              <h1 className="text-lg font-semibold text-white">Channels</h1>
            </div>
            <div className="overflow-y-auto">
              {/* Only show inlet chat for now */}
              <button
                onClick={() => handleMobileRoomSelect('inlet')}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors border-b border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">
                    {selectedInletId 
                      ? `${selectedInletId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} Chat`
                      : 'Inlet Chat'}
                  </span>
                </div>
              </button>
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
                <span className="text-xs text-slate-500">Chat</span>
              </div>
            </div>
            <div className="flex-1">
              {selectedRoom === 'inlet' && roomIdForInlet ? (
                <ChatWindow 
                  roomId={roomIdForInlet}
                  showWeatherHeader={false}
                />
              ) : (
                <ChatWindow 
                  roomId={selectedRoom}
                  showWeatherHeader={false}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
    </Suspense>
  );
}
