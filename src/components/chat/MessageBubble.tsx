'use client';

import React from 'react';
import type { ChatMessage } from '@/hooks/useInletChat';

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string;
}

export default function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isOwn = message.user_id === currentUserId;
  
  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content">
        {message.text}
      </div>
      <div className="message-time">
        {new Date(message.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
}
