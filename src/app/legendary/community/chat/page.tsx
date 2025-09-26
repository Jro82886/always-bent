'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
// import { MOCK_ROOMS } from '@/mocks/chat'; // TODO: Remove mock rooms
import { ChevronLeft } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { initChatClient } from '@/lib/services/chat';
import ErrorBoundary from '@/components/ErrorBoundary';
import PaneFallback from '@/components/chat/PaneFallback';
import { resolveInletSlug, getDemoMessage } from '@/lib/inlet';

// Dynamically import components to avoid SSR issues
const ChatTabs = dynamic(() => import('@/components/chat/ChatTabs'), {
  ssr: false,
  loading: () => <div className="h-12 bg-slate-900 animate-pulse" />
});

const PresenceStrip = dynamic(() => import('@/components/chat/PresenceStrip'), {
  ssr: false
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
  
  // Mock presence counts (replace with real data when available)
  const counts = {
    inlet: 5,
    offshore: 12,
    inshore: 8
  };
  
  // Generate presence text based on selected tab
  const presenceText =
    selectedTab === 'inlet' ? `${counts.inlet || 0} boats online` :
    selectedTab === 'offshore' ? `${counts.offshore || 0} boats in tuna chat` :
                                `${counts.inshore || 0} anglers inshore`;
  
  // Generate channel IDs based on tab selection
  const getChannelId = () => {
    switch (selectedTab) {
      case 'inlet':
        const inletSlug = resolveInletSlug(selectedInletId && selectedInletId !== 'overview' ? selectedInletId : null);
        return inletSlug ? `inlet:${inletSlug}` : null;
      case 'offshore':
        return 'offshore:tuna';
      case 'inshore':
        return 'inshore:general';
      default:
        return null;
    }
  };
  
  const channelId = getChannelId();
  const demoMessage = getDemoMessage();

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
        
        {/* Chat Layout */}
        <div className="flex-1 p-4">
          <ErrorBoundary fallback={<PaneFallback title="Couldn't load this inlet right now. Try again." />}>
            <section className="abfi-chat-pane h-full">
              <ChatTabs 
                selectedTab={selectedTab}
                onSelectTab={setSelectedTab}
                counts={counts}
              />
              <PresenceStrip text={presenceText} />
              {demoMessage && selectedTab === 'inlet' && (
                <div className="text-xs text-cyan-200/60 italic px-2">
                  {demoMessage}
                </div>
              )}
              {selectedTab === 'inlet' && !channelId ? (
                <div className="abfi-scroll grid place-items-center">
                  <div className="text-center text-cyan-200/80">
                    <div className="text-base mb-2">Pick an inlet to join its chat.</div>
                    <div className="text-xs opacity-70">Select an inlet from the top bar to connect with your local fleet.</div>
                  </div>
                </div>
              ) : channelId ? (
                <ChatWindow 
                  roomId={channelId}
                  showWeatherHeader={false}
                />
              ) : (
                <div className="abfi-scroll grid place-items-center">
                  <div className="text-center text-cyan-200/80">
                    <div className="text-base mb-2">Channel unavailable</div>
                  </div>
                </div>
              )}
            </section>
          </ErrorBoundary>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-full flex flex-col">
        {!showMobileRoom ? (
          // Room List
          <div className="h-full bg-slate-950 flex flex-col">
            {/* Mobile Header */}
            <div className="p-4 border-b border-cyan-500/20 bg-slate-950">
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
