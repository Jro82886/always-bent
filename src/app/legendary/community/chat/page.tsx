'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
// import { MOCK_ROOMS } from '@/mocks/chat'; // TODO: Remove mock rooms
import { ChevronLeft } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { initChatClient } from '@/lib/services/chat';
import ErrorBoundary from '@/components/ErrorBoundary';
import PaneFallback from '@/components/chat/PaneFallback';

// Dynamically import components to avoid SSR issues
const ChatTabs = dynamic(() => import('@/components/chat/ChatTabs'), {
  ssr: false,
  loading: () => <div className="h-12 bg-slate-900 animate-pulse" />
});

// Use live chat window (useRealtimeChat) — no mocks
const ChatWindow = dynamic(() => import('@/components/chat/ChatWindowLive'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-slate-950 animate-pulse" />
});

const WeatherHeader = dynamic(() => import('@/components/chat/WeatherHeader'), {
  ssr: false
});

export default function ChatPage() {
  const { selectedInletId, user } = useAppState();
  const [selectedTab, setSelectedTab] = useState<'inlet' | 'offshore' | 'inshore'>('inlet');
  const [showMobileRoom, setShowMobileRoom] = useState(false);
  const clientRef = useRef<ReturnType<typeof initChatClient> | null>(null);
  
  // Generate channel IDs based on tab selection
  const getChannelId = () => {
    switch (selectedTab) {
      case 'inlet':
        return selectedInletId && selectedInletId !== 'overview' 
          ? `inlet:${selectedInletId}` 
          : null;
      case 'offshore':
        return 'offshore:tuna';
      case 'inshore':
        return 'inshore:general';
      default:
        return null;
    }
  };
  
  const channelId = getChannelId();

  // Auto-join/leave rooms on channel change
  useEffect(() => {
    const client = initChatClient();
    clientRef.current = client;

    // Subscribe to current channel
    if (channelId) {
      client.subscribe(channelId, () => {});
    }

    return () => {
      // Leave all on unmount; client handles internal state
      client.unsubscribe();
    };
  }, [channelId]);

  // Mobile view
  const handleMobileTabSelect = (tab: 'inlet' | 'offshore' | 'inshore') => {
    setSelectedTab(tab);
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
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatTabs 
            selectedTab={selectedTab}
            onSelectTab={setSelectedTab}
            hasInlet={!!selectedInletId && selectedInletId !== 'overview'}
          />
          <div className="flex-1">
            <ErrorBoundary fallback={<PaneFallback title="Couldn't load this inlet right now. Try again." />}>
              {selectedTab === 'inlet' && !channelId ? (
                <PaneFallback title="Pick an inlet to join its chat" />
              ) : channelId ? (
                <ChatWindow 
                  roomId={channelId}
                  showWeatherHeader={false}
                />
              ) : (
                <PaneFallback title="Channel unavailable" />
              )}
            </ErrorBoundary>
          </div>
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
              <button
                onClick={() => handleMobileTabSelect('inlet')}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors border-b border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">
                    {selectedInletId && selectedInletId !== 'overview'
                      ? `${selectedInletId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} Chat`
                      : 'Inlet Chat'}
                  </span>
                </div>
              </button>
              <button
                onClick={() => handleMobileTabSelect('offshore')}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors border-b border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">Tuna (Offshore)</span>
                </div>
              </button>
              <button
                onClick={() => handleMobileTabSelect('inshore')}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors border-b border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">Inshore</span>
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
                <h2 className="text-white font-medium flex-1">
                  {selectedTab === 'inlet' 
                    ? (selectedInletId && selectedInletId !== 'overview' 
                        ? `${selectedInletId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} Chat`
                        : 'Inlet Chat')
                    : selectedTab === 'offshore' 
                      ? 'Tuna (Offshore)' 
                      : 'Inshore'}
                </h2>
                <span className="text-xs text-slate-500">Chat</span>
              </div>
            </div>
            <div className="flex-1">
              <ErrorBoundary fallback={<PaneFallback title="Couldn't load this inlet right now. Try again." />}>
                {selectedTab === 'inlet' && !channelId ? (
                  <PaneFallback title="Pick an inlet to join its chat" />
                ) : channelId ? (
                  <ChatWindow 
                    roomId={channelId}
                    showWeatherHeader={false}
                  />
                ) : (
                  <PaneFallback title="Channel unavailable" />
                )}
              </ErrorBoundary>
            </div>
          </div>
        )}
      </div>
    </>
    </Suspense>
  );
}
