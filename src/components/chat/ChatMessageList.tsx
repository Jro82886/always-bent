'use client';

import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import type { ChatMessage } from '@/hooks/useInletChat';

interface ChatMessageListProps {
  messages: ChatMessage[];
  inletName: string;
  currentUserId?: string;
}

export default function ChatMessageList({ messages, inletName, currentUserId }: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);
  
  return (
    <section className="chat-list" ref={listRef}>
      {messages.length === 0 ? (
        <div className="chat-empty">
          No messages yet in {inletName}. Be the first to say hello!
        </div>
      ) : (
        messages.map(message => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            currentUserId={currentUserId}
          />
        ))
      )}
    </section>
  );
}
