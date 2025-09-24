'use client';

import { X } from 'lucide-react';
// Legacy hook quarantined; drawer should not import it anymore
import { flags } from '@/lib/flags';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import '@/styles/chat.css';

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
  if (!isOpen || !flags.communityDrawer || !inletId || inletId === 'overview') return null;

  // Use unified inlet chat hook
  const { 
    messages, 
    send, 
    boatsOnline, 
    connected, 
    inletName, 
    inletColor 
  } = useInletChat(inletId, userId);

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
            onSend={send}
            disabled={!connected}
          />
        )}
      </div>
    </>
  );
}
