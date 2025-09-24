'use client';

// Legacy inlet-only chat removed from UI; using ChatWindowLive elsewhere
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
  // Component is unused after MVP; keep placeholder props to avoid build errors
  const messages: any[] = [];
  const send = async () => {};
  const boatsOnline = 0;
  const connected = false;
  const inletName = 'Inlet';
  const inletColor = '#999';

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
