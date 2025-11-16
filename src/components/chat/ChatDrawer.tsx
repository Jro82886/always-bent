'use client';

import { X } from 'lucide-react';
// Live hooks/services
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { flags } from '@/lib/flags';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import '@/styles/chat.css';
import { getInletById } from '@/lib/inlets';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inletId: string | null;
  userId?: string;
  userName?: string;
}

export default function ChatDrawer({
  isOpen,
  onClose,
  inletId,
  userId,
  userName = 'Anonymous'
}: ChatDrawerProps) {
  // Map inlet to roomId and use realtime hooks (always call hooks)
  const roomId = inletId ? `inlet:${inletId}` : '';
  const { messages, sendMessage, isConnected } = useRealtimeChat(roomId);
  const { onlineUsers } = useOnlinePresence(roomId);
  const boatsOnline = onlineUsers.length;
  const inlet = inletId ? getInletById(inletId) : null;
  const inletName = inlet?.name ?? 'Inlet';
  const inletColor = inlet?.color ?? '#999';

  // Don't render if conditions not met
  if (!isOpen || !flags.communityDrawer || !inletId || inletId === 'overview') {
    return null;
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`
        fixed z-50 bg-slate-950/95 backdrop-blur-xl border-l border-cyan-500/20
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}

        /* Desktop: right sidebar */
        lg:right-0 lg:top-0 lg:h-full lg:w-96

        /* Mobile: bottom sheet */
        right-0 bottom-0 left-0 h-[80vh] rounded-t-2xl lg:rounded-none

        /* Flex layout */
        flex flex-col
      `}>
        {/* Unified Header */}
        <div className="relative">
          <ChatHeader 
            inletName={inletName} 
            inletColor={inletColor} 
            boatsOnline={boatsOnline} 
          />
          
          {/* Close button overlay */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Messages List */}
        <ChatMessageList 
          messages={messages} 
          inletName={inletName}
          currentUserId={userId}
        />

        {/* Input */}
        {!userId ? (
          <div className="p-4 border-t border-cyan-500/20 text-center text-slate-400">
            <p className="text-sm">Please sign in to send messages</p>
          </div>
        ) : (
          <ChatInput 
            inletName={inletName}
            inletColor={inletColor}
            onSend={sendMessage}
            disabled={!isConnected}
          />
        )}
      </div>
    </>
  );
}
