'use client';

import { useInletChat } from '@/hooks/useInletChat';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import '@/styles/chat.css';

interface UnifiedChatContainerProps {
  inletId: string;
  userId?: string;
  className?: string;
}

export default function UnifiedChatContainer({ 
  inletId, 
  userId,
  className = ''
}: UnifiedChatContainerProps) {
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
    <div className={`flex flex-col h-full ${className}`}>
      {/* Unified Header */}
      <ChatHeader 
        inletName={inletName} 
        inletColor={inletColor} 
        boatsOnline={boatsOnline} 
      />

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
  );
}
