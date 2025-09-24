'use client';

import React from 'react';
import type { ChatMessage } from '@/lib/services/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string;
}

export default function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isOwn = message.user === currentUserId;
  
  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content">
        {message.text}
      </div>
      <div className="message-time">
        {new Date(message.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
}
